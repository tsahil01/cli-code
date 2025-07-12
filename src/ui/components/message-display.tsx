import React from 'react';
import { Box, Text } from 'ink';
import { MarkdownRenderer } from './markdown-renderer.js';
import { Message } from '../../types.js';

interface MessageDisplayProps {
    messages: Message[];
    thinking?: string;
    currentContent?: string;
    isProcessing?: boolean;
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

export const MessageDisplay = ({
    messages,
    thinking,
    currentContent,
    isProcessing,
}: MessageDisplayProps) => {

    if (messages.length === 0 && !isProcessing) {
        return null;
    }

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
                        {message.role === 'system' ? (
                            <Text color="gray">
                                {`> ${message.content}`}
                            </Text>
                        ) : (
                            <>
                                <Text color={message.role === 'user' ? "cyan" : "magenta"}>
                                    {message.role === 'user' ? 'User: ' : 'Assistant: '}
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
                            </>
                        )}
                    </Box>
                );
            })}

            {isProcessing && (
                <Box flexDirection="column">
                    <Box flexDirection="row">
                        <Text color="magenta">┃ </Text>
                        <Box paddingX={1} flexDirection="column">
                            <LoadingIndicator />
                        </Box>
                    </Box>


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