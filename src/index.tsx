#!/usr/bin/env node

import React, { useState, useEffect } from "react";
import { render, Box } from "ink";
import { Agent } from "./ui/agent.js";
import { readConfigFile, appendConfigFile } from "./lib/configMngt.js";
import { login } from "./lib/auth.js";
import { Initialization } from "./ui/components/initlization.js";
import { ConnectionFailureDialog } from "./ui/components/index.js";
import { init, getConnectionStatus, setAllowWithoutConnection, retryConnection } from "./lib/editor.js";

function UI() {
    const [initializing, setInitializing] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loginError, setLoginError] = useState<string>();
    const [showConnectionDialog, setShowConnectionDialog] = useState(false);
    const [editorConnectionResolved, setEditorConnectionResolved] = useState(false);
    
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

    return (
        <Box flexDirection="column" marginX={2} width={"90%"} alignSelf="center">
            <Agent />
        </Box>
    )
}

render(<UI />);