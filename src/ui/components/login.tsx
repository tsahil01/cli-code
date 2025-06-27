import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import BigText from 'ink-big-text';

interface LoginProps {
    onLogin: (token: string) => void;
    loginError?: string;
}

export const Login = ({ onLogin, loginError }: LoginProps) => {
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useInput((inputStr, key) => {
        if (isSubmitting) return;
        
        if (key.return) {
            if (input.trim()) {
                setIsSubmitting(true);
                setError('');
                onLogin(input.trim());
            } else {
                setError('Please enter a valid token');
            }
        } else if (key.backspace || key.delete) {
            setInput(prev => prev.slice(0, -1));
            setError('');
        } else if (!key.ctrl && !key.meta) {
            const cleanInput = inputStr.replace(/[\n\r]/g, '');
            if (!cleanInput) return;
            setInput(prev => prev + cleanInput);
            setError('');
        }
    });

    return (
        <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
            <Box marginBottom={2}>
            </Box>
            
            <Box flexDirection="column" marginBottom={1}>
                <Text color="white" bold>Welcome to CLI CODE!</Text>
                <Text color="gray">Please enter your authentication token to continue</Text>
            </Box>

            <Box flexDirection="column" marginBottom={1}>
                <Box marginBottom={0}>
                    <Text color="cyan" bold>Authentication Token</Text>
                </Box>
                <Box>
                    <Text color="gray">› </Text>
                    <Text color="white">{input}</Text>
                    <Text color="gray">{!isSubmitting ? '_' : ''}</Text>
                </Box>
            </Box>

            {(error || loginError) && (
                <Box marginBottom={1}>
                    <Text color="red">❌ {error || loginError}</Text>
                </Box>
            )}

            {isSubmitting && (
                <Box marginBottom={1}>
                    <Text color="cyan">🔐 Authenticating...</Text>
                </Box>
            )}

            <Box flexDirection="column" marginTop={1}>
                <Text color="dim">
                    {isSubmitting ? 'Please wait...' : '↵ Press Enter to login'}
                </Text>
                <Text color="dim">⌃C Exit</Text>
            </Box>

            <Box marginTop={2} borderStyle="single" borderColor="dim" paddingX={2} paddingY={0}>
                <Box flexDirection="column">
                    <Text color="yellow" bold>Need help?</Text>
                    <Text color="gray">• Visit our docs for token setup</Text>
                    <Text color="gray">• Contact support if you're stuck</Text>
                </Box>
            </Box>
        </Box>
    );
};
