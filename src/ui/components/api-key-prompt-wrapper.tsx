import React from 'react';
import { ApiKeyPrompt } from './api-key-prompt.js';
import { ModelCapabilities } from '../../types.js';

type Props = {
    showApiKeyPrompt: boolean;
    pendingModel: ModelCapabilities | null;
    handleApiKeyPromptComplete: (success: boolean) => void | Promise<void>;
    handleApiKeyPromptCancel: () => void | Promise<void>;
};

export function ApiKeyPromptWrapper({ showApiKeyPrompt, pendingModel, handleApiKeyPromptComplete, handleApiKeyPromptCancel }: Props) {
    if (!showApiKeyPrompt || !pendingModel) return null;
    return (
        <ApiKeyPrompt
            model={pendingModel}
            onComplete={handleApiKeyPromptComplete}
            onCancel={handleApiKeyPromptCancel}
        />
    );
} 