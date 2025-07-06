import { CommandResponse, ContextData } from '../types.js';
import WebSocket from 'ws';

class EditorContextClient {
    host: string;
    port: number;
    ws: WebSocket | null;
    wsUrl: string;
    context: ContextData;
    commandResponse: CommandResponse | null;
    private connectionPromise: Promise<void> | null;
    private resolveConnection: (() => void) | null;
    private rejectConnection: ((error: Error) => void) | null;
    private contextCallback: ((context: ContextData) => void) | null;
    private commandCallback: ((response: CommandResponse) => void) | null;
    private connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'failed' = 'disconnected';
    private allowWithoutConnection: boolean = false;

    constructor(host = 'localhost', port = 3210) {
        this.host = host;
        this.port = port;
        this.ws = null;
        this.wsUrl = `ws://${host}:${port}`;
        this.context = {
            activeFile: null,
            textSelection: null,
            openTabs: [],
            diffs: null,
            diagnostics: null,
            timestamp: Date.now()
        };
        this.commandResponse = null;
        this.connectionPromise = null;
        this.resolveConnection = null;
        this.rejectConnection = null;
        this.contextCallback = null;
        this.commandCallback = null;
    }

    connectWebSocket(): Promise<void> {
        this.connectionStatus = 'connecting';
        this.connectionPromise = new Promise((resolve, reject) => {
            this.resolveConnection = resolve;
            this.rejectConnection = reject;
        });

        this.ws = new WebSocket(this.wsUrl);

        const connectionTimeout = setTimeout(() => {
            if (this.connectionStatus === 'connecting' && this.rejectConnection) {
                this.connectionStatus = 'failed';
                this.rejectConnection(new Error('Connection timeout: Unable to connect to Editor Context Bridge'));
            }
        }, 5000);

        this.ws.on('open', () => {
            clearTimeout(connectionTimeout);
            this.connectionStatus = 'connected';
            this.requestContext();
            if (this.resolveConnection) {
                this.resolveConnection();
            }
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleWebSocketMessage(message);
            } catch (error) {
            }
        });

        this.ws.on('close', () => {
            clearTimeout(connectionTimeout);
            this.connectionStatus = 'disconnected';
            this.connectionPromise = null;
            this.resolveConnection = null;
            this.rejectConnection = null;
        });

        this.ws.on('error', (error) => {
            clearTimeout(connectionTimeout);
            this.connectionStatus = 'failed';
            if (this.rejectConnection) {
                this.rejectConnection(new Error(`WebSocket connection failed: ${error.message}`));
            }
        });

        return this.connectionPromise;
    }

    handleWebSocketMessage(message: any) {
        switch (message.type) {
            case 'context':
                this.context = message.data;
                if (this.contextCallback) {
                    this.contextCallback(this.context);
                }
                break;
            case 'commandResponse':
                this.commandResponse = message.data;
                if (this.commandCallback && this.commandResponse) {
                    this.commandCallback(this.commandResponse);
                }
                break;
            default:
        }
    }

    async requestContext() {
        if (!this.canOperate()) {
            throw new Error('Editor Context Bridge is not connected and operation is not allowed without connection');
        }
        if (!this.isConnected()) {
            if (this.connectionPromise) {
                await this.connectionPromise;
            } else {
                throw new Error('No active connection attempt');
            }
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'getContext' }));
        }
    }

    async sendCommand(command: string, args: any[] = [], options: any = {}) {
        if (!this.canOperate()) {
            throw new Error('Editor Context Bridge is not connected and operation is not allowed without connection');
        }
        if (!this.isConnected()) {
            if (this.connectionPromise) {
                await this.connectionPromise;
            } else {
                throw new Error('No active connection attempt');
            }
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'command',
                command: { command, arguments: args, options }
            }));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.connectionPromise = null;
            this.resolveConnection = null;
        }
    }

    getContext(): ContextData {
        return this.context;
    }

    getCommandResponse(): CommandResponse | null {
        return this.commandResponse;
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' | 'failed' {
        return this.connectionStatus;
    }

    setAllowWithoutConnection(allow: boolean) {
        this.allowWithoutConnection = allow;
    }

    canOperate(): boolean {
        return this.isConnected() || this.allowWithoutConnection;
    }

    refreshContext() {
        this.requestContext();
    }

    onContextUpdate(callback: (context: ContextData) => void) {
        this.contextCallback = callback;
        if (this.context) {
            callback(this.context);
        }
    }

    onCommandResponse(callback: (response: CommandResponse) => void) {
        this.commandCallback = callback;
        if (this.commandResponse) {
            callback(this.commandResponse);
        }
    }
}

let client: EditorContextClient | null = null;

export const getClient = (): EditorContextClient => {
    if (!client) {
        throw new Error('EditorContextClient not initialized. Call init() first.');
    }
    return client;
}


export const init = async (): Promise<EditorContextClient> => {
    if (client) {
        return client;
    }
    client = new EditorContextClient('localhost', 3210);
    try {
        await client.connectWebSocket();
    } catch (error) {
    }
    return client;
}

export const getConnectionStatus = (): 'connected' | 'disconnected' | 'connecting' | 'failed' | 'not-initialized' => {
    return client ? client.getConnectionStatus() : 'not-initialized';
}

export const setAllowWithoutConnection = (allow: boolean): void => {
    if (client) {
        client.setAllowWithoutConnection(allow);
    }
}

export const retryConnection = async (): Promise<void> => {
    if (client) {
        await client.connectWebSocket();
    }
}


export default EditorContextClient;