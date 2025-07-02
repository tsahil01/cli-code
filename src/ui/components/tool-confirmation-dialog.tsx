import React from 'react';
import { Box, Text, useInput } from 'ink';
import { FunctionCall } from '../../types.js';

interface ToolConfirmationDialogProps {
    toolCall: FunctionCall;
    onAccept: () => void;
    onAcceptAll: () => void;
    onReject: () => void;
}

export function ToolConfirmationDialog({ toolCall, onAccept, onAcceptAll, onReject }: ToolConfirmationDialogProps) {
    useInput((input, key) => {
        if (input === 'y' || input === 'Y') {
            onAccept();
        } else if (input === 'a' || input === 'A') {
            onAcceptAll();
        } else if (input === 'n' || input === 'N' || key.escape) {
            onReject();
        }
    });

    const functionName = 'functionCall' in toolCall ? toolCall.functionCall.name : toolCall.name;
    const args = 'functionCall' in toolCall ? toolCall.functionCall.args : toolCall.input;

    return (
        <Box flexDirection="column" borderStyle="round" padding={1}>
            <Box>
                <Text bold>Tool Call Confirmation</Text>
            </Box>
            <Box marginTop={1}>
                <Text>Function: </Text>
                <Text bold color="blue">{functionName}</Text>
            </Box>
            <Box marginTop={1}>
                <Text>Arguments: </Text>
                <Text color="yellow">{JSON.stringify(args, null, 2)}</Text>
            </Box>
            <Box marginTop={1}>
                <Text>Press </Text>
                <Text bold color="green">Y</Text>
                <Text> to accept, </Text>
                <Text bold color="blue">A</Text>
                <Text> to accept all future calls, </Text>
                <Text bold color="red">N</Text>
                <Text> or </Text>
                <Text bold>ESC</Text>
                <Text> to reject</Text>
            </Box>
        </Box>
    );
} 