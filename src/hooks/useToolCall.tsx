import { useState } from 'react';
import { FunctionCall, AnthropicFunctionCall, GeminiFunctionCall, OpenAIFunctionCall, ToolCallStatus, Message, MessageMetadata } from '../types.js';
import { runTool } from '../lib/tools.js';
import { readConfigFile, appendConfigFile } from '../lib/configMngt.js';

export function useToolCall({ setMessages, handleSend, setIsProcessing }: {
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    handleSend: (msgs: Message[]) => Promise<void>,
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const [pendingToolCall, setPendingToolCall] = useState<FunctionCall | null>(null);
    const [currentToolCall, setCurrentToolCall] = useState<FunctionCall | null>(null);
    const [toolCallHistory, setToolCallHistory] = useState<ToolCallStatus[]>([]);

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
            const existingIndex = prev.findIndex(call => call.id === toolCallId);
            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    status,
                    timestamp: Date.now(),
                    errorMessage
                };
                return updated.slice(-10);
            } else {
                const updated = [
                    ...prev,
                    {
                        id: toolCallId,
                        name: toolName,
                        status,
                        timestamp: Date.now(),
                        errorMessage
                    }
                ];
                return updated.slice(-10);
            }
        });
    };

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

    return {
        pendingToolCall,
        setPendingToolCall,
        currentToolCall,
        setCurrentToolCall,
        toolCallHistory,
        addToolCallStatus,
        handleToolCall,
        handleToolConfirmation,
    };
}
