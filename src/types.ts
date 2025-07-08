export interface Message {
    content?: string;
    role: 'user' | 'system' | 'assistant';
    isError?: boolean;
    ignoreInLLM?: boolean;
    ignoreInDisplay?: boolean;
    thinking?: boolean;
    metadata?: MessageMetadata;
}

export interface AnthropicFunctionCall {
    type: 'tool_use';
    id: string;
    name: string;
    input?: Record<string, any>;
}

export interface GeminiFunctionCall {
    type?: 'tool_use';
    id?: string;
    thoughtSignature?: string;
    functionCall: {
        name: string;
        args?: Record<string, any>;
    };
}

export interface OpenAIFunctionCall {
    type: 'tool_use';
    id: string;
    function: {
        name: string;
        arguments?: Record<string, any>;
    };
    index?: number;
}

export type FunctionCall = AnthropicFunctionCall | GeminiFunctionCall | OpenAIFunctionCall;

export interface MessageMetadata {
    thinkingContent?: string;
    toolCalls?: FunctionCall[];
    finishReason?: string;
    usageMetadata?: any;
}

export type ToolInput = {
    cmd?: string,
    filePath?: string,
    content?: string,
    processId?: string,
    searchTerm?: string,
    url?: string
}

export interface FileItem {
	name: string;
	isDirectory: boolean;
	path: string;
}

export interface SelectedFile {
	path: string;
	content: string;
}

export interface CommandOption {
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    required?: boolean;
    choices?: string[];
    default?: any;
}

export interface CommandArgument {
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'file';
    required: boolean;
}

export interface Command {
    name: string;
    description: string;
    args: CommandArgument[];
    options: CommandOption[];
    category?: 'general' | 'session' | 'model' | 'system';
}

export interface SystemCommand {
    name: string;
    description: string;
    
}

export interface Subscription {
    id: string;
    planId: string;
    status: string;
    currentPeriodStart: string;
    nextPeriodStart: string;
}

export interface UserData {
    email: string;
    type: string;
    tokenId: string;
    subscriptions: Subscription[];
}

export interface ConfigFormat {
    accessToken?: string;
    accessTokenExpiry?: number;
    refreshToken?: string;
    user?: UserData;
    acceptAllToolCalls?: boolean;
}


export interface ActiveFileInfo {
    path: string;
    name: string;
    language: string;
    content: string;
    lineCount: number;
    isDirty: boolean;
}

export interface TextSelectionInfo {
    startLine: number;
    endLine: number;
    startCharacter: number;
    endCharacter: number;
    text: string;
    range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
}

export interface OpenTabInfo {
    path: string;
    name: string;
    language: string;
    isActive: boolean;
    isDirty: boolean;
}

export interface DiffInfo {
    filePath: string;
    fileName: string;
    changes: DiffChange[];
}

export interface DiffChange {
    type: 'add' | 'delete' | 'modify';
    lineNumber: number;
    originalText?: string;
    newText?: string;
}

export interface DiagnosticInfo {
    filePath: string;
    fileName: string;
    diagnostics: Diagnostic[];
}

export interface Diagnostic {
    message: string;
    severity: 'error' | 'warning' | 'info' | 'hint';
    range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    source?: string;
    code?: string | number;
}

export interface ContextData {
    activeFile: ActiveFileInfo | null;
    textSelection: TextSelectionInfo | null;
    openTabs: OpenTabInfo[];
    diffs: DiffInfo[] | null;
    diagnostics: DiagnosticInfo[] | null;
    timestamp: number;
}

export interface CommandResponse {
    success: boolean;
    data?: any;
    error?: string;
    message: string;
}

export interface FileChange {
    originalContent: string;
    proposedContent: string;
    description?: string;
}

export interface ChangeProposal {
    id: string;
    title: string;
    filePath: string;
    changes: FileChange[];
    timestamp: number;
}

export interface ChangeProposalRequest {
    title: string;
    filePath: string;
    changes: FileChange[];
}

export interface ChatRequest {
    messages: Message[];
    provider: "openai" | "anthropic" | "gemini" | "other";
    base_url?: string;
    model: string;
    temperature?: number;
    max_tokens?: number;
}

export interface ModelData {
    provider: "anthropic" | "openai" | "gemini" | "other",
    model: string
}

export interface ToolCallStatus {
    id: string;
    name: string;
    status: 'pending' | 'success' | 'error';
    timestamp: number;
    errorMessage?: string;
}