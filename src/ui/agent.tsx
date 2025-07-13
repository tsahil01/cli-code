import React, { useState, useEffect } from 'react';
import { Header, ChatInput, ToolStatusDisplay, PlanDisplay, PlanDialog } from "./components/index.js";
import { Command, SelectedFile, Message, ChatRequest, ModelData, FunctionCall, AnthropicFunctionCall, GeminiFunctionCall, CommandResponse, ConfigFormat, ToolCallStatus, Plan, MessageMetadata, OpenAIFunctionCall, ModelCapabilities } from "../types.js";
import { MessageDisplay } from './components/message-display.js';
import { CommandModal } from './components/command-modal.js';
import { ToolConfirmationDialog } from './components/tool-confirmation-dialog.js';
import { useInput } from 'ink';
import { systemCmds } from '../lib/systemCmds.js';
import { chat } from '../lib/chat.js';
import { runTool } from '../lib/tools.js';
import { readConfigFile, appendConfigFile } from '../lib/configMngt.js';
import { getAvailableModels } from '../lib/models.js';

export function Agent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeCommand, setActiveCommand] = useState<Command | null>(null);
    const [thinking, setThinking] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [pendingToolCall, setPendingToolCall] = useState<FunctionCall | null>(null);
    const [currentToolCall, setCurrentToolCall] = useState<FunctionCall | null>(null);
    const [toolCallHistory, setToolCallHistory] = useState<ToolCallStatus[]>([]);
    const [modelData, setModelData] = useState<ModelData | null>(null);
    const [plan, setPlan] = useState<Plan>({ mode: 'lite', addOns: [] });
    const [showPlanDialog, setShowPlanDialog] = useState<boolean>(false);

    useEffect(() => {
        const loadConfigAndModels = async () => {
            try {
                const config = await readConfigFile();
                if (config.plan) {
                    setPlan(config.plan);
                } else {
                    const defaultPlan: Plan = { mode: 'lite', addOns: [] };
                    setPlan(defaultPlan);
                    await appendConfigFile({ plan: defaultPlan });
                }

                const availableModels = await getAvailableModels();
                
                if (config.selectedModel && availableModels.length > 0) {
                    const savedModel = availableModels.find(m => 
                        m.provider === config.selectedModel?.provider && 
                        m.modelName === config.selectedModel?.model
                    );
                    
                    if (savedModel) {
                        setModelData({
                            provider: savedModel.provider as ModelData['provider'],
                            model: savedModel.modelName,
                            modelCapabilities: savedModel
                        });
                    } else if (availableModels.length > 0) {
                        const firstModel = availableModels[0];
                        setModelData({
                            provider: firstModel.provider as ModelData['provider'],
                            model: firstModel.modelName,
                            modelCapabilities: firstModel
                        });
                        
                        await appendConfigFile({ 
                            selectedModel: {
                                provider: firstModel.provider,
                                model: firstModel.modelName
                            }
                        });
                    }
                } else if (availableModels.length > 0) {
                    const firstModel = availableModels[0];
                    setModelData({
                        provider: firstModel.provider as ModelData['provider'],
                        model: firstModel.modelName,
                        modelCapabilities: firstModel
                    });
                    
                    await appendConfigFile({ 
                        selectedModel: {
                            provider: firstModel.provider,
                            model: firstModel.modelName
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading config and models:', error);
            }
        };

        loadConfigAndModels();
    }, []);

    useInput((input, key) => {
        if (key.escape && activeCommand) {
            setActiveCommand(null);
        } else if (key.escape && showPlanDialog) {
            setShowPlanDialog(false);
        }
    });

    const generateToolCallId = (toolCall: FunctionCall) => {
        const toolName = (toolCall as AnthropicFunctionCall).name ||
            (toolCall as GeminiFunctionCall).name ||
            (toolCall as OpenAIFunctionCall).function?.name ||
            'unknown_tool';

        const existingId = (toolCall as any).id;
        if (existingId) return existingId;

        const args = (toolCall as AnthropicFunctionCall).input ||
            (toolCall as GeminiFunctionCall).args ||
            (toolCall as OpenAIFunctionCall).function?.arguments || {};
        const argsString = JSON.stringify(args);

        const hashString = `${toolName}_${argsString}`;
        let hash = 0;
        for (let i = 0; i < hashString.length; i++) {
            const char = hashString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `tool_${Math.abs(hash)}_${toolName}`;
    };

    const addToolCallStatus = (toolCall: FunctionCall, status: 'pending' | 'success' | 'error', errorMessage?: string) => {
        const toolName = (toolCall as AnthropicFunctionCall).name ||
            (toolCall as GeminiFunctionCall).name ||
            (toolCall as OpenAIFunctionCall).function?.name ||
            'unknown_tool';

        const toolCallId = generateToolCallId(toolCall);

        setToolCallHistory(prev => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(tc => tc.id === toolCallId);

            if (existingIndex >= 0) {
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    status,
                    errorMessage: errorMessage || updated[existingIndex].errorMessage
                };
            } else {
                updated.push({
                    id: toolCallId,
                    name: toolName,
                    status,
                    timestamp: Date.now(),
                    errorMessage
                });
            }
            return updated.slice(-10);
        });
    };

    async function handleChatEndpoint(chatRequest: ChatRequest) {
        return await chat(
            chatRequest,
            0,
            (thinking) => setThinking(thinking),
            (content) => setContent(content),
            (toolCalls: FunctionCall[]) => {
                if (toolCalls.length > 0) {
                    setCurrentToolCall(toolCalls[0]);
                }
            },
            async (finalContent, metadata) => {
                setMessages(prev => [...prev, {
                    content: finalContent,
                    role: 'assistant',
                    metadata: {
                        thinkingContent: metadata.thinkingContent,
                        thinkingSignature: metadata.thinkingSignature,
                        toolCalls: metadata.toolCalls || []
                    }
                }]);
                if (metadata.toolCalls && metadata.toolCalls.length > 0) {
                    setCurrentToolCall(metadata.toolCalls[0]);
                    await handleToolCall(metadata.toolCalls[0], metadata);
                }
            },
            () => {
                setIsProcessing(false);
                // setThinking('');
                setContent('');
                setCurrentToolCall(null);
            }
        );
    }

    const handleToolCall = async (toolCall: FunctionCall, metadata: MessageMetadata) => {
        const config = await readConfigFile();

        if (config.acceptAllToolCalls) {
            try {
                setCurrentToolCall(toolCall);
                addToolCallStatus(toolCall, 'pending');
                const result = await runTool(toolCall);
                addToolCallStatus(toolCall, 'success');

                const content = JSON.stringify(result, null, 2);

                let newMsg: Message = {
                    content: content,
                    role: 'user',
                    ignoreInDisplay: true,
                    metadata: {
                        toolCalls: [toolCall],
                        thinkingSignature: metadata.thinkingSignature
                    }
                }
                setMessages(prev => {
                    const updatedMessages = [...prev, newMsg];
                    setTimeout(() => handleSend(updatedMessages), 0);
                    return updatedMessages;
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                addToolCallStatus(toolCall, 'error', errorMessage);
                const errorMsg: Message = {
                    content: `Tool execution failed: ${errorMessage}`,
                    role: 'user',
                    ignoreInDisplay: true,
                    metadata: {
                        toolCalls: [toolCall],
                        thinkingSignature: metadata.thinkingSignature
                    }
                }
                setMessages(prev => {
                    const updatedMessages = [...prev, errorMsg];
                    setTimeout(() => handleSend(updatedMessages), 0);
                    return updatedMessages;
                });
            } finally {
                setCurrentToolCall(null);
            }
            return;
        }

        setPendingToolCall(toolCall);
    };

    const handleToolConfirmation = {
        accept: async () => {
            if (!pendingToolCall) return;
            try {
                setCurrentToolCall(pendingToolCall);
                addToolCallStatus(pendingToolCall, 'pending');
                const result = await runTool(pendingToolCall);
                addToolCallStatus(pendingToolCall, 'success');

                const content = JSON.stringify(result, null, 2);

                let newMsg: Message = {
                    content: content,
                    role: 'user',
                    ignoreInDisplay: true,
                    metadata: {
                        toolCalls: [pendingToolCall]
                    }
                }
                setMessages(prev => {
                    const updatedMessages = [...prev, newMsg];
                    setTimeout(() => handleSend(updatedMessages), 0);
                    return updatedMessages;
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                addToolCallStatus(pendingToolCall, 'error', errorMessage);
                const errorMsg: Message = {
                    content: `Tool execution failed: ${errorMessage}`,
                    role: 'user',
                    ignoreInDisplay: true,
                    metadata: {
                        toolCalls: [pendingToolCall]
                    }
                }
                setMessages(prev => {
                    const updatedMessages = [...prev, errorMsg];
                    setTimeout(() => handleSend(updatedMessages), 0);
                    return updatedMessages;
                });
            } finally {
                setPendingToolCall(null);
                setCurrentToolCall(null);
            }
        },
        acceptAll: async () => {
            if (!pendingToolCall) return;
            await appendConfigFile({ acceptAllToolCalls: true });
            await handleToolConfirmation.accept();
        },
        reject: () => {
            setPendingToolCall(null);
            let newMsg: Message = {
                content: "Tool call was rejected by the user.",
                role: 'user',
                ignoreInDisplay: true
            }
            setMessages(prev => {
                const updatedMessages = [...prev, newMsg];
                setTimeout(() => handleSend(updatedMessages), 0);
                return updatedMessages;
            });
        }
    };

    const handleNewMsgSend = async (message: string, files: SelectedFile[]) => {
        if (message.startsWith("/")) {
            const commandName = message.slice(1);
            const command = systemCmds.find(cmd => cmd.name === commandName);
            if (command) {
                if (command.name === 'exit') {
                    process.exit(0);
                } else if (command.name === 'mode') {
                    setShowPlanDialog(true);
                } else {
                    setActiveCommand(command);
                }
                return;
            }
        }

        const userMessage = files.length > 0
            ? message + `\n\n\nI have attached files for your reference: ${files.map(f => f.path).join(", ")}.`
            : message;

        setIsProcessing(true);
        setThinking('');
        setContent('');

        setMessages(prev => {
            const updatedMessages = [...prev, { content: userMessage, role: 'user' as const }];

            setTimeout(async () => {
                if (!modelData) {
                    return;
                }
                try {
                    const chatRequest: ChatRequest = {
                        messages: updatedMessages,
                        provider: modelData?.provider,
                        model: modelData?.model,
                        plan: plan // Include plan in chat request
                    };

                    await handleChatEndpoint(chatRequest);

                } catch (error) {
                    console.error('Chat error:', error);
                    setMessages(prev => [...prev, {
                        content: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
                        role: 'system',
                        ignoreInLLM: true
                    }]);
                    setIsProcessing(false);
                    setThinking('');
                    setContent('');
                    setCurrentToolCall(null);
                }
            }, 0);

            return updatedMessages;
        });
    }

    const handleSend = async (msgs: Message[]) => {
        setIsProcessing(true);
        setThinking('');
        setContent('');

        try {
            if (!modelData) {
                return;
            }
            const chatRequest: ChatRequest = {
                messages: msgs,
                provider: modelData?.provider,
                model: modelData?.model,
                plan: plan
            };

            await handleChatEndpoint(chatRequest);

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                content: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
                role: 'system',
                ignoreInLLM: true
            }]);
            setIsProcessing(false);
            setThinking('');
            setContent('');
            setCurrentToolCall(null);
        }
    }

    const handleModelSelect = async (model: ModelCapabilities) => {
        setModelData({
            provider: model.provider as ModelData['provider'],
            model: model.modelName,
            modelCapabilities: model
        });
        
        try {
            await appendConfigFile({ 
                selectedModel: {
                    provider: model.provider,
                    model: model.modelName
                }
            });
        } catch (error) {
            console.error('Error saving selected model:', error);
        }
        
        setMessages(prev => [...prev, {
            content: `Model changed to ${model.displayName} (${model.provider})`,
            role: 'system',
            ignoreInLLM: true
        }]);
    };

    return (
        <>
            <Header />
            <MessageDisplay
                messages={messages}
                thinking={thinking}
                currentContent={content}
                isProcessing={isProcessing}
            />
            {pendingToolCall && (
                <ToolConfirmationDialog
                    toolCall={pendingToolCall}
                    onAccept={handleToolConfirmation.accept}
                    onAcceptAll={handleToolConfirmation.acceptAll}
                    onReject={handleToolConfirmation.reject}
                />
            )}
            <ToolStatusDisplay toolCalls={toolCallHistory} />
            <PlanDisplay plan={plan} />
            <ChatInput
                onSend={handleNewMsgSend}
                commands={systemCmds}
                isProcessing={isProcessing}
                isDisabled={!!activeCommand || !!pendingToolCall || showPlanDialog}
                currentToolCall={currentToolCall}
                currentModel={modelData}
            />
            {activeCommand && (
                <CommandModal
                    command={activeCommand}
                    onClose={() => setActiveCommand(null)}
                    onModelSelect={handleModelSelect}
                    currentModel={modelData}
                />
            )}
            {showPlanDialog && (
                <PlanDialog
                    currentPlan={plan}
                    onSave={(newPlan) => {
                        setPlan(newPlan);
                        appendConfigFile({ plan: newPlan });
                        setShowPlanDialog(false);
                    }}
                    onCancel={() => setShowPlanDialog(false)}
                />
            )}
        </>
    );
}