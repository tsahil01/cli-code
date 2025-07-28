import React, { memo, useEffect } from 'react';
import { Box, Text } from 'ink';
import { MarkdownRenderer } from './markdown-renderer.js';
import { Message, UsageMetadata } from '../../types.js';

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
    }, [messages, usage]);

    if (messages.length === 0) {
        return null;
    }

    return (
        <Box flexDirection="column" {...(!noMargin ? { marginY: 1 } : {})}>
            {messages.filter(msg => !msg.ignoreInDisplay).map((message, index, filteredMessages) => {
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
                                <Text color={message.role === 'user' ? "cyan" : "magenta"}>┃ </Text>
                                <Box paddingX={1}>
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
                                    {(!message.content || message.content.length === 0) && !message.metadata?.thinkingContent && message.metadata?.toolCalls && (
                                        <MarkdownRenderer
                                            content={`Running tool calls...`}
                                            dimmed={true}
                                        />
                                    )}
                                </Box>
                            </>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
});

export const StreamingLine = memo(function StreamingLine({ thinking, currentContent, isProcessing }: { thinking?: string; currentContent?: string; isProcessing?: boolean }) {
    if (!isProcessing || (!thinking && !currentContent)) return null;
    return (
        <Box flexDirection="column">
            <Box flexDirection="row">
                <Text color="magenta">┃ </Text>
                <Box paddingX={1} flexDirection="column">
                </Box>
            </Box>
            {thinking && (!currentContent || currentContent.length === 0) && (
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
    );
});
