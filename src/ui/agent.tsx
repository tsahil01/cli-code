import React, { useState } from 'react';
import { Header, ChatInput } from "./components/index.js";
import { Command, SelectedFile, Message, ChatRequest, ModelData, FunctionCall, AnthropicFunctionCall, GeminiFunctionCall, CommandResponse } from "../types.js";
import { MessageDisplay } from './components/message-display.js';
import { CommandModal } from './components/command-modal.js';
import { useInput } from 'ink';
import { systemCmds } from '../lib/systemCmds.js';
import { chat } from '../lib/chat.js';


export function Agent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeCommand, setActiveCommand] = useState<Command | null>(null);
    const [thinking, setThinking] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [modelData, setModelData] = useState<ModelData>({
        provider: 'gemini',
        model: 'gemini-2.5-flash'
    });
    const [toolCalls, setToolCalls] = useState<FunctionCall[]>([]);

    useInput((input, key) => {
        if (key.escape && activeCommand) {
            setActiveCommand(null);
        }
    });



    const handleCommandExecute = (command: Command, options: Record<string, any>) => {
        switch (command.name) {
            case 'model':
                setMessages(prev => [...prev, {
                    content: `Switched to model: ${options.model}`,
                    role: 'system',
                    ignoreInLLM: true
                }]);
                break;
            case 'sessions':
                setMessages(prev => [...prev, {
                    content: `Loading session: ${options.session}`,
                    role: 'system',
                    ignoreInLLM: true
                }]);
                break;
            case 'new':
                setMessages([]);
                setMessages([{
                    content: "Started a new chat session",
                    role: 'system',
                    ignoreInLLM: true
                }]);
                break;
        }
    };

    const handleSend = async (message: string, files: SelectedFile[]) => {
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
            };

            await chat(
                chatRequest,
                0,
                (thinking) => setThinking(thinking),
                (content) => setContent(content),
                (toolCalls: FunctionCall[]) => {
                    console.log("toolCalls:", toolCalls);
                    setToolCalls(toolCalls);
                },
                (finalContent, metadata) => {
                    console.log("finalContent:", finalContent);
                    console.log("metadata:", metadata);
                    setMessages(prev => [...prev, {
                        content: finalContent,
                        role: 'assistant',
                        metadata: {
                            thinking: metadata.thinkingContent,
                            toolCalls: metadata.toolCalls || []
                        }
                    }]);
                },
                () => {
                    setIsProcessing(false);
                    setThinking('');
                    setContent('');
                }
            );
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
            />
            <ChatInput onSend={handleSend} commands={systemCmds} />
            {activeCommand && (
                <CommandModal
                    command={activeCommand}
                    onClose={() => setActiveCommand(null)}
                    onExecute={handleCommandExecute}
                />
            )}
        </>
    );
}