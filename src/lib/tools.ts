import { ActiveFileInfo, AnthropicFunctionCall, ChangeProposalRequest, CommandResponse, DiagnosticInfo, DiffInfo, FunctionCall, GeminiFunctionCall, Message, OpenAIFunctionCall, OpenTabInfo, TextSelectionInfo } from "@/types";
import { exec, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { getClient } from "./editor.js";

const runningProcesses: { [key: string]: any } = {};

// Timeout configuration
const TIMEOUTS = {
    COMMAND: 15000,        // 15 seconds for command execution
    FILE_READ: 10000,      // 10 seconds for file reading
    FILE_WRITE: 10000,     // 10 seconds for file writing
    GREP_SEARCH: 20000,    // 20 seconds for grep searches
    OPEN_OPERATION: 10000, // 10 seconds for opening files/browser
    PROCESS_OPERATION: 15000 // 15 seconds for process operations
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        })
    ]);
};

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
    
    const commandPromise = new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Command execution failed: ${error.message}`));
                return;
            }
            resolve(`stdout: ${stdout}\n  stderr: ${stderr}`);
        });
    });

    return withTimeout(commandPromise, TIMEOUTS.COMMAND, 'Command execution');
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
    
    const readPromise = new Promise((resolve, reject) => {
        fs.readFile(expandedPath, 'utf8', (error, data) => {
            if (error) {
                reject(new Error(`Failed to read file: ${error.message}`));
                return;
            }
            resolve(`File ${expandedPath} read successfully: ${data}`);
        });
    });

    return withTimeout(readPromise, TIMEOUTS.FILE_READ, 'File read operation');
}

export const write_file = (filePath: string, content: string) => {
    if (!filePath || typeof filePath !== 'string') {
        return Promise.reject(new Error('Invalid file path: Path must be a non-empty string'));
    }
    if (content === undefined || content === null) {
        return Promise.reject(new Error('Invalid content: Content cannot be null or undefined'));
    }
    const expandedPath = expandHomeDir(filePath.trim());
    
    const writePromise = new Promise((resolve, reject) => {
        fs.writeFile(expandedPath, content, (error) => {
            if (error) {
                reject(new Error(`Failed to write file: ${error.message}`));
                return;
            }
            resolve(`File ${expandedPath} written successfully`);
        });
    });

    return withTimeout(writePromise, TIMEOUTS.FILE_WRITE, 'File write operation');
}

export const open_file = (filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
        return Promise.reject(new Error('Invalid file path: Path must be a non-empty string'));
    }
    
    const openPromise = new Promise((resolve, reject) => {
        exec(`xdg-open ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Failed to open file: ${error.message}`));
                return;
            }
            resolve(`File ${filePath} opened successfully`);
        });
    });

    return withTimeout(openPromise, TIMEOUTS.OPEN_OPERATION, 'File open operation');
}

export const open_browser = (url: string) => {
    if (!url || typeof url !== 'string') {
        return Promise.reject(new Error('Invalid URL: URL must be a non-empty string'));
    }
    
    const browserPromise = new Promise((resolve, reject) => {
        exec(`xdg-open ${url}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Failed to open browser: ${error.message}`));
                return;
            }
            resolve(`Browser opened successfully`);
        });
    });

    return withTimeout(browserPromise, TIMEOUTS.OPEN_OPERATION, 'Browser open operation');
}

export const run_background_command = (command: string, processId: string) => {
    if (!command || typeof command !== 'string') {
        return Promise.reject(new Error('Invalid command: Command must be a non-empty string'));
    }
    if (!processId || typeof processId !== 'string') {
        return Promise.reject(new Error('Invalid process ID: Process ID must be a non-empty string'));
    }
    
    const processPromise = new Promise((resolve, reject) => {
        try {
            const [cmd, ...args] = command.split(' ');
            const process = spawn(cmd, args, {
                detached: true,
                stdio: 'ignore'
            });

            process.unref();
            runningProcesses[processId] = process;
            resolve(`Process started with ID: ${processId}`);
        } catch (error) {
            reject(new Error(`Failed to start background process: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });

    return withTimeout(processPromise, TIMEOUTS.PROCESS_OPERATION, 'Background process start');
}

export const stop_process = (processId: string) => {
    if (!processId || typeof processId !== 'string') {
        return Promise.reject(new Error('Invalid process ID: Process ID must be a non-empty string'));
    }
    
    const stopPromise = new Promise((resolve, reject) => {
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

    return withTimeout(stopPromise, TIMEOUTS.PROCESS_OPERATION, 'Process stop operation');
}

export const grep_search = (searchTerm: string, filePath: string) => {
    if (!searchTerm || typeof searchTerm !== 'string') {
        return Promise.reject(new Error('Invalid search term: Search term must be a non-empty string'));
    }
    if (!filePath || typeof filePath !== 'string') {
        return Promise.reject(new Error('Invalid file path: File path must be a non-empty string'));
    }
    const expandedPath = expandHomeDir(filePath.trim());
    
    const grepPromise = new Promise((resolve, reject) => {
        exec(`grep -r ${searchTerm} ${expandedPath}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Failed to grep search: ${error.message}`));
                return;
            }
            resolve(`Grep search result: ${stdout}`);
        });
    });

    return withTimeout(grepPromise, TIMEOUTS.GREP_SEARCH, 'Grep search operation');
}

export const is_process_running = (processId: string) => {
    if (!processId || typeof processId !== 'string') {
        return Promise.reject(new Error('Invalid process ID: Process ID must be a non-empty string'));
    }
    return Promise.resolve(`Process ${processId} is ${runningProcesses[processId] ? 'running' : 'not running'}`);
}

