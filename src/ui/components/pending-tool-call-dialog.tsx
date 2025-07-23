import React from 'react';
import { ToolConfirmationDialog } from './tool-confirmation-dialog.js';
import { FunctionCall } from '../../types.js';

type Props = {
    pendingToolCall: FunctionCall | null;
    handleToolConfirmation: {
        accept: () => void | Promise<void>;
        acceptAll: () => void | Promise<void>;
        reject: () => void | Promise<void>;
    };
};

export function PendingToolCallDialog({ pendingToolCall, handleToolConfirmation }: Props) {
    if (!pendingToolCall) return null;
    return (
        <ToolConfirmationDialog
            toolCall={pendingToolCall}
            onAccept={handleToolConfirmation.accept}
            onAcceptAll={handleToolConfirmation.acceptAll}
            onReject={handleToolConfirmation.reject}
        />
    );
} 