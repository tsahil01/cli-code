import { useCallback } from 'react';
import { Message, SelectedFile, ChatRequest, FunctionCall, ModelData, Plan, MessageMetadata } from '../types.js';
import { chat } from '../lib/chat.js';

interface UseChatProps {
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setThinking: React.Dispatch<React.SetStateAction<string>>;
    setContent: React.Dispatch<React.SetStateAction<string>>;
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentToolCall: React.Dispatch<React.SetStateAction<FunctionCall | null>>;
    modelData: ModelData | null;
    plan: Plan;
    handleToolCall: (toolCall: FunctionCall, metadata: MessageMetadata) => Promise<void>;
}

export function useChat({ setMessages, setThinking, setContent, setIsProcessing, setCurrentToolCall, modelData, plan, handleToolCall }: UseChatProps) {
    const handleSend = useCallback(async (msgs: Message[]) => {
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
            await chat(
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
    }, [modelData, plan, setMessages, setThinking, setContent, setIsProcessing, setCurrentToolCall, handleToolCall]);

    const handleNewMsgSend = useCallback(async (message: string, files: SelectedFile[]) => {
        if (message.startsWith("/")) {
            return;
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
    }, [modelData, setMessages, setThinking, setContent, setIsProcessing, setCurrentToolCall, handleSend]);

    return {
        handleSend,
        handleNewMsgSend,
    };
}