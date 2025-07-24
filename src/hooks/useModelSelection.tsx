import { useState } from 'react';
import { ModelData, ModelCapabilities, ConfigFormat, Message } from '../types.js';
import { appendConfigFile, readConfigFile } from '../lib/configMngt.js';

export function useModelSelection({ setMessages }: {
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}) {
    const [modelData, setModelData] = useState<ModelData | null>(null);
    const [showApiKeyPrompt, setShowApiKeyPrompt] = useState<boolean>(false);
    const [pendingModel, setPendingModel] = useState<ModelCapabilities | null>(null);

    const setModelAndSave = async (model: ModelCapabilities) => {
        setModelData({
            provider: model.provider,
            model: model.modelName,
            sdk: model.sdk,
            modelCapabilities: model
        });
        try {
            await appendConfigFile({
                selectedModel: {
                    provider: model.provider,
                    model: model.modelName,
                    sdk: model.sdk
                }
            });
        } catch (error) {
            console.error('Error saving selected model:', error);
        }
        setMessages(prev => [...prev, {
            content: `Model changed to ${model.displayName} (${model.provider})`,
            role: 'system',
            ignoreInLLM: true
        }]);
    };

    const handleModelSelect = async (model: ModelCapabilities) => {
        try {
            const config = await readConfigFile();
            const apiKey = config[model.apiKeyName as keyof ConfigFormat];
            if (!apiKey) {
                setPendingModel(model);
                setShowApiKeyPrompt(true);
                return;
            }
            await setModelAndSave(model);
        } catch (error) {
            console.error('Error checking API key:', error);
            await setModelAndSave(model);
        }
    };

    const handleApiKeyPromptComplete = async (success: boolean) => {
        setShowApiKeyPrompt(false);
        if (success && pendingModel) {
            await setModelAndSave(pendingModel);
        }
        setPendingModel(null);
    };

    const handleApiKeyPromptCancel = () => {
        setShowApiKeyPrompt(false);
        setPendingModel(null);
    };

    return {
        modelData,
        setModelData,
        showApiKeyPrompt,
        setShowApiKeyPrompt,
        pendingModel,
        setPendingModel,
        handleModelSelect,
        handleApiKeyPromptComplete,
        handleApiKeyPromptCancel,
    };
} 