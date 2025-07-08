import React, { useState, useEffect } from 'react';
import { Header, ChatInput, ToolStatusDisplay } from "./components/index.js";
import { Command, SelectedFile, Message, ChatRequest, ModelData, FunctionCall, AnthropicFunctionCall, GeminiFunctionCall, CommandResponse, ConfigFormat, ToolCallStatus } from "../types.js";
import { MessageDisplay } from './components/message-display.js';
import { CommandModal } from './components/command-modal.js';
import { ToolConfirmationDialog } from './components/tool-confirmation-dialog.js';
import { useInput } from 'ink';
import { systemCmds } from '../lib/systemCmds.js';
import { chat } from '../lib/chat.js';
import { runTool } from '../lib/tools.js';
import { readConfigFile, appendConfigFile } from '../lib/configMngt.js';

export function Agent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeCommand, setActiveCommand] = useState<Command | null>(null);
    const [thinking, setThinking] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [pendingToolCall, setPendingToolCall] = useState<FunctionCall | null>(null);
    const [currentToolCall, setCurrentToolCall] = useState<FunctionCall | null>(null);
    const [toolCallHistory, setToolCallHistory] = useState<ToolCallStatus[]>([]);
    const [modelData, setModelData] = useState<ModelData>({
        provider: 'gemini',
        model: 'gemini-2.5-pro',
    });

    useInput((input, key) => {
        if (key.escape && activeCommand) {
            setActiveCommand(null);
        }
    });

    const generateToolCallId = (toolCall: FunctionCall) => {
        const toolName = (toolCall as AnthropicFunctionCall).name || 
                        (toolCall as GeminiFunctionCall).functionCall?.name || 
                        (toolCall as any).function?.name || 
                        'unknown_tool';
        
        const existingId = (toolCall as any).id;
        if (existingId) return existingId;
        
        const args = (toolCall as AnthropicFunctionCall).input || 
                    (toolCall as GeminiFunctionCall).functionCall?.args || 
                    (toolCall as any).function?.arguments || {};
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
                        (toolCall as GeminiFunctionCall).functionCall?.name || 
                        (toolCall as any).function?.name || 
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
                        toolCalls: metadata.toolCalls || []
                    }
                }]);
                if (metadata.toolCalls && metadata.toolCalls.length > 0) {
                    setCurrentToolCall(metadata.toolCalls[0]);
                    await handleToolCall(metadata.toolCalls[0]);
                }
            },
            () => {
                setIsProcessing(false);
                setThinking('');
                setContent('');
                setCurrentToolCall(null);
            }
        );
    }

    const handleToolCall = async (toolCall: FunctionCall) => {
        const config = await readConfigFile();

        if (config.acceptAllToolCalls) {
            try {
                setCurrentToolCall(toolCall);
                addToolCallStatus(toolCall, 'pending');
                console.log('Executing tool call:', toolCall);
                const result = await runTool(toolCall);
                addToolCallStatus(toolCall, 'success');
                let newMsg: Message = {
                    content: JSON.stringify(result, null, 2),
                    role: 'user',
                    ignoreInDisplay: true
                }
                setMessages(prev => [...prev, newMsg]);
                handleSend([...messages, newMsg]);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                addToolCallStatus(toolCall, 'error', errorMessage);
                const errorMsg: Message = {
                    content: `Tool execution failed: ${errorMessage}`,
                    role: 'user',
                    ignoreInDisplay: true
                }
                setMessages(prev => [...prev, errorMsg]);
                handleSend([...messages, errorMsg]);
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
                console.log('Executing tool call:', pendingToolCall);
                const result = await runTool(pendingToolCall);
                addToolCallStatus(pendingToolCall, 'success');
                let newMsg: Message = {
                    content: JSON.stringify(result, null, 2),
                    role: 'user',
                    ignoreInDisplay: true
                }
                handleSend([...messages, newMsg]);
                setMessages(prev => [...prev, newMsg]);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                addToolCallStatus(pendingToolCall, 'error', errorMessage);
                const errorMsg: Message = {
                    content: `Tool execution failed: ${errorMessage}`,
                    role: 'user'
                }
                setMessages(prev => [...prev, errorMsg]);
                handleSend([...messages, errorMsg]);
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
            setMessages(prev => [...prev, newMsg]);
            handleSend([...messages, newMsg]);
        }
    };

    const handleNewMsgSend = async (message: string, files: SelectedFile[]) => {
        if (message.startsWith("/")) {
            const commandName = message.slice(1);
            const command = systemCmds.find(cmd => cmd.name === commandName);
            if (command) {
                if (command.name === 'exit') {
                    process.exit(0);
                } else {
                    setActiveCommand(command);
                }
                return;
            }
        }

        const userMessage = files.length > 0
            ? message + `\n\n\nI have attached files for your reference: ${files.map(f => f.path).join(", ")}.`
            : message;

        setMessages(prev => [...prev, { content: userMessage, role: 'user' }]);
        setIsProcessing(true);
        setThinking('');
        setContent('');

        try {
            const chatRequest: ChatRequest = {
                messages: [...messages, { content: userMessage, role: 'user' }],
                provider: modelData?.provider,
                model: modelData?.model,
                base_url: "https://openrouter.ai/api/v1"
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

    const handleSend = async (msgs: Message[]) => {
        setIsProcessing(true);
        setThinking('');
        setContent('');

        try {
            const chatRequest: ChatRequest = {
                messages: msgs,
                provider: modelData?.provider,
                model: modelData?.model,
                base_url: "https://openrouter.ai/api/v1"
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

    return (
        <>
            <Header cmds={systemCmds} />
            <MessageDisplay
                messages={messages}
                thinking={thinking}
                currentContent={content}
                isProcessing={isProcessing}
                currentToolCall={currentToolCall}
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
            <ChatInput
                onSend={handleNewMsgSend}
                commands={systemCmds}
                isProcessing={isProcessing}
                currentToolCall={currentToolCall}
            />
            {activeCommand && (
                <CommandModal
                    command={activeCommand}
                    onClose={() => setActiveCommand(null)}
                />
            )}
        </>
    );
}