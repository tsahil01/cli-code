import { ChatRequest, MessageMetadata, FunctionCall } from "../types.js";
import { WORKER_URL } from "./const.js";
import { readConfigFile } from "./configMngt.js";
import { handleTokenExpiry } from "./auth.js";

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

        const messages = data.messages;

        const requestBody = {
            messages,
            provider: data.provider,
            base_url: data.base_url,
            model: data.model,
            temperature: data.temperature,
            max_tokens: data.max_tokens,
        }
        const response = await fetch(`${WORKER_URL}/chat/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({chat: requestBody}),
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error) {
                const newAccessToken = await handleTokenExpiry(errorData);
                if (newAccessToken) {
                    return chat(data, retryCount + 1, thinkingCallback, contentCallback, toolCallCallback, finalCallback, doneCallback);
                }
            }
            throw new Error(`HTTP error! status: ${response.status}`);
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
                                toolCalls: event.summary?.toolCalls || [],
                                finishReason: event.finishReason,
                                usageMetadata: event.usageMetadata
                            };

                            const finalContent = extractResponse(accumulatedContent);
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
        throw error;
    }
}