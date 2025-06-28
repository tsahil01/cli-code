import React from 'react';
import { Box, Text } from 'ink';

interface Message {
    content: string;
    isUser: boolean;
}

interface MessageDisplayProps {
    messages: Message[];
}

export const MessageDisplay = ({ messages }: MessageDisplayProps) => {
    if (messages.length === 0) {
        return null;
    }

    return (
        <Box flexDirection="column" marginY={1}>
            {messages.map((message, index) => {
                const isFirstInGroup = index === 0 || messages[index - 1].isUser !== message.isUser;
                const isLastInGroup = index === messages.length - 1 || messages[index + 1].isUser !== message.isUser;
                
                return (
                    <Box 
                        key={index} 
                        flexDirection="row"
                        marginY={isFirstInGroup ? 1 : 0}
                        marginBottom={isLastInGroup ? 1 : 0}
                    >
                        {/* Message indicator */}
                        <Text color={message.isUser ? "cyan" : "magenta"}>
                            ┃ 
                        </Text>
                        
                        <Box 
                            paddingX={1}
                            width="65%"
                        >
 
                            <Text
                                color={message.isUser ? "white" : "gray"}
                                dimColor={!message.isUser}
                                bold={isFirstInGroup}
                            >
                                {message.content}
                            </Text>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}; 