import React, { memo } from 'react';
import { Box, Text } from 'ink';
import { MarkdownRenderer } from './markdown-renderer.js';
import { Message } from '../../types.js';

interface MessageItemProps {
    message: Message;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
}

export const MessageItem = memo(function MessageItem({
    message,
    isFirstInGroup,
    isLastInGroup
}: MessageItemProps) {
    if (message.role === 'system') {
        return (
            <Box
                flexDirection="row"
                marginY={isFirstInGroup ? 1 : 0}
                marginBottom={isLastInGroup ? 1 : 0}
            >
                <Text color="gray">
                    {`> ${message.content}`}
                </Text>
            </Box>
        );
    }

    return (
        <Box
            flexDirection="row"
            marginY={isFirstInGroup ? 1 : 0}
            marginBottom={isLastInGroup ? 1 : 0}
        >
            <Text color={message.role === 'user' ? "cyan" : "magenta"}>┃ </Text>
            <Box paddingX={1}>
                {message.content && message.content.length > 0 ? (
                    <MarkdownRenderer
                        content={message.content}
                        dimmed={false}
                    />
                ) : message.metadata?.thinkingContent ? (
                    <MarkdownRenderer
                        content={message.metadata.thinkingContent}
                        dimmed={true}
                    />
                ) : message.metadata?.toolCalls ? (
                    <MarkdownRenderer
                        content="Running tool calls..."
                        dimmed={true}
                    />
                ) : null}
            </Box>
        </Box>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.role === nextProps.message.role &&
        prevProps.message.metadata?.thinkingContent === nextProps.message.metadata?.thinkingContent &&
        prevProps.message.metadata?.toolCalls?.length === nextProps.message.metadata?.toolCalls?.length &&
        prevProps.isFirstInGroup === nextProps.isFirstInGroup &&
        prevProps.isLastInGroup === nextProps.isLastInGroup
    );
});