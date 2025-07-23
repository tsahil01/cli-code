import React, { useState, useEffect } from 'react';
import { Header, ChatInput, ToolStatusDisplay } from "./components/index.js";
import { Command, SelectedFile, Message, ChatRequest, FunctionCall, Plan } from "../types.js";
import { MessageDisplay } from './components/message-display.js';
import { CommandModal } from './components/command-modal.js';
import { useInput } from 'ink';
import { systemCmds } from '../lib/systemCmds.js';
import { chat } from '../lib/chat.js';
import { readConfigFile, appendConfigFile } from '../lib/configMngt.js';
import { getAvailableModels } from '../lib/models.js';
import { useToolCall } from '../hooks/useToolCall.js';
import { useModelSelection } from '../hooks/useModelSelection.js';
import { usePlan } from '../hooks/usePlan.js';
import { PendingToolCallDialog } from './components/pending-tool-call-dialog.js';
import { PlanDialogWrapper } from './components/plan-dialog-wrapper.js';
import { ApiKeyPromptWrapper } from './components/api-key-prompt-wrapper.js';

export function Agent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeCommand, setActiveCommand] = useState<Command | null>(null);
    const [thinking, setThinking] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const {
        plan,
        setPlan,
        showPlanDialog,
        setShowPlanDialog,
    } = usePlan();

    const {
        modelData,
        setModelData,
        showApiKeyPrompt,
        setShowApiKeyPrompt,
        pendingModel,
        setPendingModel,
        handleModelSelect,
        handleApiKeyPromptComplete,
        handleApiKeyPromptCancel,
    } = useModelSelection({ setMessages });

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
                sdk: modelData?.modelCapabilities.sdk,
                provider: modelData?.provider,
                model: modelData?.model,
                plan: plan
            };

            await handleChatEndpoint(chatRequest);

        } catch (error) {
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
    const {
        pendingToolCall,
        setPendingToolCall,
        currentToolCall,
        setCurrentToolCall,
        toolCallHistory,
        addToolCallStatus,
        handleToolCall,
        handleToolConfirmation,
    } = useToolCall({ setMessages, handleSend, setIsProcessing });

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
                        m.modelName === config.selectedModel?.model &&
                        m.sdk === config.selectedModel.sdk
                    );
                    if (savedModel) {
                        setModelData({
                            provider: savedModel.provider,
                            model: savedModel.modelName,
                            sdk: savedModel.sdk,
                            modelCapabilities: savedModel
                        });
                    } else if (availableModels.length > 0) {
                        setMessages([{
                            content: "Welcome to CLI Code! Please select a model to get started.",
                            role: 'system',
                            ignoreInLLM: true
                        }]);
                        const modelCommand = systemCmds.find(cmd => cmd.name === 'model');
                        if (modelCommand) {
                            setActiveCommand(modelCommand);
                        }
                    }
                } else if (availableModels.length > 0) {
                    setMessages([{
                        content: "Welcome to CLI Code! Please select a model to get started.",
                        role: 'system',
                        ignoreInLLM: true
                    }]);
                    const modelCommand = systemCmds.find(cmd => cmd.name === 'model');
                    if (modelCommand) {
                        setActiveCommand(modelCommand);
                    }
                } else {
                    setMessages([{
                        content: "No models available. Please check your backend configuration.",
                        role: 'system',
                        ignoreInLLM: true
                    }]);
                }
            } catch (error) {
                setMessages([{
                    content: "Error loading configuration. Please try again.",
                    role: 'system',
                    ignoreInLLM: true
                }]);
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
                setContent('');
                setCurrentToolCall(null);
            }
        );
    }

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
                        sdk: modelData?.modelCapabilities.sdk,
                        provider: modelData?.provider,
                        model: modelData?.model,
                        plan: plan
                    };
                    await handleSend(updatedMessages);
                } catch (error) {
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

    return (
        <>
            <Header />
            <MessageDisplay
                messages={messages}
                thinking={thinking}
                currentContent={content}
                isProcessing={isProcessing}
            />
            <PendingToolCallDialog
                pendingToolCall={pendingToolCall}
                handleToolConfirmation={handleToolConfirmation}
            />
            <ToolStatusDisplay toolCalls={toolCallHistory} />
            <ChatInput
                onSend={handleNewMsgSend}
                commands={systemCmds}
                isProcessing={isProcessing}
                isDisabled={!!activeCommand || !!pendingToolCall || showPlanDialog || showApiKeyPrompt}
                currentToolCall={currentToolCall}
                currentModel={modelData}
                plan={plan}
            />
            {activeCommand && (
                <CommandModal
                    command={activeCommand}
                    onClose={() => setActiveCommand(null)}
                    onModelSelect={handleModelSelect}
                    currentModel={modelData}
                />
            )}
            <PlanDialogWrapper
                plan={plan}
                setPlan={setPlan}
                showPlanDialog={showPlanDialog}
                setShowPlanDialog={setShowPlanDialog}
            />
            <ApiKeyPromptWrapper
                showApiKeyPrompt={showApiKeyPrompt}
                pendingModel={pendingModel}
                handleApiKeyPromptComplete={handleApiKeyPromptComplete}
                handleApiKeyPromptCancel={handleApiKeyPromptCancel}
            />
        </>
    );
}