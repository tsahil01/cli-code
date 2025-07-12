import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ModelCapabilities } from '../../types.js';
import { getAvailableModels } from '../../lib/models.js';

interface ModelSelectorProps {
    onSelect: (model: ModelCapabilities) => void;
    onClose: () => void;
    currentModel?: { provider: string; model: string };
}

export const ModelSelector = ({ onSelect, onClose, currentModel }: ModelSelectorProps) => {
    const [availableModels, setAvailableModels] = useState<ModelCapabilities[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const models = await getAvailableModels();
            setAvailableModels(models);
            
            if (models.length === 0) {
                setError('No models available. Please check your API keys in settings.');
            } else {
                if (currentModel) {
                    const currentIndex = models.findIndex(m => 
                        m.provider === currentModel.provider && 
                        m.modelName === currentModel.model
                    );
                    if (currentIndex >= 0) {
                        setSelectedIndex(currentIndex);
                    }
                }
            }
        } catch (err) {
            setError('Failed to load models. Please try again.');
            console.error('Error loading models:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useInput((input, key) => {
        if (isLoading) return;

        if (key.escape) {
            onClose();
            return;
        }

        if (key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        }

        if (key.downArrow) {
            setSelectedIndex(prev => Math.min(availableModels.length - 1, prev + 1));
        }

        if (key.return && availableModels.length > 0) {
            onSelect(availableModels[selectedIndex]);
            onClose();
        }

        if (key.ctrl && input === 'r') {
            loadModels();
        }
    });

    if (isLoading) {
        return (
            <Box flexDirection="column" alignSelf='flex-start'>
                <Box
                    flexDirection="column"
                    borderStyle="round"
                    borderColor="gray"
                    margin={1}
                    paddingX={2}
                    paddingY={1}
                >
                    <Text bold color="yellow">/model</Text>
                    <Text color="cyan">🔄 Loading available models...</Text>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box flexDirection="column" alignSelf='flex-start'>
                <Box
                    flexDirection="column"
                    borderStyle="round"
                    borderColor="red"
                    margin={1}
                    paddingX={2}
                    paddingY={1}
                >
                    <Text bold color="yellow">/model</Text>
                    <Text color="red">❌ {error}</Text>
                    <Text color="dim">Ctrl+R to retry • Esc to cancel</Text>
                </Box>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" alignSelf='flex-start'>
            <Box
                flexDirection="column"
                borderStyle="round"
                borderColor="gray"
                margin={1}
                paddingX={2}
                paddingY={1}
            >
                <Text bold color="yellow">/model</Text>
                <Box marginBottom={1}>
                    <Text color="gray">Select a model to use:</Text>
                </Box>
                
                {availableModels.map((model, index) => {
                    const isSelected = index === selectedIndex;
                    const isCurrent = currentModel && 
                        model.provider === currentModel.provider && 
                        model.modelName === currentModel.model;
                    
                    return (
                        <Box key={`${model.provider}-${model.modelName}`} marginBottom={0}>
                            <Text color={isSelected ? "cyan" : "white"}>
                                {isSelected ? "► " : "  "}
                                {isCurrent ? "● " : "○ "}
                                <Text color={isSelected ? "cyan" : "white"} bold={isSelected}>
                                    {model.displayName}
                                </Text>
                            </Text>
                            {isSelected && (
                                <Box marginLeft={6} flexDirection="column">
                                    <Text color="dim">
                                        Provider: {model.provider}
                                    </Text>
                                    <Text color="dim">
                                        Context: {model.maxInputTokens.toLocaleString()} tokens
                                    </Text>
                                    <Text color="dim">
                                        Output: {model.maxOutputTokens.toLocaleString()} tokens
                                    </Text>
                                    {model.thinking && (
                                        <Text color="dim">
                                            Thinking: {model.minThinkingTokens?.toLocaleString() || 0}-{model.maxThinkingTokens?.toLocaleString() || 0} tokens
                                        </Text>
                                    )}
                                </Box>
                            )}
                        </Box>
                    );
                })}
                
                <Box marginTop={1}>
                    <Text color="dim">↑↓ navigate • Enter select • Esc cancel</Text>
                    {availableModels.length > 0 && (
                        <Text color="dim"> • Ctrl+R refresh</Text>
                    )}
                </Box>
            </Box>
        </Box>
    );
}; 