import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Command, CommandOption } from '../../types';
import { SettingsEditor } from './settings-editor.js';

interface CommandModalProps {
    command: Command;
    onClose: () => void;
}

interface OptionState {
    [key: string]: any;
}

export const CommandModal = ({ command, onClose }: CommandModalProps) => {
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
    const [optionValues, setOptionValues] = useState<OptionState>({});
    const [isConfirming, setIsConfirming] = useState(false);
    const [showSettingsEditor, setShowSettingsEditor] = useState(false);

    const handleCommandExecute = async (command: Command, options: Record<string, any>) => {
        switch (command.name) {
            case 'model':
                break;
            case 'sessions':
                break;
            case 'new':
                break;
            case 'settings':
                setShowSettingsEditor(true);
                break;
        }
    };

    const selectableOptions = command.options.filter(opt => opt.type === 'select' && opt.choices);
    const currentOption = selectableOptions[selectedOptionIndex];

    useInput((input, key) => {
        if (showSettingsEditor) {
            // Settings editor handles its own input
            return;
        }

        if (key.escape) {
            if (isConfirming) {
                setIsConfirming(false);
            } else {
                onClose();
            }
            return;
        }

        if (currentOption?.type === 'select' && currentOption.choices) {
            if (key.upArrow) {
                const currentValue = optionValues[currentOption.name] || currentOption.choices[0];
                const currentIndex = currentOption.choices.indexOf(currentValue);
                const newValue = currentOption.choices[Math.max(0, currentIndex - 1)];
                setOptionValues({ ...optionValues, [currentOption.name]: newValue });
            }
            if (key.downArrow) {
                const currentValue = optionValues[currentOption.name] || currentOption.choices[0];
                const currentIndex = currentOption.choices.indexOf(currentValue);
                const newValue = currentOption.choices[Math.min(currentOption.choices.length - 1, currentIndex + 1)];
                setOptionValues({ ...optionValues, [currentOption.name]: newValue });
            }
        }

        if (key.tab) {
            setSelectedOptionIndex((prev) =>
                (prev + 1) % selectableOptions.length
            );
        }

        if (key.return) {
            if (isConfirming) {
                handleCommandExecute(command, optionValues);
                onClose();
            } else if (command.name === 'new') {
                setIsConfirming(true);
            } else if (command.name === 'settings') {
                handleCommandExecute(command, optionValues);
            } else if (handleCommandExecute) {
                handleCommandExecute(command, optionValues);
                onClose();
            }
        }
    });

    if (showSettingsEditor) {
        return (
            <SettingsEditor 
                onClose={() => {
                    setShowSettingsEditor(false);
                    onClose();
                }} 
            />
        );
    }

    const renderOption = (option: CommandOption) => {
        if (option.type === 'select' && option.choices) {
            const currentValue = optionValues[option.name] || option.choices[0];
            const isSelected = selectableOptions[selectedOptionIndex].name === option.name;

            return (
                <Box key={option.name} flexDirection="column">
                    <Text color={isSelected ? "yellow" : "white"}>
                        {option.name}
                    </Text>
                    <Box marginLeft={1} flexDirection="column">
                        {option.choices.map((choice) => (
                            <Text key={choice} color={choice === currentValue ? "green" : "gray"}>
                                {choice === currentValue ? "● " : "○ "}{choice}
                            </Text>
                        ))}
                    </Box>
                </Box>
            );
        }
        return null;
    };

    const renderCommandContent = () => {
        switch (command.name) {
            case 'help':
                return (
                    <Box flexDirection="column">
                        <Text>/help - Show help</Text>
                        <Text>/sessions - Manage sessions</Text>
                        <Text>/new - New session</Text>
                        <Text>/model - Switch model</Text>
                        <Text>/settings - Edit configuration file</Text>
                        <Text>/exit - Exit app</Text>
                    </Box>
                );

            case 'sessions':
                return (
                    <Box flexDirection="column">
                        {command.options.map(renderOption)}
                        <Text dimColor>↑↓ select • tab switch • enter confirm</Text>
                    </Box>
                );

            case 'model':
                return (
                    <Box flexDirection="column">
                        {command.options.map(renderOption)}
                        <Text dimColor>↑↓ select • enter confirm</Text>
                    </Box>
                );

            case 'settings':
                return (
                    <Box flexDirection="column">
                        <Text color="cyan">Open JSON Configuration Editor</Text>
                        <Text color="gray">Edit your configuration file directly as JSON</Text>
                        <Text dimColor>enter open editor • esc cancel</Text>
                    </Box>
                );

            case 'new':
                return (
                    <Box flexDirection="column">
                        {isConfirming ? (
                            <>
                                <Text color="red">Clear chat history?</Text>
                                <Text dimColor>enter confirm • esc cancel</Text>
                            </>
                        ) : (
                            <>
                                <Text>Start new session</Text>
                                <Text dimColor>enter continue • esc cancel</Text>
                            </>
                        )}
                    </Box>
                );

            default:
                return (
                    <Box>
                        <Text>Unknown: /{command.name}</Text>
                    </Box>
                );
        }
    };

    return (
        <Box flexDirection="column" alignSelf='flex-start'>
            <Box
                flexDirection="column"
                borderStyle="round"
                borderColor="gray"
                margin={1}
            >
                <Text bold color="yellow">/{command.name}</Text>
                {renderCommandContent()}
            </Box>
        </Box>
    );
}; 