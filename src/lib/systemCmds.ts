import { Command } from "../types";

export const systemCmds: Command[] = [{
    name: "help",
    description: "show help",
    category: "general",
    args: [],
    options: [],
},{
    name: "sessions",
    description: "browse and load sessions",
    category: "session",
    args: [],
    options: [],
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
    options: [],
},{
    name: "mode",
    description: "change usage mode (lite or full)",
    category: "system",
    args: [],
    options: [{
        name: "mode",
        description: "Select usage mode",
        type: "select",
        choices: ["lite", "full"],
        default: "lite",
        required: true
    }],
},{
    name: "settings",
    description: "edit configuration file",
    category: "system",
    args: [],
    options: [],
},{
    name: "api",
    description: "manage API keys",
    category: "system",
    args: [],
    options: [{
        name: "action",
        description: "Select API key action",
        type: "select",
        choices: ["view", "add", "remove"],
        default: "view",
        required: true
    }],
},{
    name: "tools",
    description: "manage tool call settings",
    category: "system",
    args: [],
    options: [{
        name: "action",
        description: "Select tool action",
        type: "select",
        choices: ["toggle-autoaccept"],
        default: "toggle-autoaccept",
        required: true
    }],
},{
    name: "exit",
    description: "exit the app",
    category: "system",
    args: [],
    options: [],
}];