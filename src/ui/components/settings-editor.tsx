import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { readConfigFile, writeConfigFile } from '../../lib/configMngt.js';

interface SettingsEditorProps {
    onClose: () => void;
}

export const SettingsEditor = ({ onClose }: SettingsEditorProps) => {
    const [jsonLines, setJsonLines] = useState<string[]>([]);
    const [cursorLine, setCursorLine] = useState(0);
    const [cursorColumn, setCursorColumn] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const config = await readConfigFile();
            const formattedJson = JSON.stringify(config, null, 2);
            setJsonLines(formattedJson.split('\n'));
            setIsLoading(false);
        } catch (err) {
            setError('Failed to load configuration');
            setIsLoading(false);
        }
    };

    const saveConfig = async () => {
        try {
            const jsonString = jsonLines.join('\n');
            const parsedConfig = JSON.parse(jsonString);
            await writeConfigFile(parsedConfig);
            setError(null);
            setHasChanges(false);
            setMode('view');
        } catch (err) {
            setError('Invalid JSON format. Please check your syntax.');
        }
    };

    const resetChanges = async () => {
        await loadConfig();
        setHasChanges(false);
        setMode('view');
        setError(null);
    };

    useInput((input, key) => {
        if (key.escape) {
            if (mode === 'edit') {
                if (hasChanges) {
                    // Show confirmation or reset
                    resetChanges();
                } else {
                    setMode('view');
                }
            } else {
                onClose();
            }
            return;
        }

        if (mode === 'view') {
            if (key.return || input === 'e' || input === 'E') {
                setMode('edit');
                return;
            }
            if (input === 'q' || input === 'Q') {
                onClose();
                return;
            }
            if (input === 'r' || input === 'R') {
                loadConfig();
                return;
            }
        }

        if (mode === 'edit') {
            if (key.ctrl && (input === 's' || input === 'S')) {
                saveConfig();
                return;
            }

            // Navigation
            if (key.upArrow && cursorLine > 0) {
                setCursorLine(prev => prev - 1);
                setCursorColumn(Math.min(cursorColumn, jsonLines[cursorLine - 1]?.length || 0));
                return;
            }
            if (key.downArrow && cursorLine < jsonLines.length - 1) {
                setCursorLine(prev => prev + 1);
                setCursorColumn(Math.min(cursorColumn, jsonLines[cursorLine + 1]?.length || 0));
                return;
            }
            if (key.leftArrow && cursorColumn > 0) {
                setCursorColumn(prev => prev - 1);
                return;
            }
            if (key.rightArrow && cursorColumn < (jsonLines[cursorLine]?.length || 0)) {
                setCursorColumn(prev => prev + 1);
                return;
            }

            // Text editing - Handle backspace/delete
            if (key.backspace || key.delete) {
                if (cursorColumn > 0) {
                    const newLines = [...jsonLines];
                    const currentLine = newLines[cursorLine] || '';
                    newLines[cursorLine] = currentLine.slice(0, cursorColumn - 1) + currentLine.slice(cursorColumn);
                    setJsonLines(newLines);
                    setCursorColumn(prev => prev - 1);
                    setHasChanges(true);
                    setError(null); // Clear any validation errors
                } else if (cursorLine > 0) {
                    // Join with previous line
                    const newLines = [...jsonLines];
                    const currentLine = newLines[cursorLine] || '';
                    const prevLine = newLines[cursorLine - 1] || '';
                    newLines[cursorLine - 1] = prevLine + currentLine;
                    newLines.splice(cursorLine, 1);
                    setJsonLines(newLines);
                    setCursorLine(prev => prev - 1);
                    setCursorColumn(prevLine.length);
                    setHasChanges(true);
                    setError(null); // Clear any validation errors
                }
                return;
            }

            if (key.return) {
                const newLines = [...jsonLines];
                const currentLine = newLines[cursorLine] || '';
                const beforeCursor = currentLine.slice(0, cursorColumn);
                const afterCursor = currentLine.slice(cursorColumn);
                newLines[cursorLine] = beforeCursor;
                newLines.splice(cursorLine + 1, 0, afterCursor);
                setJsonLines(newLines);
                setCursorLine(prev => prev + 1);
                setCursorColumn(0);
                setHasChanges(true);
                setError(null); // Clear any validation errors
                return;
            }

            // Handle regular character input
            if (input && input.length === 1 && !key.ctrl && !key.meta) {
                const newLines = [...jsonLines];
                const currentLine = newLines[cursorLine] || '';
                newLines[cursorLine] = currentLine.slice(0, cursorColumn) + input + currentLine.slice(cursorColumn);
                setJsonLines(newLines);
                setCursorColumn(prev => prev + 1);
                setHasChanges(true);
                setError(null); // Clear any validation errors
                return;
            }
        }
    });

    if (isLoading) {
        return (
            <Box flexDirection="column" alignItems="center" justifyContent="center" height={10}>
                <Text color="cyan">Loading configuration...</Text>
            </Box>
        );
    }

    const renderJsonEditor = () => {
        const visibleLines = 20; // Show 20 lines at a time
        const startLine = Math.max(0, Math.min(cursorLine - Math.floor(visibleLines / 2), jsonLines.length - visibleLines));
        const endLine = Math.min(jsonLines.length, startLine + visibleLines);

        return (
            <Box flexDirection="column">
                {jsonLines.slice(startLine, endLine).map((line, index) => {
                    const actualLineIndex = startLine + index;
                    const isCurrentLine = actualLineIndex === cursorLine && mode === 'edit';
                    
                    return (
                        <Box key={actualLineIndex}>
                            <Text color="gray" dimColor>
                                {String(actualLineIndex + 1).padStart(3, ' ')} │ 
                            </Text>
                            <Text color={isCurrentLine ? "white" : "gray"}>
                                {isCurrentLine && mode === 'edit' ? (
                                    <>
                                        {line.slice(0, cursorColumn)}
                                        <Text backgroundColor="white" color="black">
                                            {line[cursorColumn] || ' '}
                                        </Text>
                                        {line.slice(cursorColumn + 1)}
                                    </>
                                ) : (
                                    line
                                )}
                            </Text>
                        </Box>
                    );
                })}
            </Box>
        );
    };

    return (
        <Box flexDirection="column" width="100%" height={30}>
            <Box
                flexDirection="column"
                borderStyle="double"
                borderColor="cyan"
                paddingX={1}
                paddingY={1}
                width="100%"
                height="100%"
            >
                <Box justifyContent="space-between" marginBottom={1}>
                    <Text color="cyan" bold>
                        ⚙️  Configuration Editor {hasChanges ? '(Modified)' : ''}
                    </Text>
                    <Text color="gray">
                        Mode: <Text color={mode === 'edit' ? 'yellow' : 'green'}>{mode.toUpperCase()}</Text>
                    </Text>
                </Box>

                <Box flexGrow={1} flexDirection="column">
                    {renderJsonEditor()}
                </Box>

                {error && (
                    <Box marginTop={1}>
                        <Text color="red">❌ {error}</Text>
                    </Box>
                )}

                <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
                    {mode === 'view' ? (
                        <Box flexDirection="column">
                            <Text color="gray" bold>View Mode Controls:</Text>
                            <Text color="gray">E/Enter → Edit mode  •  R → Reload  •  Q/Esc → Quit</Text>
                        </Box>
                    ) : (
                        <Box flexDirection="column">
                            <Text color="yellow" bold>Edit Mode Controls:</Text>
                            <Text color="gray">Ctrl+S → Save  •  Esc → Cancel/View mode  •  ↑↓←→ → Navigate</Text>
                            <Text color="gray">Type to edit  •  Enter → New line  •  Backspace → Delete</Text>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}; 