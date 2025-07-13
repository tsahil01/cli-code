import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ConnectionFailureDialogProps {
    onContinue: () => void;
    onRetry: () => void;
}

export const ConnectionFailureDialog = ({ onContinue, onRetry }: ConnectionFailureDialogProps) => {
    const [selectedOption, setSelectedOption] = useState<'retry' | 'continue'>('retry');

    useInput((input, key) => {
        if (key.upArrow || key.downArrow || key.tab) {
            setSelectedOption(selectedOption === 'retry' ? 'continue' : 'retry');
        } else if (key.return || input === 'y' || input === 'Y') {
            if (selectedOption === 'retry') {
                onRetry();
            } else {
                onContinue();
            }
        } else if (input === 'r' || input === 'R') {
            onRetry();
        } else if (input === 'c' || input === 'C') {
            onContinue();
        }
    });

    return (
        <Box flexDirection="column" marginY={1}>
            <Box marginBottom={1}>
                <Text color="red">⚠️  Your Editor is not connected</Text>
            </Box>
            
            <Box marginBottom={1} flexDirection="column">
                <Text color="gray"> 
                    Some features related to the editor may not work properly.
                    Verify the port is correct in /settings.
                </Text>
                <Text color="gray">
                    If you are not using the editor, you can continue without connection. 
                </Text>
            </Box>

            <Box flexDirection="column" marginBottom={1}>
                <Box marginBottom={1}>
                    <Text color={selectedOption === 'retry' ? 'green' : 'gray'}>
                        {selectedOption === 'retry' ? '► ' : '  '}[R]etry connection
                    </Text>
                </Box>
                
                <Box>
                    <Text color={selectedOption === 'continue' ? 'green' : 'gray'}>
                        {selectedOption === 'continue' ? '► ' : '  '}[C]ontinue without connection
                    </Text>
                </Box>
            </Box>

            <Box>
                <Text color="dim">
                    Use ↑/↓ or Tab to select, Enter/Y to confirm, or press R/C directly
                </Text>
            </Box>
        </Box>
    );
}; 