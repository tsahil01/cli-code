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
    name: string;
    args?: Record<string, any>;
}

export interface OpenAIFunctionCall {
    type: 'function';
    id: string;
    function: {
        name: string;
        arguments?: Record<string, any>;
    };
}

export type FunctionCall = AnthropicFunctionCall | GeminiFunctionCall | OpenAIFunctionCall;

export interface MessageMetadata {
    thinkingContent?: string;
    thinkingSignature?: string;
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
    plan: Plan;
    selectedModel?: ModelData;
    [key: `${string}_API_KEY`]: string | undefined;
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

export type ChatErrorType = 'rate_limit' | 'auth_error' | 'network_error' | 'api_error' | 'unknown';

export interface ChatError {
    type: ChatErrorType;
    message: string;
    details?: any;
}

export interface ChatRequest {
    messages: Message[];
    sdk: "anthropic" | "openai" | "gemini";
    provider: string;
    base_url?: string;
    model: string;
    temperature?: number;
    max_tokens?: number;
    plan: Plan;
    apiKey?: string;
}

export interface ModelData {
    provider: string,
    model: string,
    modelCapabilities: ModelCapabilities
}

export interface ToolCallStatus {
    id: string;
    name: string;
    status: 'pending' | 'success' | 'error';
    timestamp: number;
    errorMessage?: string;
}

export interface Plan {
    mode: 'lite' | 'full';
    addOns: ('memory' | 'github' | 'advanced-context')[]; // Only available for 'lite' mode
}

export interface ModelCapabilities {
    modelName: string;
    provider: string;
    displayName: string;
    maxInputTokens: number; // maximum input tokens (context window)
    maxOutputTokens: number; // maximum output tokens
    thinking: boolean;
    minThinkingTokens?: number;
    maxThinkingTokens?: number;
    baseUrl?: string;
    sdk: "anthropic" | "openai" | "gemini";
    apiKeyName: `${string}_API_KEY`;
}


export interface ModelsResponse {
    models: {
        anthropic: ModelCapabilities[];
        openai: ModelCapabilities[];
        gemini: ModelCapabilities[];
        other: ModelCapabilities[];
    };
}