import React from 'react';
import { Box, Text } from 'ink';
import { MarkdownRenderer } from './markdown-renderer.js';
import { Message, FunctionCall } from '../../types.js';

interface MessageDisplayProps {
    messages: Message[];
    thinking?: string;
    currentContent?: string;
    isProcessing?: boolean;
    currentToolCall?: FunctionCall | null;
}

const LoadingIndicator = () => {
    const [frame, setFrame] = React.useState(0);
    const frames = ['◜', '◠', '◝', '◞', '◡', '◟']; 

    React.useEffect(() => {
        const timer = setInterval(() => {
            setFrame(f => (f + 1) % frames.length);
        }, 100); 
        return () => clearInterval(timer);
    }, []);

    return <Text color="cyan">{frames[frame]}</Text>;
};

const ToolRunningIndicator = ({ toolName }: { toolName: string }) => {
    return (
        <Box>
            <Text color="gray">┌──────────────────────────────────</Text>
            <Text color="cyan"> Running </Text>
            <Text color="gray">───────────────────────────────────┐</Text>
            <Box marginLeft={1}>
                <LoadingIndicator />
                <Text color="cyan"> {toolName}</Text>
            </Box>
            <Text color="gray">└──────────────────────────────────────────────────────────────────┘</Text>
        </Box>
    );
};

export const MessageDisplay = ({ 
    messages,
    thinking,
    currentContent,
    isProcessing,
    currentToolCall
}: MessageDisplayProps) => {

    if (messages.length === 0 && !isProcessing) {
        return null;
    }

    const getToolName = (toolCall: FunctionCall) => {
        return 'functionCall' in toolCall 
            ? toolCall.functionCall.name 
            : 'function' in toolCall ? toolCall.function.name
            : 'name' in toolCall ? toolCall.name
            : 'unknown tool';
    };

    return (
        <Box flexDirection="column" marginY={1}>
            {messages.filter(msg => !msg.ignoreInDisplay).map((message, index) => {
                const filteredMessages = messages.filter(msg => !msg.ignoreInDisplay);
                const isFirstInGroup = index === 0 || filteredMessages[index - 1].role !== message.role;
                const isLastInGroup = index === filteredMessages.length - 1 || filteredMessages[index + 1].role !== message.role;
                
                return (
                    <Box 
                        key={index} 
                        flexDirection="row"
                        marginY={isFirstInGroup ? 1 : 0}
                        marginBottom={isLastInGroup ? 1 : 0}
                    >
                        <Text color={message.role === 'user' ? "cyan" : "magenta"}>
                            ┃ 
                        </Text>
                        
                        <Box 
                            paddingX={1}
                        >
                            {message.content && message.content.length > 0 && (
                            <MarkdownRenderer
                                content={message.content || ''}
                                dimmed={false}
                            />
                            )}
                            {(!message.content || message.content.length === 0) && message.metadata?.thinkingContent && (
                            <MarkdownRenderer
                                content={`${message.metadata?.thinkingContent}` || ''}
                                    dimmed={true}
                                />
                            )}
                        </Box>
                    </Box>
                );
            })}
            
            {isProcessing && (
                <Box flexDirection="column">
                    {currentToolCall ? (
                        <ToolRunningIndicator toolName={getToolName(currentToolCall)} />
                    ) : (
                        <Box flexDirection="row">
                            <Text color="magenta">┃ </Text>
                            <Box paddingX={1} flexDirection="column">
                                <LoadingIndicator />
                            </Box>
                        </Box>
                    )}

                    {thinking && (currentContent?.length === 0 || !currentContent) && (
                        <Box flexDirection="row">
                            <Text color="magenta">┃ </Text>
                            <Box paddingX={1} flexDirection="column">
                                <Text color="cyan" bold>{"Thinking: \n"}</Text>
                                <MarkdownRenderer
                                    content={thinking}
                                    baseColor="white"
                                    dimmed={true}
                                />
                            </Box>
                        </Box>
                    )}
                    
                    {currentContent && currentContent.length > 0 && (
                        <Box flexDirection="row">
                            <Text color="magenta">┃ </Text>
                            <Box paddingX={1} flexDirection="column">
                                <Text color="cyan" bold>{"Drafting: \n"}</Text>
                                <MarkdownRenderer
                                    content={currentContent}
                                    baseColor="white"
                                    dimmed={false}
                                />
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}; 