import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { appendConfigFile } from '../../lib/configMngt.js';
import { ModelCapabilities } from '../../types.js';

interface ApiKeyPromptProps {
    model: ModelCapabilities;
    onComplete: (success: boolean) => void;
    onCancel: () => void;
}

export const ApiKeyPrompt = ({ model, onComplete, onCancel }: ApiKeyPromptProps) => {
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!inputValue.trim()) {
            setError('API key cannot be empty');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const configUpdate = {
                [model.apiKeyName]: inputValue.trim()
            };
            
            await appendConfigFile(configUpdate);
            onComplete(true);
        } catch (err) {
            setError('Failed to save API key. Please try again.');
            setIsSubmitting(false);
        }
    };

    useInput((inputStr, key) => {
        if (isSubmitting) return;

        if (key.escape) {
            onCancel();
            return;
        }

        if (key.return) {
            handleSave();
            return;
        }

        if (key.backspace || key.delete) {
            setInputValue(prev => prev.slice(0, -1));
            setError(null);
        } else if (!key.ctrl && !key.meta && inputStr) {
            const cleanInput = inputStr.replace(/[\n\r]/g, '');
            if (cleanInput) {
                setInputValue(prev => prev + cleanInput);
                setError(null);
            }
        }
    });

    const getProviderDisplayName = (provider: string) => {
        switch (provider.toLowerCase()) {
            case 'anthropic': return 'Anthropic (Claude)';
            case 'openai': return 'OpenAI (GPT)';
            case 'gemini': return 'Google (Gemini)';
            case 'deepseek': return 'DeepSeek';
            default: return provider.charAt(0).toUpperCase() + provider.slice(1);
        }
    };

    return (
        <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>            
            <Box marginBottom={1}>
                <Text color="yellow" bold>API Key Required</Text>
            </Box>
            
            <Box flexDirection="column" marginBottom={2}>
                <Text color="white">
                    To use <Text color="cyan" bold>{model.displayName}</Text>, you need to provide an API key for <Text color="green">{getProviderDisplayName(model.provider)}</Text>.
                </Text>
            </Box>

            <Box flexDirection="column" marginBottom={1}>
                <Text color="gray">Enter your {getProviderDisplayName(model.provider)} API key:</Text>
            </Box>

            <Box 
                borderStyle="round" 
                borderColor={error ? "red" : "gray"} 
                paddingX={1} 
                paddingY={0}
                marginBottom={1}
                width={60}
            >
                <Text color={error ? "red" : "white"}>
                    {inputValue || (error ? error : 'Paste your API key here...')}
                </Text>
            </Box>

            {error && (
                <Box marginBottom={1}>
                    <Text color="red">⚠ {error}</Text>
                </Box>
            )}

            <Box flexDirection="column" marginBottom={1}>
                <Text color="dim">
                    {isSubmitting ? 'Saving...' : '↵ Press Enter to save • Esc to cancel'}
                </Text>
            </Box>

            <Box flexDirection="column">
                <Text color="dim">
                    💡 Get your API key from:
                </Text>
                <Text color="dim">
                    {model.provider === 'anthropic' && '   • https://console.anthropic.com/'}
                    {model.provider === 'openai' && '   • https://platform.openai.com/api-keys'}
                    {model.provider === 'gemini' && '   • https://aistudio.google.com/app/apikey'}
                    {model.provider === 'deepseek' && '   • https://platform.deepseek.com/api_keys'}
                    {!['anthropic', 'openai', 'gemini', 'deepseek'].includes(model.provider) && `   • Check ${getProviderDisplayName(model.provider)} documentation`}
                </Text>
            </Box>
        </Box>
    );
}; 