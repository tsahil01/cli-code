import { ActiveFileInfo, AnthropicFunctionCall, ChangeProposalRequest, CommandResponse, DiagnosticInfo, DiffInfo, FunctionCall, GeminiFunctionCall, Message, OpenTabInfo, TextSelectionInfo } from "@/types";
import { exec, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { getClient } from "./editor.js";

const runningProcesses: { [key: string]: any } = {};


const expandHomeDir = (filePath: string) => {
    if (filePath.startsWith('~')) {
        return path.join(os.homedir(), filePath.slice(1));
    }
    return filePath;
}

export const run_command = (command: string) => {
    if (!command || typeof command !== 'string') {
        return Promise.reject(new Error('Invalid command: Command must be a non-empty string'));
    }
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Command execution failed: ${error.message}`));
                return;
            }
            resolve(`stdout: ${stdout}\n  stderr: ${stderr}`);
        });
    });
}

export const check_current_directory = () => {
    const currentDirectory = process.cwd();
    return Promise.resolve(`Current directory: ${currentDirectory}`);
}

export const list_files = (filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
        return Promise.reject(new Error('Invalid file path: Path must be a non-empty string'));
    }
    const expandedPath = expandHomeDir(filePath.trim());
    return Promise.resolve(`Files in ${expandedPath}: ${fs.readdirSync(expandedPath)}`);
}

export const read_file = (filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
        return Promise.reject(new Error('Invalid file path: Path must be a non-empty string'));
    }
    const expandedPath = expandHomeDir(filePath.trim());
    return new Promise((resolve, reject) => {
        fs.readFile(expandedPath, 'utf8', (error, data) => {
            if (error) {
                reject(new Error(`Failed to read file: ${error.message}`));
                return;
            }
            resolve(`File ${expandedPath} read successfully: ${data}`);
        });
    });
}

export const write_file = (filePath: string, content: string) => {
    if (!filePath || typeof filePath !== 'string') {
        return Promise.reject(new Error('Invalid file path: Path must be a non-empty string'));
    }
    if (content === undefined || content === null) {
        return Promise.reject(new Error('Invalid content: Content cannot be null or undefined'));
    }
    const expandedPath = expandHomeDir(filePath.trim());
    return new Promise((resolve, reject) => {
        fs.writeFile(expandedPath, content, (error) => {
            if (error) {
                reject(new Error(`Failed to write file: ${error.message}`));
                return;
            }
            resolve(`File ${expandedPath} written successfully`);
        });
    });
}

export const open_file = (filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
        return Promise.reject(new Error('Invalid file path: Path must be a non-empty string'));
    }
    return new Promise((resolve, reject) => {
        exec(`xdg-open ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Failed to open file: ${error.message}`));
                return;
            }
            resolve(`File ${filePath} opened successfully`);
        });
    });
}

export const open_browser = (url: string) => {
    if (!url || typeof url !== 'string') {
        return Promise.reject(new Error('Invalid URL: URL must be a non-empty string'));
    }
    return new Promise((resolve, reject) => {
        exec(`xdg-open ${url}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Failed to open browser: ${error.message}`));
                return;
            }
            resolve(`Browser opened successfully`);
        });
    });
}

export const run_background_command = (command: string, processId: string) => {
    if (!command || typeof command !== 'string') {
        return Promise.reject(new Error('Invalid command: Command must be a non-empty string'));
    }
    if (!processId || typeof processId !== 'string') {
        return Promise.reject(new Error('Invalid process ID: Process ID must be a non-empty string'));
    }
    return new Promise((resolve, reject) => {
        try {
            const [cmd, ...args] = command.split(' ');
            const process = spawn(cmd, args, {
                detached: true,
                stdio: 'ignore'
            });

            process.unref();
            runningProcesses[processId] = process;
            return Promise.resolve(`Process started with ID: ${processId}`);
        } catch (error) {
            return Promise.reject(new Error(`Failed to start background process: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const stop_process = (processId: string) => {
    if (!processId || typeof processId !== 'string') {
        return Promise.reject(new Error('Invalid process ID: Process ID must be a non-empty string'));
    }
    return new Promise((resolve, reject) => {
        const process = runningProcesses[processId];
        if (!process) {
            reject(new Error(`No process found with ID: ${processId}`));
            return;
        }

        try {
            process.kill();
            delete runningProcesses[processId];
            resolve(`Process ${processId} stopped successfully`);
        } catch (error) {
            reject(new Error(`Failed to stop process: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const grep_search = (searchTerm: string, filePath: string) => {
    if (!searchTerm || typeof searchTerm !== 'string') {
        return Promise.reject(new Error('Invalid search term: Search term must be a non-empty string'));
    }
    if (!filePath || typeof filePath !== 'string') {
        return Promise.reject(new Error('Invalid file path: File path must be a non-empty string'));
    }
    const expandedPath = expandHomeDir(filePath.trim());
    return new Promise((resolve, reject) => {
        exec(`grep -r ${searchTerm} ${expandedPath}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Failed to grep search: ${error.message}`));
                return;
            }
            resolve(`Grep search result: ${stdout}`);
        });
    });
}

export const is_process_running = (processId: string) => {
    if (!processId || typeof processId !== 'string') {
        return Promise.reject(new Error('Invalid process ID: Process ID must be a non-empty string'));
    }
    return Promise.resolve(`Process ${processId} is ${runningProcesses[processId] ? 'running' : 'not running'}`);
}

export const open_file_vscode = (filePath: string, options: any) => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            if (!client.canOperate()) {
                reject(new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.'));
                return;
            }
            client.sendCommand('openFile', [filePath], options);
            client.onCommandResponse((response: CommandResponse) => {
                const message = handleCommandResponse(response);
                resolve(message);
            });
        } catch (error) {
            reject(new Error(`Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const write_file_vscode = (filePath: string, content: string) => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            if (!client.canOperate()) {
                reject(new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.'));
                return;
            }
            client.sendCommand('writeFile', [filePath, content]);
            client.onCommandResponse((response: CommandResponse) => {
                const message = handleCommandResponse(response);
                resolve(message);
            });
        } catch (error) {
            reject(new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const delete_file = (filePath: string) => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            client.sendCommand('deleteFile', [filePath]);
            client.onCommandResponse((response: CommandResponse) => {
                const message = handleCommandResponse(response);
                resolve(message);
            });
        } catch (error) {
            reject(new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const select_text = (startLine: number, startChar: number, endLine: number, endChar: number) => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            if (!client.canOperate()) {
                reject(new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.'));
                return;
            }
            client.sendCommand('selectText', [startLine, startChar, endLine, endChar]);
            client.onCommandResponse((response: CommandResponse) => {
                const message = handleCommandResponse(response);
                resolve(message);
            });
        } catch (error) {
            reject(new Error(`Failed to select text: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const show_notification = (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            client.sendCommand('showNotification', [message, type]);
            client.onCommandResponse((response: CommandResponse) => {
                const message = handleCommandResponse(response);
                resolve(message);
            });
        } catch (error) {
            reject(new Error(`Failed to show notification: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const propose_change_vscode = (changeProposal: ChangeProposalRequest) => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            client.sendCommand('proposeChange', [changeProposal]);
            client.onCommandResponse((response: CommandResponse) => {
                const message = handleCommandResponse(response);
                resolve(message);
            });
        } catch (error) {
            reject(new Error(`Failed to propose change: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const get_active_file = () => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            if (!client.canOperate()) {
                reject(new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.'));
                return;
            }
            const activeFile: ActiveFileInfo | null = client.getContext().activeFile;
            resolve(activeFile);
        } catch (error) {
            reject(new Error(`Failed to get active file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const get_open_tabs = () => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            if (!client.canOperate()) {
                reject(new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.'));
                return;
            }
            const openTabs: OpenTabInfo[] | [] = client.getContext().openTabs;
            resolve(openTabs);
        } catch (error) {
            reject(new Error(`Failed to get active tab: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const get_text_selection = () => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            if (!client.canOperate()) {
                reject(new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.'));
                return;
            }
            const textSelection: TextSelectionInfo | null = client.getContext().textSelection;
            resolve(textSelection);
        } catch (error) {
            reject(new Error(`Failed to get text selection: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const get_diffs = () => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            if (!client.canOperate()) {
                reject(new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.'));
                return;
            }
            const diffs: DiffInfo[] | null = client.getContext().diffs;
            resolve(diffs);
        } catch (error) {
            reject(new Error(`Failed to get diffs: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const get_diagnostics = () => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            if (!client.canOperate()) {
                reject(new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.'));
                return;
            }
            const allDiagnostics: DiagnosticInfo[] | null = client.getContext().diagnostics;
            const diagnostics = allDiagnostics?.filter((d: DiagnosticInfo) => d.diagnostics.length > 0);
            resolve(diagnostics);
        } catch (error) {
            reject(new Error(`Failed to get diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const handleCommandResponse = (response: CommandResponse): Message => {
    let content = '';
    const data = response.data;
    if(data.success) {
        content = data.message;
    } else {
        content = `${data.error}`
    }
    return {
        content: content,
        role: 'user',
        ignoreInDisplay: true,
    }
}

export const runTool = async (tool: FunctionCall): Promise<any> => {
    const toolName = (tool as AnthropicFunctionCall).name || (tool as GeminiFunctionCall).functionCall?.name;
    const toolInput = (tool as AnthropicFunctionCall).input || (tool as GeminiFunctionCall).functionCall?.args || {};

    if (!toolName) {
        throw new Error('Tool name not found in function call');
    }

    try {
        switch (toolName) {
            case 'run_command':
                return await run_command(toolInput.command || toolInput.cmd);
            
            case 'check_current_directory':
                return await check_current_directory();
            
            case 'list_files':
                return await list_files(toolInput.filePath || toolInput.path);
            
            case 'read_file':
                return await read_file(toolInput.filePath || toolInput.path);
            
            case 'write_file':
                return await write_file(toolInput.filePath || toolInput.path, toolInput.content);
            
            case 'open_file':
                return await open_file(toolInput.filePath || toolInput.path);
            
            case 'open_browser':
                return await open_browser(toolInput.url);
            
            case 'run_background_command':
                return await run_background_command(toolInput.command || toolInput.cmd, toolInput.processId);
            
            case 'stop_process':
                return await stop_process(toolInput.processId);
            
            case 'grep_search':
                return await grep_search(toolInput.searchTerm, toolInput.filePath || toolInput.path);
            
            case 'is_process_running':
                return await is_process_running(toolInput.processId);
            
            case 'open_file_vscode':
                return await open_file_vscode(toolInput.filePath || toolInput.path, toolInput.options);
            
            case 'write_file_vscode':
                return await write_file_vscode(toolInput.filePath || toolInput.path, toolInput.content);
            
            case 'delete_file':
                return await delete_file(toolInput.filePath || toolInput.path);
            
            case 'select_text':
                return await select_text(toolInput.startLine, toolInput.startChar, toolInput.endLine, toolInput.endChar);
            
            case 'show_notification':
                return await show_notification(toolInput.message, toolInput.type);
            
            case 'propose_change_vscode':
                return await propose_change_vscode(toolInput as ChangeProposalRequest);
            
            case 'get_active_file':
                return await get_active_file();
            
            case 'get_open_tabs':
                return await get_open_tabs();
            
            case 'get_text_selection':
                return await get_text_selection();
            
            case 'get_diffs':
                return await get_diffs();
            
            case 'get_diagnostics':
                return await get_diagnostics();
            
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    } catch (error) {
        throw new Error(`Tool execution failed for ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}