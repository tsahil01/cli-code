#!/usr/bin/env node

import React, { useState, useEffect } from "react";
import { render, Box } from "ink";
import { Agent } from "./ui/agent.js";
import { readConfigFile, appendConfigFile } from "./lib/configMngt.js";
import { login } from "./lib/auth.js";
import { Initialization } from "./ui/components/initlization.js";
import { ConnectionFailureDialog, ApiKeySetup } from "./ui/components/index.js";
import { init, getConnectionStatus, setAllowWithoutConnection, retryConnection } from "./lib/editor.js";

function UI() {
    const [initializing, setInitializing] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loginError, setLoginError] = useState<string>();
    const [showConnectionDialog, setShowConnectionDialog] = useState(false);
    const [editorConnectionResolved, setEditorConnectionResolved] = useState(false);
    const [needsApiKeySetup, setNeedsApiKeySetup] = useState(false);
    const [apiKeySetupComplete, setApiKeySetupComplete] = useState(false);
    
    const initialize = async () => {
        setInitializing(true);
        setLoginError(undefined);
        const config = await readConfigFile();
        if (!config.refreshToken) {
            setLoggedIn(false);
            setLoginError(undefined);
        } else {
            try {
                const accessToken = await login(config.refreshToken);
                if (accessToken) {
                    setLoggedIn(true);
                    const hasApiKeys = config.ANTHROPIC_API_KEY || config.GEMINI_API_KEY;
                    if (!hasApiKeys) {
                        setNeedsApiKeySetup(true);
                    } else {
                        setApiKeySetupComplete(true);
                    }
                } else {
                    setLoggedIn(false);
                    setLoginError('Invalid token. Please try again.');
                }
            } catch (error) {
                setLoggedIn(false);
                setLoginError('Authentication failed. Please try again.');
            }
        }
        setInitializing(false);
    };

    const handleLogin = async (token: string) => {
        setInitializing(true);
        setLoginError(undefined);
        try {
            await appendConfigFile({ refreshToken: token });
            const accessToken = await login(token);
            if (accessToken) {
                setLoggedIn(true);
                setNeedsApiKeySetup(true);
            } else {
                setLoggedIn(false);
                setLoginError('Invalid token. Please try again.');
            }
        } catch (error) {
            setLoggedIn(false);
            setLoginError('Authentication failed. Please try again.');
        }
        setInitializing(false);
    };

    const handleApiKeySetup = async (apiKeys: { ANTHROPIC_API_KEY?: string; GEMINI_API_KEY?: string }) => {
        try {
            await appendConfigFile(apiKeys);
            setNeedsApiKeySetup(false);
            setApiKeySetupComplete(true);
        } catch (error) {
            console.error('Error saving API keys:', error);
        }
    };

    const checkEditorConnection = async () => {
        await init();
        const status = getConnectionStatus();
        if (status === 'failed' || status === 'disconnected') {
            setShowConnectionDialog(true);
        } else {
            setEditorConnectionResolved(true);
        }
    };

    const handleConnectionRetry = async () => {
        setShowConnectionDialog(false);
        try {
            await retryConnection();
            const status = getConnectionStatus();
            if (status === 'connected') {
                setEditorConnectionResolved(true);
            } else {
                setShowConnectionDialog(true);
            }
        } catch (error) {
            setShowConnectionDialog(true);
        }
    };

    const handleConnectionContinue = () => {
        setAllowWithoutConnection(true);
        setShowConnectionDialog(false);
        setEditorConnectionResolved(true);
    };

    useEffect(() => {
        initialize();
        checkEditorConnection();
    }, []);

    if (initializing || !loggedIn) {
        return (
            <Initialization 
                isLoading={initializing} 
                isLoggedIn={loggedIn} 
                onRetry={!initializing ? initialize : undefined}
                onLogin={handleLogin}
                loginError={loginError}
            />
        );
    }

    if (needsApiKeySetup) {
        return (
            <ApiKeySetup 
                onComplete={handleApiKeySetup}
            />
        );
    }

    if (showConnectionDialog) {
        return (
            <Box flexDirection="column" marginX={2} width={"80%"} alignSelf="center">
                <ConnectionFailureDialog 
                    onRetry={handleConnectionRetry}
                    onContinue={handleConnectionContinue}
                />
            </Box>
        );
    }

    if (!editorConnectionResolved) {
        return (
            <Box flexDirection="column" marginX={2} width={"80%"} alignSelf="center">
                <Initialization 
                    isLoading={true} 
                    isLoggedIn={true} 
                />
            </Box>
        );
    }

    if (!apiKeySetupComplete) {
        return (
            <Box flexDirection="column" marginX={2} width={"80%"} alignSelf="center">
                <Initialization 
                    isLoading={true} 
                    isLoggedIn={true} 
                />
            </Box>
        );
    }

    return (
        <Box flexDirection="column" marginX={2} width={"90%"} alignSelf="center">
            <Agent />
        </Box>
    )
}

render(<UI />);