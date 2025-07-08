import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { ToolCallStatus } from '../../types.js';

interface ToolStatusDisplayProps {
    toolCalls: ToolCallStatus[];
}

export function ToolStatusDisplay({ toolCalls }: ToolStatusDisplayProps) {
    const [, forceUpdate] = useState({});
    
    useEffect(() => {
        const interval = setInterval(() => {
            forceUpdate({});
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (toolCalls.length === 0) {
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

    const displayToolCalls = filteredToolCalls.slice(-3);

    return (
        <Box flexDirection="column" marginBottom={1}>
            <Text color="gray" dimColor>Tool Calls:</Text>
            {displayToolCalls.map((toolCall) => (
                <Box key={toolCall.id} flexDirection="row" alignItems="center">
                    <Text color={getStatusColor(toolCall.status)}>
                        {getStatusSymbol(toolCall.status)}
                    </Text>
                    <Box marginLeft={1}>
                        <Text color="white">
                            {toolCall.name}
                        </Text>
                    </Box>
                    {toolCall.status === 'pending' && (
                        <Box marginLeft={1}>
                            <Text color="yellow">
                                (running...)
                            </Text>
                        </Box>
                    )}
                    {toolCall.status === 'error' && toolCall.errorMessage && (
                        <Box marginLeft={1}>
                            <Text color="red">
                                - {toolCall.errorMessage}
                            </Text>
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    );
} 