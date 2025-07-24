import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { readConfigFile, appendConfigFile } from '../../lib/configMngt.js';
import { ConfigFormat } from '../../types.js';

interface ApiKeyManagerProps {
    action: 'view' | 'add' | 'remove';
    onClose: () => void;
}

export const ApiKeyManager = ({ action, onClose }: ApiKeyManagerProps) => {
    const [config, setConfig] = useState<ConfigFormat | null>(null);
    const [currentStep, setCurrentStep] = useState<'loading' | 'main' | 'select' | 'input' | 'confirm'>('loading');
    const [selectedProvider, setSelectedProvider] = useState<string>('');
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

    const getApiKeysFromConfig = () => {
        if (!config) return [];
        return Object.entries(config)
            .filter(([key]) => key.endsWith('_API_KEY'))
            .map(([key, value]) => ({
                provider: key.replace('_API_KEY', '').toLowerCase(),
                keyName: key,
                value: (value as string) || ''
            }));
    };

    const getAvailableProviders = () => {
        const existingKeys = getApiKeysFromConfig();
        const knownProviders = ['anthropic', 'gemini', 'openai', 'deepseek'];
        
        // Always include known providers, plus any found in config
        const allProviders = [...new Set([
            ...knownProviders,
            ...existingKeys.map(k => k.provider)
        ])];
        
        return allProviders.sort();
    };

    const getProviderDisplayName = (provider: string) => {
        switch (provider.toLowerCase()) {
            case 'anthropic': return 'Anthropic (Claude)';
            case 'openai': return 'OpenAI (GPT)';
            case 'gemini': return 'Google (Gemini)';
            case 'deepseek': return 'DeepSeek';
            default: return provider.charAt(0).toUpperCase() + provider.slice(1);
        }
    };

    const getApiKeyName = (provider: string): keyof ConfigFormat => {
        return `${provider.toUpperCase()}_API_KEY` as keyof ConfigFormat;
    };

    useInput((inputStr, key) => {
        if (isSubmitting) return;

        if (key.escape) {
            if (currentStep === 'input' || currentStep === 'confirm' || currentStep === 'select') {
                setCurrentStep('main');
                setSelectedProvider('');
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
            const providers = getAvailableProviders();
            
            if (key.return && selectedProvider) {
                if (action === 'add') {
                    setCurrentStep('input');
                } else {
                    setCurrentStep('confirm');
                }
            } else if (key.upArrow || key.downArrow) {
                const currentIndex = providers.indexOf(selectedProvider);
                const nextIndex = (currentIndex + 1) % providers.length;
                setSelectedProvider(providers[nextIndex] || providers[0] || '');
            }
        } else if (currentStep === 'input') {
            if (key.return) {
                const apiKeyName = getApiKeyName(selectedProvider);
                setIsSubmitting(true);
                handleSaveConfig({ [apiKeyName]: inputValue.trim() }).then(() => {
                    setIsSubmitting(false);
                    setCurrentStep('main');
                    setInputValue('');
                    setSelectedProvider('');
                });
            } else if (key.backspace || key.delete) {
                setInputValue(prev => prev.slice(0, -1));
            } else if (!key.ctrl && !key.meta) {
                const cleanInput = inputStr.replace(/[\n\r]/g, '');
                if (!cleanInput) return;
                setInputValue(prev => prev + cleanInput);
            }
        } else if (currentStep === 'confirm') {
            if (key.return) {
                const apiKeyName = getApiKeyName(selectedProvider);
                setIsSubmitting(true);
                handleSaveConfig({ [apiKeyName]: undefined }).then(() => {
                    setIsSubmitting(false);
                    setCurrentStep('main');
                    setSelectedProvider('');
                });
            }
        }
    });

    if (currentStep === 'loading') {
        return (
            <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                <Text color="cyan" bold>Loading API key configuration...</Text>
            </Box>
        );
    }

    if (action === 'view') {
        const apiKeys = getApiKeysFromConfig();
        
        return (
            <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                <Box marginBottom={2}>
                    <Text color="cyan" bold>API Key Status</Text>
                </Box>
                
                {apiKeys.length === 0 ? (
                    <Box marginBottom={2}>
                        <Text color="gray">No API keys configured</Text>
                    </Box>
                ) : (
                    apiKeys.map(({ provider, keyName, value }) => (
                        <Box key={keyName} flexDirection="column" marginBottom={2}>
                            <Text color="blue" bold>{getProviderDisplayName(provider)} API Key:</Text>
                            <Text color="gray">{maskApiKey(value)}</Text>
                        </Box>
                    ))
                )}

                <Box marginTop={1}>
                    <Text color="dim">↵ Press Enter or Esc to close</Text>
                </Box>
            </Box>
        );
    }

    if (action === 'add') {
        if (currentStep === 'main') {
            const providers = getAvailableProviders();
            
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    
                    <Box marginBottom={2}>
                        <Text color="cyan" bold>Add API Key</Text>
                    </Box>
                    
                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="white">Select which API key to add:</Text>
                    </Box>

                    {providers.map((provider, index) => (
                        <Box key={provider} flexDirection="column" marginBottom={1}>
                            <Text color="yellow">{index + 1}. {getProviderDisplayName(provider)} API Key</Text>
                            <Text color="gray">   Current: {maskApiKey((config?.[getApiKeyName(provider)] as string) || '')}</Text>
                        </Box>
                    ))}

                    <Box marginTop={1}>
                        <Text color="dim">↵ Press Enter to continue • Esc to cancel</Text>
                    </Box>
                </Box>
            );
        }

        if (currentStep === 'select') {
            const providers = getAvailableProviders();
            
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    
                    <Box marginBottom={2}>
                        <Text color="cyan" bold>Select Provider</Text>
                    </Box>
                    
                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="white">Choose which API key to add:</Text>
                    </Box>

                    {providers.map((provider) => (
                        <Box key={provider} flexDirection="column" marginBottom={1}>
                            <Text 
                                color={selectedProvider === provider ? 'cyan' : 'gray'}
                                bold={selectedProvider === provider}
                            >
                                {selectedProvider === provider ? '› ' : '  '}{getProviderDisplayName(provider)} API Key
                            </Text>
                            <Text color="gray">   Current: {maskApiKey((config?.[getApiKeyName(provider)] as string) || '')}</Text>
                        </Box>
                    ))}

                    <Box marginTop={1}>
                        <Text color="dim">↑↓ select • ↵ confirm • Esc cancel</Text>
                    </Box>
                </Box>
            );
        }

        if (currentStep === 'input') {
            const providerName = getProviderDisplayName(selectedProvider);
            
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    
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
            const providers = getAvailableProviders();
            
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    
                    <Box marginBottom={2}>
                        <Text color="cyan" bold>Remove API Key</Text>
                    </Box>
                    
                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="white">Select which API key to remove:</Text>
                    </Box>

                    {providers.map((provider, index) => (
                        <Box key={provider} flexDirection="column" marginBottom={1}>
                            <Text color="yellow">{index + 1}. {getProviderDisplayName(provider)} API Key</Text>
                            <Text color="gray">   Current: {maskApiKey((config?.[getApiKeyName(provider)] as string) || '')}</Text>
                        </Box>
                    ))}

                    <Box marginTop={1}>
                        <Text color="dim">↵ Press Enter to continue • Esc to cancel</Text>
                    </Box>
                </Box>
            );
        }

        if (currentStep === 'select') {
            const providers = getAvailableProviders();
            
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    
                    <Box marginBottom={2}>
                        <Text color="cyan" bold>Select Provider</Text>
                    </Box>
                    
                    <Box flexDirection="column" marginBottom={2}>
                        <Text color="white">Choose which API key to remove:</Text>
                    </Box>

                    {providers.map((provider) => (
                        <Box key={provider} flexDirection="column" marginBottom={1}>
                            <Text 
                                color={selectedProvider === provider ? 'cyan' : 'gray'}
                                bold={selectedProvider === provider}
                            >
                                {selectedProvider === provider ? '› ' : '  '}{getProviderDisplayName(provider)} API Key
                            </Text>
                            <Text color="gray">   Current: {maskApiKey((config?.[getApiKeyName(provider)] as string) || '')}</Text>
                        </Box>
                    ))}

                    <Box marginTop={1}>
                        <Text color="dim">↑↓ select • ↵ confirm • Esc cancel</Text>
                    </Box>
                </Box>
            );
        }

        if (currentStep === 'confirm') {
            const providerName = getProviderDisplayName(selectedProvider);
            
            return (
                <Box flexDirection="column" alignItems="flex-start" paddingX={1} paddingY={1}>
                    
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