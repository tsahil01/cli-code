import React, { useState } from 'react';
import { Header, ChatInput } from "./components/index.js";
import { Command, SelectedFile, Message } from "../types.js";
import { MessageDisplay } from './components/message-display.js';
import { CommandModal } from './components/command-modal.js';
import { useInput } from 'ink';
import { systemCmds } from '../lib/systemCmds.js';

export function Agent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeCommand, setActiveCommand] = useState<Command | null>(null);
    
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
                    type: 'system',
                    ignoreInLLM: true
                }]);
                break;
            case 'sessions':
                setMessages(prev => [...prev, {
                    content: `Loading session: ${options.session}`,
                    type: 'system',
                    ignoreInLLM: true
                }]);
                break;
            case 'new':
                setMessages([]);
                setMessages([{
                    content: "Started a new chat session",
                    type: 'system',
                    ignoreInLLM: true
                }]);
                break;
        }
    };

    const handleSend = (message: string, files: SelectedFile[]) => {
        if(message.startsWith("/")) {
            const commandName = message.slice(1);
            const command = systemCmds.find(cmd => cmd.name === commandName);
            if(command) {
                if(command.name === 'exit') {
                    process.exit(0);
                } else {
                    setActiveCommand(command);
                }
                return;
            }
        }
        
        if (files.length > 0) {
            const contentWithFiles = message + `\n\n\nI have attached files for your reference: ${files.map(f => f.path).join(", ")}.`;
            setMessages(prev => [...prev, { content: contentWithFiles, type: 'user' }]);
        } else {
            setMessages(prev => [...prev, { content: message, type: 'user' }]);
        }

        // Mock response - to be replaced with actual LLM integration
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                content: "This is a mock response. The actual LLM integration will be implemented later.", 
                type: 'system' 
            }]);
        }, 1000);
    }

    return (
        <>
            <Header cmds={systemCmds} />
            <MessageDisplay messages={messages} />
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