import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { readConfigFile, appendConfigFile } from '../../lib/configMngt.js';

interface ToolsManagerProps {
    onClose: () => void;
}

export function ToolsManager({ onClose }: ToolsManagerProps) {
    const [acceptAllToolCalls, setAcceptAllToolCalls] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await readConfigFile();
                setAcceptAllToolCalls(config.acceptAllToolCalls || false);
            } catch (error) {
                console.error('Failed to load config:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    const toggleAutoAccept = async () => {
        try {
            const newValue = !acceptAllToolCalls;
            await appendConfigFile({ acceptAllToolCalls: newValue });
            setAcceptAllToolCalls(newValue);
        } catch (error) {
            console.error('Failed to update config:', error);
        }
    };

    useInput((input, key) => {
        if (key.escape) {
            onClose();
            return;
        }

        if (key.return) {
            toggleAutoAccept();
            return;
        }
    });

    if (isLoading) {
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
                <Text color="cyan" bold>Loading tool settings...</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
            <Box>
                <Text color="cyan" bold>Tool Call Settings</Text>
            </Box>
            
            <Box flexDirection="column" marginTop={1}>
                <Box>
                    <Text color="gray">Auto-accept tool calls: </Text>
                    <Text color={acceptAllToolCalls ? "green" : "red"} bold>
                        {acceptAllToolCalls ? "ON" : "OFF"}
                    </Text>
                </Box>
                
                <Box marginTop={1}>
                    <Text color="dim" italic>
                        When enabled, tool calls will be automatically executed without confirmation.
                    </Text>
                </Box>
            </Box>

            <Box flexDirection="column" marginTop={1}>
                <Text bold color="gray">Options:</Text>
                <Box flexDirection="column">
                    <Text color="cyan">Enter - Toggle auto-accept setting</Text>
                    <Text color="red">Esc - Close</Text>
                </Box>
            </Box>
        </Box>
    );
} 