export const open_file_vscode = async (filePath: string, options: any) => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }

        const response = await client.sendCommandWithPromise('openFile', [filePath], options);
        return handleCommandResponse(response);
    } catch (error) {
        throw new Error(`Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const write_file_vscode = async (filePath: string, content: string) => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }

        const response = await client.sendCommandWithPromise('writeFile', [filePath, content]);
        return handleCommandResponse(response);
    } catch (error) {
        throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const delete_file = async (filePath: string) => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }

        const response = await client.sendCommandWithPromise('deleteFile', [filePath]);
        return handleCommandResponse(response);
    } catch (error) {
        throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const select_text = async (startLine: number, startChar: number, endLine: number, endChar: number) => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }

        const response = await client.sendCommandWithPromise('selectText', [startLine, startChar, endLine, endChar]);
        return handleCommandResponse(response);
    } catch (error) {
        throw new Error(`Failed to select text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const show_notification = async (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }

        const response = await client.sendCommandWithPromise('showNotification', [message, type]);
        return handleCommandResponse(response);
    } catch (error) {
        throw new Error(`Failed to show notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const propose_change_vscode = async (changeProposal: ChangeProposalRequest) => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }

        // Use 60 seconds timeout for user interaction tools
        const response = await client.sendCommandWithPromise('proposeChange', [changeProposal], {}, 60000);
        return handleCommandResponse(response);
    } catch (error) {
        throw new Error(`Failed to propose change: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const get_active_file = async () => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }
        const activeFile: ActiveFileInfo | null = client.getContext().activeFile;
        return activeFile;
    } catch (error) {
        throw new Error(`Failed to get active file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const get_open_tabs = async () => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }
        const openTabs: OpenTabInfo[] | [] = client.getContext().openTabs;
        return openTabs;
    } catch (error) {
        throw new Error(`Failed to get open tabs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const get_text_selection = async () => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }
        const textSelection: TextSelectionInfo | null = client.getContext().textSelection;
        return textSelection;
    } catch (error) {
        throw new Error(`Failed to get text selection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const get_diffs = async () => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }
        const diffs: DiffInfo[] | null = client.getContext().diffs;
        return diffs;
    } catch (error) {
        throw new Error(`Failed to get diffs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const get_diagnostics = async () => {
    try {
        const client = getClient();
        if (!client.canOperate()) {
            throw new Error('Editor Context Bridge is not connected. This operation requires a connection to the editor.');
        }
        const allDiagnostics: DiagnosticInfo[] | null = client.getContext().diagnostics;
        const diagnostics = allDiagnostics?.filter((d: DiagnosticInfo) => d.diagnostics.length > 0);
        return diagnostics;
    } catch (error) {
        throw new Error(`Failed to get diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const handleCommandResponse = (response: CommandResponse) => {
    let content = '';
    const data = response.data;

    if (data.data && data.data.message && data.data.message.includes('Change proposal')) {
        if (data.data.accepted) {
            content = `Change proposal accepted and applied successfully!`;
        } else if (data.data.message.includes('dismissed')) {
            content = `Change proposal was dismissed by user.`;
        } else {
            content = `${data.data.message}`;
        }
    }
    else if (data.success) {
        if (data.data && data.data.message && typeof data.data.message === 'string') {
            content = data.data.message;
        } else {
            content = data.message || 'Command executed successfully';
        }
    } else {
        content = `Error: ${data.error || 'Unknown error occurred'}`;
    }

    return content.trim();
}

export const runTool = async (tool: FunctionCall): Promise<any> => {
    const toolName = (tool as AnthropicFunctionCall).name || (tool as GeminiFunctionCall).name || (tool as OpenAIFunctionCall).function.name || null;

    let toolInput: Record<string, any> = {};
    if ((tool as AnthropicFunctionCall).input) {
        toolInput = (tool as AnthropicFunctionCall).input || {};
    } else if ((tool as GeminiFunctionCall).args) {
        toolInput = (tool as GeminiFunctionCall).args || {};
    } else if ((tool as OpenAIFunctionCall).function?.arguments) {
        const args = (tool as OpenAIFunctionCall).function.arguments;
        toolInput = args ? (typeof args === 'string' ? JSON.parse(args) : args) : {};
    }

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
                return await list_files(toolInput.filePath || toolInput.path || toolInput.directory);

            case 'read_file':
                return await read_file(toolInput.filePath || toolInput.path || toolInput.file);

            case 'write_file':
                return await write_file(toolInput.filePath || toolInput.path || toolInput.file, toolInput.content);

            case 'open_file':
                return await open_file(toolInput.filePath || toolInput.path || toolInput.file);

            case 'open_browser':
                return await open_browser(toolInput.url);

            case 'run_background_command':
                return await run_background_command(toolInput.command || toolInput.cmd, toolInput.processId || toolInput.id);

            case 'stop_process':
                return await stop_process(toolInput.processId || toolInput.id);

            case 'grep_search':
                return await grep_search(toolInput.searchTerm || toolInput.term || toolInput.search, toolInput.filePath || toolInput.path || toolInput.directory);

            case 'is_process_running':
                return await is_process_running(toolInput.processId || toolInput.id);

            case 'open_file_vscode':
                return await open_file_vscode(toolInput.filePath || toolInput.path || toolInput.file, toolInput.options);

            case 'write_file_vscode':
                return await write_file_vscode(toolInput.filePath || toolInput.path || toolInput.file, toolInput.content);

            case 'delete_file':
                return await delete_file(toolInput.filePath || toolInput.path || toolInput.file);

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