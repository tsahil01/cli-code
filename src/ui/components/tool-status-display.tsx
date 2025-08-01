import React, { memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import { ToolCallStatus } from '../../types.js';

interface ToolStatusDisplayProps {
    toolCalls: ToolCallStatus[];
}

export const ToolStatusDisplay = memo(function ToolStatusDisplay({ toolCalls }: ToolStatusDisplayProps) {
    const displayToolCalls = useMemo(() => {
        const currentTime = Date.now();
        const filteredToolCalls = toolCalls.filter(toolCall => {
            if (toolCall.status === 'pending') return true;
            if (toolCall.status === 'error') {
                return (currentTime - toolCall.timestamp) < 5000;
            }
            if (toolCall.status === 'success') {
                return (currentTime - toolCall.timestamp) < 3000;
            }
            return true;
        });
        return filteredToolCalls.slice(-3);
    }, [toolCalls]);

    if (displayToolCalls.length === 0) {
        return null;
    }

    const getStatusColor = (status: ToolCallStatus['status']) => {
        switch (status) {
            case 'pending': return 'yellow';
            case 'success': return 'green';
            case 'error': return 'red';
            default: return 'gray';
        }
    };

    const getStatusSymbol = (status: ToolCallStatus['status']) => {
        switch (status) {
            case 'pending': return '●';
            case 'success': return '●';
            case 'error': return '●';
            default: return '●';
        }
    };

    return (
        <Box flexDirection="column" marginTop={1}>
            <Text color="gray" dimColor>Recent Tool Calls:</Text>
            {displayToolCalls.map((toolCall) => (
                <Box key={toolCall.id} flexDirection="row" alignItems="center">
                    <Text color={getStatusColor(toolCall.status)}>{getStatusSymbol(toolCall.status)} </Text>
                    <Text color="white">{toolCall.name}</Text>
                </Box>
            ))}
        </Box>
    );
}); 