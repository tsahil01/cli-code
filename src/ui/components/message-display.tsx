import React from 'react';
import { Box, Text } from 'ink';
import { MarkdownRenderer } from './markdown-renderer.js';
import { Message } from '../../types.js';

export const MessageDisplay = ({ messages }: { messages: Message[] }) => {
    if (messages.length === 0) {
        return null;
    }

    return (
        <Box flexDirection="column" marginY={1}>
            {messages.map((message, index) => {
                const isFirstInGroup = index === 0 || messages[index - 1].type !== message.type;
                const isLastInGroup = index === messages.length - 1 || messages[index + 1].type !== message.type;
                
                return (
                    <Box 
                        key={index} 
                        flexDirection="row"
                        marginY={isFirstInGroup ? 1 : 0}
                        marginBottom={isLastInGroup ? 1 : 0}
                    >
                        <Text color={message.type === 'user' ? "cyan" : "magenta"}>
                            ┃ 
                        </Text>
                        
                        <Box 
                            paddingX={1}
                            width="65%"
                        >
                            <MarkdownRenderer
                                content={message.content}
                                baseColor={message.type === 'user' ? "white" : "gray"}
                                dimmed={message.type !== 'user'}
                            />
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}; 