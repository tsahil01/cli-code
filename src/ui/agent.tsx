import React, { useState, useEffect, useRef } from 'react';
import { Header, ChatInput, ToolStatusDisplay } from "./components/index.js";
import { Command, SelectedFile, Message, ChatRequest, FunctionCall, Plan } from "../types.js";
import { MessageDisplay } from './components/message-display.js';
import { CommandModal } from './components/command-modal.js';
import { useInput } from 'ink';
import { systemCmds } from '../lib/systemCmds.js';
import { chat } from '../lib/chat.js';
import { readConfigFile, appendConfigFile } from '../lib/configMngt.js';
import { getAvailableModels } from '../lib/models.js';
import { useToolCall } from '../hooks/useToolCall.js';
import { useModelSelection } from '../hooks/useModelSelection.js';
import { usePlan } from '../hooks/usePlan.js';
import { PendingToolCallDialog } from './components/pending-tool-call-dialog.js';
import { PlanDialogWrapper } from './components/plan-dialog-wrapper.js';
import { ApiKeyPromptWrapper } from './components/api-key-prompt-wrapper.js';
import { useChat } from '../hooks/useChat.js';

export function Agent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeCommand, setActiveCommand] = useState<Command | null>(null);
    const [thinking, setThinking] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [showPlanDialog, setShowPlanDialog] = useState<boolean>(false);
    const onToolCallComplete = (msgs: Message[]) => {
        chat.handleSend(msgs);
    };

    const plan = usePlan();
    const model = useModelSelection({ setMessages });
    const toolCall = useToolCall({
        setMessages, setIsProcessing, onToolCallComplete
    });

    const chat = useChat({
        setMessages, setThinking, setContent, setIsProcessing, setCurrentToolCall: toolCall.setCurrentToolCall, modelData: model.modelData, plan: plan.plan, handleToolCall: toolCall.handleToolCall
    });

    const onSend = async (message: string, files: SelectedFile[]) => {
        if (message.startsWith("/")) {
            const commandName = message.slice(1);
            const command = systemCmds.find(cmd => cmd.name === commandName);
            if (command) {
                if (command.name === 'exit') {
                    process.exit(0);
                } else if (command.name === 'mode') {
                    setShowPlanDialog(true);
                } else {
                    setActiveCommand(command);
                }
                return;
            }
        }
        chat.handleNewMsgSend(message, files);
    };
    const activeCommandRef = useRef(activeCommand);
    const showPlanDialogRef = useRef(showPlanDialog);
    useEffect(() => { activeCommandRef.current = activeCommand; }, [activeCommand]);
    useEffect(() => { showPlanDialogRef.current = showPlanDialog; }, [showPlanDialog]);

    useEffect(() => {
        const loadConfigAndModels = async () => {
            try {
                const config = await readConfigFile();
                if (config.plan) {
                    plan.setPlan(config.plan);
                } else {
                    const defaultPlan: Plan = { mode: 'lite', addOns: [] };
                    plan.setPlan(defaultPlan);
                    await appendConfigFile({ plan: defaultPlan });
                }

                const availableModels = await getAvailableModels();
                if (config.selectedModel && availableModels.length > 0) {
                    const savedModel = availableModels.find(m =>
                        m.provider === config.selectedModel?.provider &&
                        m.modelName === config.selectedModel?.model &&
                        m.sdk === config.selectedModel.sdk
                    );
                    if (savedModel) {
                        model.setModelData({
                            provider: savedModel.provider,
                            model: savedModel.modelName,
                            sdk: savedModel.sdk,
                            modelCapabilities: savedModel
                        });
                    } else if (availableModels.length > 0) {
                        setMessages([{
                            content: "Welcome to CLI Code! Please select a model to get started.",
                            role: 'system',
                            ignoreInLLM: true
                        }]);
                        const modelCommand = systemCmds.find(cmd => cmd.name === 'model');
                        if (modelCommand) {
                            setActiveCommand(modelCommand);
                        }
                    }
                } else if (availableModels.length > 0) {
                    setMessages([{
                        content: "Welcome to CLI Code! Please select a model to get started.",
                        role: 'system',
                        ignoreInLLM: true
                    }]);
                    const modelCommand = systemCmds.find(cmd => cmd.name === 'model');
                    if (modelCommand) {
                        setActiveCommand(modelCommand);
                    }
                } else {
                    setMessages([{
                        content: "No models available. Please check your backend configuration.",
                        role: 'system',
                        ignoreInLLM: true
                    }]);
                }
            } catch (error) {
                setMessages([{
                    content: "Error loading configuration. Please try again.",
                    role: 'system',
                    ignoreInLLM: true
                }]);
            }
        };
        loadConfigAndModels();
    }, []);

    useInput((input, key) => {
        if (key.escape && activeCommandRef.current) {
            setActiveCommand(null);
        } else if (key.escape && showPlanDialogRef.current) {
            setShowPlanDialog(false);
        }
    });

    return (
        <>
            <Header />
            <MessageDisplay
                messages={messages}
                thinking={thinking}
                currentContent={content}
                isProcessing={isProcessing}
            />
            <PendingToolCallDialog
                pendingToolCall={toolCall.pendingToolCall}
                handleToolConfirmation={toolCall.handleToolConfirmation}
            />
            <ToolStatusDisplay toolCalls={toolCall.toolCallHistory} />
            <ChatInput
                onSend={onSend}
                commands={systemCmds}
                isProcessing={isProcessing}
                isDisabled={!!activeCommand || !!toolCall.pendingToolCall || showPlanDialog || model.showApiKeyPrompt}
                currentToolCall={toolCall.currentToolCall}
                currentModel={model.modelData}
                plan={plan.plan}
            />
            {activeCommand && (
                <CommandModal
                    command={activeCommand}
                    onClose={() => setActiveCommand(null)}
                    onModelSelect={model.handleModelSelect}
                    currentModel={model.modelData}
                />
            )}
            <PlanDialogWrapper
                plan={plan.plan}
                setPlan={plan.setPlan}
                showPlanDialog={showPlanDialog}
                setShowPlanDialog={setShowPlanDialog}
            />
            <ApiKeyPromptWrapper
                showApiKeyPrompt={model.showApiKeyPrompt}
                pendingModel={model.pendingModel}
                handleApiKeyPromptComplete={model.handleApiKeyPromptComplete}
                handleApiKeyPromptCancel={model.handleApiKeyPromptCancel}
            />
        </>
    );
}