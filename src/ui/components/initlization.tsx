import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Login } from './login.js';

interface InitializationProps {
    isLoading: boolean;
    isLoggedIn: boolean;
    onRetry?: () => void;
    onLogin?: (token: string) => void;
    loginError?: string;
}

const Loader = () => {
    const [frame, setFrame] = useState(0);
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    
    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(prev => (prev + 1) % frames.length);
        }, 80);
        return () => clearInterval(interval);
    }, []);
    
    return <Text color="cyan">{frames[frame]}</Text>;
};

export const Initialization = ({ isLoading, isLoggedIn, onLogin, loginError }: InitializationProps) => {
    if (isLoading) {
        return (
            <Box>
                <Loader />
                <Text color="gray" dimColor> Initializing CLI Code...</Text>
            </Box>
        );
    }

    if (!isLoggedIn && onLogin) {
        return <Login onLogin={onLogin} loginError={loginError} />;
    }

    return null;
};
