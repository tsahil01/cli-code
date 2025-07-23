import React, { memo } from 'react';
import { Message, FunctionCall, ToolCallStatus, ModelData, Plan, SelectedFile } from '../../types.js';
import { MessageDisplay } from './message-display.js';
import { PendingToolCallDialog } from './pending-tool-call-dialog.js';
import { ToolStatusDisplay } from './index.js';
import { ChatInput } from './index.js';

interface ChatPanelProps {
    messages: Message[];
    thinking: string;
    currentContent: string;
    isProcessing: boolean;
    noMargin?: boolean;
    pendingToolCall: FunctionCall | null;
    handleToolConfirmation: any;
    toolCallHistory: ToolCallStatus[];
    onSend: (message: string, files: SelectedFile[]) => void;
    commands: any[];
    isDisabled: boolean;
    currentToolCall: FunctionCall | null;
    currentModel: ModelData | null;
    plan: Plan;
}

export const ChatPanel = memo(function ChatPanel({
    messages,
    thinking,
    currentContent,
    isProcessing,
    noMargin,
    pendingToolCall,
    handleToolConfirmation,
    toolCallHistory,
    onSend,
    commands,
    isDisabled,
    currentToolCall,
    currentModel,
    plan
}: ChatPanelProps) {
    return (
        <>
            <MessageDisplay
                messages={messages}
                thinking={thinking}
                currentContent={currentContent}
                isProcessing={isProcessing}
                noMargin={noMargin}
            />
            <PendingToolCallDialog
                pendingToolCall={pendingToolCall}
                handleToolConfirmation={handleToolConfirmation}
            />
            <ToolStatusDisplay toolCalls={toolCallHistory} />
            <ChatInput
                onSend={onSend}
                commands={commands}
                isProcessing={isProcessing}
                isDisabled={isDisabled}
                currentToolCall={currentToolCall}
                currentModel={currentModel}
                plan={plan}
            />
        </>
    );
}); 