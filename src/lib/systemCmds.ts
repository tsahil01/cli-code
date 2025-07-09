import { Command } from "../types";

export const systemCmds: Command[] = [{
    name: "help",
    description: "show help",
    category: "general",
    args: [],
    options: [],
},{
    name: "sessions",
    description: "list sessions",
    category: "session",
    args: [],
    options: [{
        name: "session",
        description: "Select a session to load",
        type: "select",
        choices: ["Session 1", "Session 2", "Session 3"],
        required: true
    }],
},{
    name: "new",
    description: "start a new session",
    category: "session",
    args: [],
    options: [],
},{
    name: "model",
    description: "switch model",
    category: "model",
    args: [],
    options: [{
        name: "model",
        description: "Select AI model to use",
        type: "select",
        choices: ["GPT-4", "GPT-3.5-Turbo", "Claude-3"],
        default: "GPT-4",
        required: true
    }],
},{
    name: "plan",
    description: "change subscription plan",
    category: "system",
    args: [],
    options: [],
},{
    name: "settings",
    description: "edit configuration file",
    category: "system",
    args: [],
    options: [],
},{
    name: "exit",
    description: "exit the app",
    category: "system",
    args: [],
    options: [],
}];