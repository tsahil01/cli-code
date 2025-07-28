import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import { Session } from '../../types.js';
import { listSessions } from '../../lib/sessions.js';

interface SessionDialogProps {
    onSelect: (session: Session) => void;
    onCancel: () => void;
}

export const SessionDialog = ({ onSelect, onCancel }: SessionDialogProps) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const sessionList = await listSessions();
                setSessions(sessionList);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load sessions');
                setLoading(false);
            }
        };
        loadSessions();
    }, []);

    useInput((input, key) => {
        if (key.escape) {
            onCancel();
        } else if (key.return && sessions.length > 0) {
            onSelect(sessions[selectedIndex]);
        } else if (key.upArrow) {
            setSelectedIndex(prev => prev > 0 ? prev - 1 : sessions.length - 1);
        } else if (key.downArrow) {
            setSelectedIndex(prev => prev < sessions.length - 1 ? prev + 1 : 0);
        }
    });

    if (loading) {
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="blue" padding={1}>
                <Text color="blue">Loading sessions...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="red" padding={1}>
                <Text color="red">Error: {error}</Text>
                <Text color="gray">Press ESC to cancel</Text>
            </Box>
        );
    }

    if (sessions.length === 0) {
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={1}>
                <Text color="yellow">No sessions found</Text>
                <Text color="gray">Sessions are automatically saved after each message</Text>
                <Text color="gray">Press ESC to cancel</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="blue" padding={1}>
            <Text color="blue" bold>Select a Session</Text>
            <Text color="gray">Use ↑↓ to navigate, Enter to select, ESC to cancel</Text>
            <Box flexDirection="column" marginTop={1}>
                {sessions.map((session, index) => (
                    <Box key={session.date} flexDirection="row">
                        <Text color={index === selectedIndex ? "green" : "white"}>
                            {index === selectedIndex ? "⤷ " : "  "}
                        </Text>
                        <Text color={index === selectedIndex ? "green" : "white"}>
                            {session.date}
                        </Text>
                        <Text color="gray">
                            {"  "}{session.messages.length} messages
                        </Text>
                        <Text color="gray">
                            {"  "}{session.directory}
                        </Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}; 