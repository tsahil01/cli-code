import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { readConfigFile, appendConfigFile } from '../../lib/configMngt.js';
import { ConfigFormat } from '../../types.js';
import { SmallHeader } from './small-header.js';

interface ApiKeyManagerProps {
    action: 'view' | 'add' | 'remove';
    onClose: () => void;
}

export const ApiKeyManager = ({ action, onClose }: ApiKeyManagerProps) => {
    const [config, setConfig] = useState<ConfigFormat | null>(null);
    const [currentStep, setCurrentStep] = useState<'loading' | 'main' | 'select' | 'input' | 'confirm'>('loading');
    const [selectedProvider, setSelectedProvider] = useState<'anthropic' | 'gemini'>('anthropic');
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const configData = await readConfigFile();
            setConfig(configData);
            setCurrentStep('main');
        } catch (error) {
            setCurrentStep('main');
        }
    };

    const handleSaveConfig = async (newConfig: Partial<ConfigFormat>) => {
        try {
            await appendConfigFile(newConfig);
            await loadConfig();
            return true;
        } catch (error) {
            return false;
        }
    };

    const maskApiKey = (key: string) => {
        if (!key) return 'Not set';
        return key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : '***';
    };

    useInput((inputStr, key) => {
        if (isSubmitting) return;

        if (key.escape) {
            if (currentStep === 'input' || currentStep === 'confirm' || currentStep === 'select') {
                setCurrentStep('main');
                setSelectedProvider('anthropic');
                setInputValue('');
            } else {
                onClose();
            }
            return;
        }

        if (currentStep === 'main') {
            if (action === 'view') {
                if (key.return || key.escape) {
                    onClose();
                }
            } else if (action === 'add') {
                if (key.return) {
                    setCurrentStep('select');
                }
            } else if (action === 'remove') {
                if (key.return) {
                    setCurrentStep('select');
                }
            }
        } else if (currentStep === 'select') {
            if (key.return) {
                if (selectedProvider === 'anthropic') {
                    if (action === 'add') {
                        setCurrentStep('input');
                    } else {
                        setCurrentStep('confirm');
                    }
                } else if (selectedProvider === 'gemini') {
                    if (action === 'add') {
                        setCurrentStep('input');
                    } else {
                        setCurrentStep('confirm');
                    }
                }
            } else if (key.upArrow || key.downArrow) {
                setSelectedProvider(prev => prev === 'anthropic' ? 'gemini' : 'anthropic');
            }
        } else if (currentStep === 'input') {
            if (key.return) {
                if (selectedProvider === 'anthropic') {
                    setIsSubmitting(true);
                    handleSaveConfig({ ANTHROPIC_API_KEY: inputValue.trim() }).then(() => {
                        setIsSubmitting(false);
                        setCurrentStep('main');
                        setInputValue('');
                        setSelectedProvider('anthropic');
                    });
                } else if (selectedProvider === 'gemini') {
                    setIsSubmitting(true);
                    handleSaveConfig({ GEMINI_API_KEY: inputValue.trim() }).then(() => {
                        setIsSubmitting(false);
                        setCurrentStep('main');
                        setInputValue('');
                        setSelectedProvider('anthropic');
                    });
                }
            } else if (key.backspace || key.delete) {
                setInputValue(prev => prev.slice(0, -1));
            } else if (!key.ctrl && !key.meta) {
                const cleanInput = inputStr.replace(/[\n\r]/g, '');
                if (!cleanInput) return;
                setInputValue(prev => prev + cleanInput);
            }
        } else if (currentStep === 'confirm') {
            if (key.return) {
                if (selectedProvider === 'anthropic') {
                    setIsSubmitting(true);
                    handleSaveConfig({ ANTHROPIC_API_KEY: undefined }).then(() => {
                        setIsSubmitting(false);
                        setCurrentStep('main');
                        setSelectedProvider('anthropic');
                    });
                } else if (selectedProvider === 'gemini') {
                    setIsSubmitting(true);
                    handleSaveConfig({ GEMINI_API_KEY: undefined }).then(() => {
                        setIsSubmitting(false);
                        setCurrentStep('main');
                        setSelectedProvider('anthropic');
                    });
                }
            }
        }
    });

    if (currentStep === 'loading') {
        return (
            <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                <SmallHeader />
                <Text color="cyan" bold>Loading API key configuration...</Text>
            </Box>
        );
    }

    if (action === 'view') {
        return (
            <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                <SmallHeader />
                <Box marginBottom={2}>
                    <Text color="cyan" bold>API Key Status</Text>
                </Box>
                
                <Box flexDirection="column" marginBottom={2}>
                    <Text color="blue" bold>Anthropic API Key:</Text>
                    <Text color="gray">{maskApiKey(config?.ANTHROPIC_API_KEY || '')}</Text>
                </Box>

                <Box flexDirection="column" marginBottom={2}>
                    <Text color="blue" bold>Gemini API Key:</Text>
                    <Text color="gray">{maskApiKey(config?.GEMINI_API_KEY || '')}</Text>
                </Box>

                <Box marginTop={1}>
                    <Text color="dim">↵ Press Enter or Esc to close</Text>
                </Box>
            </Box>
        );
    }

    if (action === 'add') {
        if (currentStep === 'main') {
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    <SmallHeader />
                    <Box marginBottom={2}>
                        <Text color="cyan" bold>Add API Key</Text>
                    </Box>
                    
                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="white">Select which API key to add:</Text>
                    </Box>

                    <Box flexDirection="column" marginBottom={1}>
                        <Text color="yellow">1. Anthropic API Key</Text>
                        <Text color="gray">   For Claude models</Text>
                        <Text color="gray">   Current: {maskApiKey(config?.ANTHROPIC_API_KEY || '')}</Text>
                    </Box>

                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="yellow">2. Gemini API Key</Text>
                        <Text color="gray">   For Google Gemini models</Text>
                        <Text color="gray">   Current: {maskApiKey(config?.GEMINI_API_KEY || '')}</Text>
                    </Box>

                    <Box marginTop={1}>
                        <Text color="dim">↵ Press Enter to continue • Esc to cancel</Text>
                    </Box>
                </Box>
            );
        }

        if (currentStep === 'select') {
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    <SmallHeader />
                    <Box marginBottom={2}>
                        <Text color="cyan" bold>Select Provider</Text>
                    </Box>
                    
                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="white">Choose which API key to add:</Text>
                    </Box>

                    <Box flexDirection="column" marginBottom={1}>
                        <Text 
                            color={selectedProvider === 'anthropic' ? 'cyan' : 'gray'}
                            bold={selectedProvider === 'anthropic'}
                        >
                            {selectedProvider === 'anthropic' ? '› ' : '  '}Anthropic API Key
                        </Text>
                        <Text color="gray">   For Claude models</Text>
                    </Box>

                    <Box flexDirection="column" marginBottom={2}>
                        <Text 
                            color={selectedProvider === 'gemini' ? 'cyan' : 'gray'}
                            bold={selectedProvider === 'gemini'}
                        >
                            {selectedProvider === 'gemini' ? '› ' : '  '}Gemini API Key
                        </Text>
                        <Text color="gray">   For Google Gemini models</Text>
                    </Box>

                    <Box marginTop={1}>
                        <Text color="dim">↑↓ select • ↵ confirm • Esc cancel</Text>
                    </Box>
                </Box>
            );
        }

        if (currentStep === 'input') {
            const providerName = selectedProvider === 'anthropic' ? 'Anthropic' : 'Gemini';
            const keyName = selectedProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GEMINI_API_KEY';
            
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    <SmallHeader />
                    <Box marginBottom={2}>
                        <Text color="cyan" bold>Add {providerName} API Key</Text>
                    </Box>
                    
                    <Box flexDirection="column" marginBottom={1}>
                        <Text color="blue" bold>Enter your {providerName} API key:</Text>
                    </Box>

                    <Box flexDirection="column" marginBottom={1}>
                        <Box marginBottom={0}>
                            <Text color="cyan" bold>API Key</Text>
                        </Box>
                        <Box>
                            <Text color="gray">› </Text>
                            <Text color="white">{inputValue}</Text>
                            <Text color="gray">{!isSubmitting ? '_' : ''}</Text>
                        </Box>
                    </Box>

                    <Box flexDirection="column" marginTop={1}>
                        <Text color="dim">↵ Press Enter to save • Esc to cancel</Text>
                    </Box>
                </Box>
            );
        }
    }

    if (action === 'remove') {
        if (currentStep === 'main') {
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    <SmallHeader />
                    <Box marginBottom={2}>
                        <Text color="cyan" bold>Remove API Key</Text>
                    </Box>
                    
                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="white">Select which API key to remove:</Text>
                    </Box>

                    <Box flexDirection="column" marginBottom={1}>
                        <Text color="yellow">1. Anthropic API Key</Text>
                        <Text color="gray">   Current: {maskApiKey(config?.ANTHROPIC_API_KEY || '')}</Text>
                    </Box>

                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="yellow">2. Gemini API Key</Text>
                        <Text color="gray">   Current: {maskApiKey(config?.GEMINI_API_KEY || '')}</Text>
                    </Box>

                    <Box marginTop={1}>
                        <Text color="dim">↵ Press Enter to continue • Esc to cancel</Text>
                    </Box>
                </Box>
            );
        }

        if (currentStep === 'select') {
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    <SmallHeader />
                    <Box marginBottom={2}>
                        <Text color="cyan" bold>Select Provider</Text>
                    </Box>
                    
                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="white">Choose which API key to remove:</Text>
                    </Box>

                    <Box flexDirection="column" marginBottom={1}>
                        <Text 
                            color={selectedProvider === 'anthropic' ? 'cyan' : 'gray'}
                            bold={selectedProvider === 'anthropic'}
                        >
                            {selectedProvider === 'anthropic' ? '› ' : '  '}Anthropic API Key
                        </Text>
                        <Text color="gray">   Current: {maskApiKey(config?.ANTHROPIC_API_KEY || '')}</Text>
                    </Box>

                    <Box flexDirection="column" marginBottom={2}>
                        <Text 
                            color={selectedProvider === 'gemini' ? 'cyan' : 'gray'}
                            bold={selectedProvider === 'gemini'}
                        >
                            {selectedProvider === 'gemini' ? '› ' : '  '}Gemini API Key
                        </Text>
                        <Text color="gray">   Current: {maskApiKey(config?.GEMINI_API_KEY || '')}</Text>
                    </Box>

                    <Box marginTop={1}>
                        <Text color="dim">↑↓ select • ↵ confirm • Esc cancel</Text>
                    </Box>
                </Box>
            );
        }

        if (currentStep === 'confirm') {
            const providerName = selectedProvider === 'anthropic' ? 'Anthropic' : 'Gemini';
            
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    <SmallHeader />
                    <Box marginBottom={2}>
                        <Text color="red" bold>Confirm Removal</Text>
                    </Box>
                    
                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="white">Are you sure you want to remove the {providerName} API key?</Text>
                        <Text color="gray">This action cannot be undone.</Text>
                    </Box>

                    <Box flexDirection="column" marginTop={1}>
                        <Text color="dim">↵ Press Enter to confirm • Esc to cancel</Text>
                    </Box>
                </Box>
            );
        }
    }

    return null;
}; 