import React, { useState } from 'react';
import { Header, ChatInput } from "./components/index.js";
import { Command, SelectedFile } from "../types.js";
import { MessageDisplay } from './components/message-display.js';

interface Message {
    content: string;
    isUser: boolean;
}

export function Agent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const cmds: Command[] = [{
        name: "help",
        description: "show help",
        args: [],
        options: [],
    },{
        name: "sessions",
        description: "list sessions",
        args: [],
        options: [],
    },{
        name: "new",
        description: "start a new session",
        args: [],
        options: [],
    },{
        name: "model",
        description: "switch model",
        args: [],
        options: [],
    },{
        name: "exit",
        description: "exit the app",
        args: [],
        options: [],
    }];

    const handleSend = (message: string, files: SelectedFile[]) => {
        // Add user message
        setMessages(prev => [...prev, { content: message, isUser: true }]);

        // Handle commands
        if(message.startsWith("/")){
            const command = cmds.find(cmd => cmd.name === message.slice(1));
            if(command){
                console.log("command", command);
                // Add system response for command
                setMessages(prev => [...prev, { 
                    content: `Executing command: ${command.name}`, 
                    isUser: false 
                }]);
            }
        } else {
            // Add mock response for now
            setTimeout(() => {
                setMessages(prev => [...prev, { 
                    content: "This is a mock response. The actual LLM integration will be implemented later.", 
                    isUser: false 
                }]);
            }, 1000);
        }

        if (files.length > 0) {
            console.log("attached files:", files.map(f => f.path));
            // Add system message for files
            setMessages(prev => [...prev, { 
                content: `Attached files: ${files.map(f => f.path).join(", ")}`, 
                isUser: false 
            }]);
        }
    }

    return (
        <>
            <Header cmds={cmds} />
            <MessageDisplay messages={messages} />
            <ChatInput onSend={handleSend} commands={cmds} />
        </>
    )
}