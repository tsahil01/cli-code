import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ApiKeySetupProps {
    onComplete: (apiKeys: { ANTHROPIC_API_KEY?: string; GEMINI_API_KEY?: string }) => void;
}

export const ApiKeySetup = ({ onComplete }: ApiKeySetupProps) => {
    const [currentStep, setCurrentStep] = useState<'intro' | 'anthropic' | 'gemini' | 'complete'>('intro');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [currentInput, setCurrentInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useInput((inputStr, key) => {
        if (isSubmitting) return;
        
        if (key.return) {
            if (currentStep === 'intro') {
                setCurrentStep('anthropic');
            } else if (currentStep === 'anthropic') {
                setAnthropicKey(currentInput.trim());
                setCurrentInput('');
                setCurrentStep('gemini');
            } else if (currentStep === 'gemini') {
                setGeminiKey(currentInput.trim());
                setCurrentInput('');
                setCurrentStep('complete');
                
                const apiKeys: { ANTHROPIC_API_KEY?: string; GEMINI_API_KEY?: string } = {};
                if (anthropicKey.trim()) {
                    apiKeys.ANTHROPIC_API_KEY = anthropicKey.trim();
                }
                if (currentInput.trim()) {
                    apiKeys.GEMINI_API_KEY = currentInput.trim();
                }
                
                setIsSubmitting(true);
                onComplete(apiKeys);
            }
        } else if (key.backspace || key.delete) {
            setCurrentInput(prev => prev.slice(0, -1));
        } else if (!key.ctrl && !key.meta) {
            const cleanInput = inputStr.replace(/[\n\r]/g, '');
            if (!cleanInput) return;
            setCurrentInput(prev => prev + cleanInput);
        }
    });

    if (currentStep === 'intro') {
        return (
            <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                <Box marginBottom={2}>
                    <Text color="cyan" bold>{`> API Key Setup!`}</Text>
                </Box>
                
                <Box flexDirection="column" marginBottom={2}>
                    <Text color="white">Welcome! Let's set up your API keys.</Text>
                    <Text color="gray">You need at least one API key to use the chat functionality.</Text>
                </Box>

                <Box flexDirection="column" marginBottom={2}>
                    <Text color="yellow" bold>Supported Providers:</Text>
                    <Text color="gray">• Anthropic (Claude models)</Text>
                    <Text color="gray">• Google (Gemini models)</Text>
                </Box>

                <Box flexDirection="column" marginBottom={2}>
                    <Text color="dim">You can:</Text>
                    <Text color="dim">• Enter one or both API keys</Text>
                    <Text color="dim">• Press Enter to skip if you don't have a key</Text>
                    <Text color="dim">• Add keys later in settings</Text>
                </Box>

                <Box marginTop={1}>
                    <Text color="cyan">↵ Press Enter to continue</Text>
                </Box>
            </Box>
        );
    }

    if (currentStep === 'anthropic') {
        return (
            <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                <Box marginBottom={2}>
                    <Text color="cyan" bold>{`> Anthropic API Key Setup`}</Text>
                </Box>
                
                <Box flexDirection="column" marginBottom={1}>
                    <Text color="blue" bold>Enter your Anthropic API key (optional):</Text>
                    <Text color="gray">This will enable Claude models</Text>
                </Box>

                <Box flexDirection="column" marginBottom={1}>
                    <Box marginBottom={0}>
                        <Text color="cyan" bold>API Key</Text>
                    </Box>
                    <Box>
                        <Text color="gray">› </Text>
                        <Text color="white">{currentInput}</Text>
                        <Text color="gray">{!isSubmitting ? '_' : ''}</Text>
                    </Box>
                </Box>

                <Box flexDirection="column" marginTop={1}>
                    <Text color="dim">↵ Press Enter to continue (or skip)</Text>
                </Box>
            </Box>
        );
    }

    if (currentStep === 'gemini') {
        return (
            <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                <Box marginBottom={2}>
                    <Text color="cyan" bold>{`> Gemini API Key Setup`}</Text>
                </Box>
                
                <Box flexDirection="column" marginBottom={1}>
                    <Text color="blue" bold>Enter your Google API key (optional):</Text>
                    <Text color="gray">This will enable Gemini models</Text>
                </Box>

                <Box flexDirection="column" marginBottom={1}>
                    <Box marginBottom={0}>
                        <Text color="cyan" bold>API Key</Text>
                    </Box>
                    <Box>
                        <Text color="gray">› </Text>
                        <Text color="white">{currentInput}</Text>
                        <Text color="gray">{!isSubmitting ? '_' : ''}</Text>
                    </Box>
                </Box>

                <Box flexDirection="column" marginTop={1}>
                    <Text color="dim">↵ Press Enter to complete setup</Text>
                </Box>
            </Box>
        );
    }

    if (currentStep === 'complete') {
        return (
            <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                <Box marginBottom={2}>
                    <Text color="green" bold>✅ Setup Complete!</Text>
                </Box>
                
                <Box flexDirection="column" marginBottom={1}>
                    <Text color="white">Your API keys have been saved.</Text>
                    <Text color="gray">You can now use the chat functionality.</Text>
                </Box>

                <Box flexDirection="column" marginTop={1}>
                    <Text color="dim">Starting CLI Code...</Text>
                </Box>
            </Box>
        );
    }

    return null;
}; 