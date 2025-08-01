import React, { memo, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { MarkdownRenderer } from './markdown-renderer.js';
import { Message, UsageMetadata } from '../../types.js';
import { MessageItem } from './message-item.js';

interface MessageDisplayProps {
    messages: Message[];
    thinking?: string;
    currentContent?: string;
    isProcessing?: boolean;
    noMargin?: boolean;
    usage: {
        setUsage: (usage: UsageMetadata | null) => void;
    };
}

export const MessageDisplay = memo(function MessageDisplay({ messages, thinking, currentContent, isProcessing, noMargin = false, usage }: MessageDisplayProps) {
    return (
        <>
            <MessageHistory messages={messages} noMargin={noMargin} usage={usage} />
            <StreamingLine thinking={thinking} currentContent={currentContent} isProcessing={isProcessing} />
        </>
    );
});

export const MessageHistory = memo(function MessageHistory({ messages, noMargin = false, usage }: { messages: Message[]; noMargin?: boolean; usage: { setUsage: (usage: UsageMetadata | null) => void }; }) {
    useEffect(() => {
        if (messages.length > 0) {
            let lastMsg = messages[messages.length - 1];
            if (lastMsg.metadata?.usageMetadata) {
                usage.setUsage(lastMsg.metadata.usageMetadata);
            }
        }
    }, [messages.length, usage]);   

    const filteredMessages = useMemo(() => 
        messages.filter(msg => !msg.ignoreInDisplay), 
        [messages]
    );

    const messageItems = useMemo(() => {
        if (filteredMessages.length === 0) {
            return null;
        }

        return filteredMessages.map((message, index) => {
            const isFirstInGroup = index === 0 || filteredMessages[index - 1].role !== message.role;
            const isLastInGroup = index === filteredMessages.length - 1 || filteredMessages[index + 1].role !== message.role;
            const messageKey = `${message.role}-${index}-${message.timestamp || Date.now()}`;
            
            return (
                <MessageItem
                    key={messageKey}
                    message={message}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                />
            );
        });
    }, [filteredMessages]);

    if (filteredMessages.length === 0) {
        return null;
    }

    return (
        <Box flexDirection="column" {...(!noMargin ? { marginY: 1 } : {})}>
            {messageItems}
        </Box>
    );
});

export const StreamingLine = memo(function StreamingLine({ thinking, currentContent, isProcessing }: { thinking?: string; currentContent?: string; isProcessing?: boolean }) {
    if (!isProcessing) return null;
    if (!thinking && !currentContent) return null;
    
    const TextComponent = Text as any;
    
    return (
        <Box flexDirection="column">
            <Box flexDirection="row">
                <TextComponent color="magenta">┃ </TextComponent>
                <Box paddingX={1} flexDirection="column">
                </Box>
            </Box>
            {thinking && (!currentContent || currentContent.length === 0) && (
                <Box flexDirection="row">
                    <TextComponent color="magenta">┃ </TextComponent>
                    <Box paddingX={1} flexDirection="column">
                        <TextComponent color="cyan" bold>{"Thinking: \n"}</TextComponent>
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
                    <TextComponent color="magenta">┃ </TextComponent>
                    <Box paddingX={1} flexDirection="column">
                        <TextComponent color="cyan" bold>{"Drafting: \n"}</TextComponent>
                        <MarkdownRenderer
                            content={currentContent}
                            baseColor="white"
                            dimmed={false}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
});