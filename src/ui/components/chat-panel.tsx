import React, { memo } from 'react';
import { Message, FunctionCall, ToolCallStatus, ModelData, Plan, SelectedFile } from '../../types.js';
import { MessageDisplay, MessageHistory, StreamingLine } from './message-display.js';
import { PendingToolCallDialog } from './pending-tool-call-dialog.js';
import { ToolStatusDisplay } from './index.js';
import { ChatInput } from './index.js';
import { useUsage } from '../../hooks/useUsage.js';

interface ChatPanelProps {
    messages: Message[];
    thinking: string;
    currentContent: string;
    isProcessing: boolean;
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

    const usage = useUsage();

    return (
        <>
            <MessageDisplay
                messages={messages}
                thinking={thinking}
                currentContent={currentContent}
                isProcessing={isProcessing}
                usage={usage}   
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
                usage={usage}
            />
        </>
    );
}); 