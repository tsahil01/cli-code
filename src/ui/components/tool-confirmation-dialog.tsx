import React from 'react';
import { Box, Text, useInput } from 'ink';
import { AnthropicFunctionCall, FunctionCall, GeminiFunctionCall, OpenAIFunctionCall } from '../../types.js';

interface ToolConfirmationDialogProps {
    toolCall: FunctionCall;
    onAccept: () => void;
    onAcceptAll: () => void;
    onReject: () => void;
}

const KeyOption = ({ keyChar, description, color }: { keyChar: string, description: string, color: string }) => (
    <Box marginRight={2}>
        <Text>〈</Text>
        <Text bold color={color}>{keyChar}</Text>
        <Text>〉</Text>
        <Text> {description}</Text>
    </Box>
);

export function ToolConfirmationDialog({ toolCall, onAccept, onAcceptAll, onReject }: ToolConfirmationDialogProps) {
    useInput((input, key) => {
        if (input === 'y' || input === 'Y') {
            onAccept();
            return;
        }
        if (input === 'a' || input === 'A') {
            onAcceptAll();
            return;
        }
        if (input === 'n' || input === 'N' || key.escape) {
            onReject();
            return;
        }
    }, { isActive: true });

    const functionName = (toolCall as AnthropicFunctionCall).name ||
        (toolCall as GeminiFunctionCall).name ||
        (toolCall as OpenAIFunctionCall).function.name ||
        'unknown tool';
    const args = (toolCall as AnthropicFunctionCall).input ||
        (toolCall as GeminiFunctionCall).args ||
        (toolCall as OpenAIFunctionCall).function?.arguments || {};

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="cyan"
            paddingX={2}
            paddingY={1}
            marginY={1}
        >
            <Box>
                <Text color="cyan" bold>⚡ Tool Execution Request</Text>
            </Box>

            <Box flexDirection="column">
                <Box>
                    <Text color="gray">Function: </Text>
                    <Text bold color="cyan">{functionName}</Text>
                </Box>
                <Box>
                    <Text color="gray">Arguments:</Text>
                </Box>
                <Box
                    marginLeft={2}

                    paddingX={1}
                    borderStyle="single"
                    borderColor="gray"
                >
                    <Text dimColor>{JSON.stringify(args, null, 2)}</Text>
                </Box>
            </Box>

            <Box flexDirection="column">
                <Text bold color="gray">Options:</Text>
                <Box flexDirection="column">
                    <KeyOption keyChar="Y" description="Accept this call" color="green" />
                    <KeyOption keyChar="A" description="Accept all future calls" color="cyan" />
                    <KeyOption keyChar="N" description="Reject" color="red" />
                </Box>
            </Box>
        </Box>
    );
} 