import { ActiveFileInfo, ChangeProposalRequest, DiagnosticInfo, DiffInfo, OpenTabInfo, TextSelectionInfo } from "@/types";
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
            client.sendCommand('openFile', [filePath], options);
            resolve(true);
        } catch (error) {
            reject(new Error(`Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const write_file_vscode = (filePath: string, content: string) => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            client.sendCommand('writeFile', [filePath, content]);
            resolve(true);
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
            resolve(true);
        } catch (error) {
            reject(new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const select_text = (startLine: number, startChar: number, endLine: number, endChar: number) => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
            client.sendCommand('selectText', [startLine, startChar, endLine, endChar]);
            resolve(true);
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
            resolve(true);
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
            resolve(true);
        } catch (error) {
            reject(new Error(`Failed to propose change: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export const get_active_file = () => {
    return new Promise((resolve, reject) => {
        try {
            const client = getClient();
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
            const allDiagnostics: DiagnosticInfo[] | null = client.getContext().diagnostics;
            const diagnostics = allDiagnostics?.filter((d: DiagnosticInfo) => d.diagnostics.length > 0);
            resolve(diagnostics);
        } catch (error) {
            reject(new Error(`Failed to get diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}