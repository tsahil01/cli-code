import { exec, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const runningProcesses: { [key: string]: any } = {};

const expandHomeDir = (filePath: string) => {
    if (filePath.startsWith('~')) {
        return path.join(os.homedir(), filePath.slice(1));
    }
    return filePath;
}

const run_command = (command: string) => {
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

const check_current_directory = () => {
    const currentDirectory = process.cwd();
    return Promise.resolve(`Current directory: ${currentDirectory}`);
}

const list_files = (filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
        return Promise.reject(new Error('Invalid file path: Path must be a non-empty string'));
    }
    const expandedPath = expandHomeDir(filePath.trim());
    return Promise.resolve(`Files in ${expandedPath}: ${fs.readdirSync(expandedPath)}`);
}

const read_file = (filePath: string) => {
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

const write_file = (filePath: string, content: string) => {
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

const open_file = (filePath: string) => {
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

const open_browser = (url: string) => {
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

const run_background_command = (command: string, processId: string) => {
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

const stop_process = (processId: string) => {
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

const grep_search = (searchTerm: string, filePath: string) => {
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

const is_process_running = (processId: string) => {
    if (!processId || typeof processId !== 'string') {
        return Promise.reject(new Error('Invalid process ID: Process ID must be a non-empty string'));
    }
    return Promise.resolve(`Process ${processId} is ${runningProcesses[processId] ? 'running' : 'not running'}`);
}
