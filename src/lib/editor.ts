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
    private contextCallback: ((context: ContextData) => void) | null;
    private commandCallback: ((response: CommandResponse) => void) | null;

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
        this.contextCallback = null;
        this.commandCallback = null;
    }

    connectWebSocket(): Promise<void> {
        this.connectionPromise = new Promise((resolve) => {
            this.resolveConnection = resolve;
        });

        this.ws = new WebSocket(this.wsUrl);

        this.ws.on('open', () => {
            console.log('Connected to Editor Context Bridge');
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
                console.error('Error parsing WebSocket message:', error);
            }
        });

        this.ws.on('close', () => {
            console.log('Disconnected from Editor Context Bridge');
            this.connectionPromise = null;
            this.resolveConnection = null;
        });

        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error);
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
        if (!this.isConnected()) {
            await this.connectionPromise;
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'getContext' }));
        }
    }

    async sendCommand(command: string, args: any[] = [], options: any = {}) {
        if (!this.isConnected()) {
            await this.connectionPromise;
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
    await client.connectWebSocket();
    return client;
}


export default EditorContextClient;