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
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

    React.useEffect(() => {
        const timer = setInterval(() => {
            setFrame(f => (f + 1) % frames.length);
        }, 80);
        return () => clearInterval(timer);
    }, []);

    return <Text color="yellow">{frames[frame]}</Text>;
};

export const MessageDisplay = ({ 
    messages,
    thinking,
    currentContent,
    isProcessing
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
                        <Text color={message.role === 'user' ? "cyan" : "magenta"}>
                            ┃ 
                        </Text>
                        
                        <Box 
                            paddingX={1}
                            
                        >
                            <MarkdownRenderer
                                content={message.content || ''}
                                baseColor={message.role === 'user' ? "white" : "white"}
                                dimmed={false}
                            />
                        </Box>
                    </Box>
                );
            })}
            
            {isProcessing && (
                <Box flexDirection="column">
                    <Box flexDirection="row">
                        <Text color="magenta">┃ </Text>
                        <Box paddingX={1}>
                            <LoadingIndicator />
                            <Text color="yellow"> Processing</Text>
                        </Box>
                    </Box>

                    {thinking && (currentContent?.length === 0 || !currentContent) && (
                        <Box flexDirection="row">
                            <Text color="magenta">┃ </Text>
                            <Box paddingX={1} >
                                <Text color="yellow">Thinking: </Text>
                                <MarkdownRenderer
                                    content={thinking}
                                    baseColor="yellow"
                                    dimmed={false}
                                />
                            </Box>
                        </Box>
                    )}
                    
                    {currentContent && currentContent.length > 0 && (
                        <Box flexDirection="row">
                            <Text color="magenta">┃ </Text>
                            <Box paddingX={1} >
                                <Text color="yellow">Drafting: </Text>
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