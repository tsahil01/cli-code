import React, { useState, useEffect } from "react";
import { render, Box } from "ink";
import { Agent } from "./ui/agent.js";
import { readConfigFile, appendConfigFile } from "./lib/configMngt.js";
import { login } from "./lib/auth.js";
import { Initialization } from "./ui/components/initlization.js";

function UI() {
    const [initializing, setInitializing] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loginError, setLoginError] = useState<string>();
    
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
                console.error("Login failed:", error);
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
            console.log("Saving new token...");
            await appendConfigFile({ refreshToken: token });
            console.log("Attempting login with new token...");
            const accessToken = await login(token);
            console.log("Login result:", !!accessToken);
            if (accessToken) {
                setLoggedIn(true);
            } else {
                setLoggedIn(false);
                setLoginError('Invalid token. Please try again.');
            }
        } catch (error) {
            console.error("Login failed:", error);
            setLoggedIn(false);
            setLoginError('Authentication failed. Please try again.');
        }
        setInitializing(false);
    };

    useEffect(() => {
        initialize();
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

    return (
        <Box flexDirection="column">
            <Agent />
        </Box>
    )
}

render(<UI />);