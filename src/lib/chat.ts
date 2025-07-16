import { ChatRequest, MessageMetadata, FunctionCall, Message } from "../types.js";
import { WORKER_URL } from "./const.js";
import { readConfigFile } from "./configMngt.js";
import { handleTokenExpiry } from "./auth.js";

interface ChatError {
    type: 'rate_limit' | 'auth_error' | 'network_error' | 'api_error' | 'unknown';
    message: string;
    details?: any;
}

const ERROR_MESSAGES = {
    rate_limit: 'Rate limit exceeded. Please try again in a few moments.',
    auth_error: 'Authentication failed. Please try logging in again.',
    network_error: 'Network error occurred. Please check your connection.',
    api_error: 'API error occurred. Please try again.',
    unknown: 'An unexpected error occurred.'
};

export async function chat(data: ChatRequest, retryCount: number = 0, thinkingCallback: (thinking: string) => void, contentCallback: (content: string) => void, toolCallCallback: (toolCall: FunctionCall[]) => void, finalCallback: (content: string, metadata: any) => void, doneCallback: (metadata: any) => void) {
    if (retryCount > 1) {
        console.error("Max retries reached for chat. Kindly login again.");
        return {
            error: "Max retries reached for chat. Kindly login again.",
        };
    }

    try {
        const config = await readConfigFile();
        let accessToken = config.accessToken;
        if (!accessToken) {
            throw new Error("No access token found");
        }

        let messages = data.messages;
        
        let apiKey = data.apiKey;
        if (!apiKey) {
            const apiKeyName = `${data.provider.toUpperCase()}_API_KEY` as `${string}_API_KEY`;
            apiKey = config[apiKeyName];
        }

        const requestBody = {
            messages,
            sdk: data.sdk,
            provider: data.provider,
            base_url: data.base_url,
            model: data.model,
            temperature: data.temperature,
            max_tokens: data.max_tokens,
            plan: data.plan,
            apiKey: apiKey,
        }
        const response = await fetch(`${WORKER_URL}/chat/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ chat: requestBody }),
        });

        if (!response.ok) {
            const errorData = await response.json();

            // Handle different error types
            let chatError: ChatError;

            if (response.status === 429) {
                chatError = {
                    type: 'rate_limit',
                    message: ERROR_MESSAGES.rate_limit,
                    details: errorData
                };
            } else if (response.status === 401 || response.status === 403) {
                if (errorData.error) {
                    const newAccessToken = await handleTokenExpiry(errorData);
                    if (newAccessToken) {
                        return chat(data, retryCount + 1, thinkingCallback, contentCallback, toolCallCallback, finalCallback, doneCallback);
                    }
                }
                chatError = {
                    type: 'auth_error',
                    message: ERROR_MESSAGES.auth_error,
                    details: errorData
                };
            } else if (response.status >= 500) {
                chatError = {
                    type: 'api_error',
                    message: ERROR_MESSAGES.api_error,
                    details: errorData
                };
            } else {
                chatError = {
                    type: 'unknown',
                    message: `${ERROR_MESSAGES.unknown} (Status: ${response.status})`,
                    details: errorData
                };
            }

            doneCallback({
                error: chatError
            });

            throw new Error(chatError.message);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("Failed to get response reader");
        }
        const decoder = new TextDecoder();

        let currentContent = '';
        let currentThinking = '';
        let currentToolCalls: FunctionCall[] = [];
        let accumulatedContent = '';

        const extractResponse = (text: string) => {
            try {
                const obj = JSON.parse(text);
                return obj.response || obj.text || text;
            } catch (e) {
                return text;
            }
        };

        while (true) {
            const result = await reader.read();
            if (result.done) break;

            const chunk = decoder.decode(result.value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const event = JSON.parse(line);

                    switch (event.type) {
                        case 'thinking':
                            currentThinking = event.content;
                            thinkingCallback(currentThinking);
                            break;

                        case 'content':
                            accumulatedContent += event.content;
                            currentContent = extractResponse(accumulatedContent);
                            contentCallback(currentContent);
                            break;

                        case 'tool_call':
                            const toolCall = event.toolCall as FunctionCall;
                            currentToolCalls.push(toolCall);
                            toolCallCallback(currentToolCalls);
                            break;

                        case 'final':
                            const metadata: MessageMetadata = {
                                thinkingContent: event.summary?.thinking || '',

                                thinkingSignature: event.fullMessage?.content?.find((c: any) => c.type === 'thinking')?.signature || event.summary?.toolCalls[0]?.thoughtSignature || event.summary?.content[0]?.thoughtSignature || "",

                                toolCalls: event.fullMessage?.content?.filter((c: any) => c.type === 'tool_use') || event.summary?.toolCalls?.map((c: any) => c.functionCall) || event.summary?.toolCalls || [],

                                finishReason: event.finishReason,

                                usageMetadata: event.usageMetadata
                            };

                            const textContent = event.fullMessage?.content
                                ?.filter((c: any) => c.type === 'text')
                                ?.map((c: any) => c.text)
                                ?.join('') || '';

                            const finalContent = textContent || extractResponse(accumulatedContent);
                            finalCallback(finalContent, metadata);
                            break;

                        case 'done':
                            doneCallback({
                                content: currentContent,
                                thinking: currentThinking,
                                toolCalls: currentToolCalls,
                            });
                            break;

                        case 'error':
                            throw new Error(event.error || 'Unknown stream error');

                        default:
                            console.warn('Unknown event type:', event.type);
                    }
                } catch (e) {
                    console.error('Failed to parse server message:', line, e);
                    throw e;
                }
            }
        }
    } catch (error) {
        console.error("Error chatting:", error);

        let chatError: ChatError;

        if (error instanceof TypeError && error.message.includes('fetch')) {
            chatError = {
                type: 'network_error',
                message: ERROR_MESSAGES.network_error,
                details: error
            };
        } else {
            chatError = {
                type: 'unknown',
                message: ERROR_MESSAGES.unknown,
                details: error
            };
        }

        // Call doneCallback with error information
        doneCallback({
            error: chatError
        });

        throw new Error(chatError.message);
    }
}