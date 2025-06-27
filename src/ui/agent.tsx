import React, { useState } from 'react';
import { Header, ChatInput } from "./components/index.js";
import { Command, SelectedFile } from "../types.js";

export function Agent() {
    const [messages, setMessages] = useState([]);
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
        console.log("message", message);
        if(message.startsWith("/")){
            const command = cmds.find(cmd => cmd.name === message.slice(1));
            if(command){
                console.log("command", command);
            }
        }
        if (files.length > 0) {
            console.log("attached files:", files.map(f => f.path));
        }
    }
    return (
        <>
            <Header cmds={cmds} />
            <ChatInput onSend={handleSend} commands={cmds} />
        </>
    )
}