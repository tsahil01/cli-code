import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header } from "./components/index.js";
import { Command, SelectedFile, Message, Plan, Session } from "../types.js";
import { CommandModal } from './components/command-modal.js';
import { useInput, Box } from 'ink';
import { systemCmds } from '../lib/systemCmds.js';
import { readConfigFile, appendConfigFile } from '../lib/configMngt.js';
import { getAvailableModels } from '../lib/models.js';
import { useToolCall } from '../hooks/useToolCall.js';
import { useModelSelection } from '../hooks/useModelSelection.js';
import { usePlan } from '../hooks/usePlan.js';
import { PlanDialogWrapper } from './components/plan-dialog-wrapper.js';
import { ApiKeyPromptWrapper } from './components/api-key-prompt-wrapper.js';
import { useChat } from '../hooks/useChat.js';
import { ChatPanel } from './components/chat-panel.js';
import process from 'process';
import { SessionDialog } from './components/session-dialog.js';

export function Agent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeCommand, setActiveCommand] = useState<Command | null>(null);
    const [thinking, setThinking] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [showPlanDialog, setShowPlanDialog] = useState<boolean>(false);
    const [showSessionDialog, setShowSessionDialog] = useState<boolean>(false);
    const onToolCallComplete = (msgs: Message[]) => {
        chat.handleSend(msgs);
    };

    const plan = usePlan();
    const model = useModelSelection({ setMessages });
    const toolCall = useToolCall({
        setMessages, setIsProcessing, onToolCallComplete
    });

    const chat = useChat({
        setMessages, setThinking, setContent, setIsProcessing, setCurrentToolCall: toolCall.setCurrentToolCall, modelData: model.modelData, plan: plan.plan, handleToolCall: toolCall.handleToolCall, currentDirectory: process.cwd()
    });

    const handleCommandModalClose = useCallback(() => setActiveCommand(null), []);
    const handlePlanDialogClose = useCallback(() => setShowPlanDialog(false), []);
    const handleSessionDialogClose = useCallback(() => setShowSessionDialog(false), []);
    const handleSessionSelect = useCallback((session: Session) => {
        const currentDir = process.cwd();
        setMessages(session.messages);
        if (session.directory != currentDir) {
            setMessages(prev => [...prev, {
                content: `⚠️  Warning: Session was created in a different directory\nSession directory: ${session.directory}\nCurrent directory: ${currentDir}\n\nLoading session anyway...`,
                role: 'system',
                ignoreInLLM: true,
            }]);
        } else {
            setMessages(prev => [...prev, {
                content: `Session loaded: ${session.date} (${session.messages.length} messages from ${session.directory})`,
                role: 'system',
                ignoreInLLM: true
            }]);
        }
        setShowSessionDialog(false);
    }, []);
    const handlePlanSave = useCallback(async (newPlan: Plan) => {
        plan.setPlan(newPlan);
        await appendConfigFile({ plan: newPlan });
        setShowPlanDialog(false);
    }, [plan]);
    const handleApiKeyPromptComplete = useCallback(model.handleApiKeyPromptComplete, [model]);
    const handleApiKeyPromptCancel = useCallback(model.handleApiKeyPromptCancel, [model]);
    const handleModelSelect = useCallback(model.handleModelSelect, [model]);
    const onSend = useCallback(async (message: string, files: SelectedFile[]) => {
        if (message.startsWith("/")) {
            const commandName = message.slice(1);
            const command = systemCmds.find(cmd => cmd.name === commandName);
            

            
            if (command) {
                if (command.name === 'exit') {
                    process.exit(0);
                } else if (command.name === 'mode') {
                    setShowPlanDialog(true);
                } else if (command.name === 'new') {
                    chat.startNewSession();
                    setMessages([]);
                    setMessages(prev => [...prev, {
                        content: "Started a new session.",
                        role: 'system',
                        ignoreInLLM: true
                    }]);
                } else if (command.name === 'sessions') {
                    setShowSessionDialog(true);
                } else {
                    setActiveCommand(command);
                }
                return;
            }
        }
        chat.handleNewMsgSend(message, files);
    }, [chat]);
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
        } else if (key.escape && showSessionDialog) {
            setShowSessionDialog(false);
        } else if (key.escape && isProcessing) {
            chat.stopChat();
            setMessages(prev => {
                if (prev.length === 0) return prev;
                return prev.slice(0, prev.length);
            });
        }
    });

    return (
        <>
            <Box flexDirection="column" width="100%" height="100%">
                <Header />
                <Box flexDirection="column" gap={1} width="100%" flexGrow={1} minHeight={0}>
                    <ChatPanel
                        messages={messages}
                        thinking={thinking}
                        currentContent={content}
                        isProcessing={isProcessing}
                        pendingToolCall={toolCall.pendingToolCall}
                        handleToolConfirmation={toolCall.handleToolConfirmation}
                        toolCallHistory={toolCall.toolCallHistory}
                        onSend={onSend}
                        commands={systemCmds}
                        isDisabled={!!activeCommand || !!toolCall.pendingToolCall || showPlanDialog || model.showApiKeyPrompt}
                        currentToolCall={toolCall.currentToolCall}
                        currentModel={model.modelData}
                        plan={plan.plan}
                    />
                    {activeCommand && (
                        <CommandModal
                            command={activeCommand}
                            onClose={handleCommandModalClose}
                            onModelSelect={handleModelSelect}
                            currentModel={model.modelData}
                        />
                    )}
                    <PlanDialogWrapper
                        plan={plan.plan}
                        setPlan={plan.setPlan}
                        showPlanDialog={showPlanDialog}
                        setShowPlanDialog={setShowPlanDialog}
                    />
                    {showSessionDialog && (
                        <SessionDialog
                            onSelect={handleSessionSelect}
                            onCancel={handleSessionDialogClose}
                        />
                    )}
                    <ApiKeyPromptWrapper
                        showApiKeyPrompt={model.showApiKeyPrompt}
                        pendingModel={model.pendingModel}
                        handleApiKeyPromptComplete={handleApiKeyPromptComplete}
                        handleApiKeyPromptCancel={handleApiKeyPromptCancel}
                    />
                </Box>
            </Box>
        </>
    );
}