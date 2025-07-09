import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Plan } from '../../types.js';

interface PlanDialogProps {
    currentPlan: Plan;
    onSave: (newPlan: Plan) => void;
    onCancel: () => void;
}

export function PlanDialog({ currentPlan, onSave, onCancel }: PlanDialogProps) {
    const [selectedMode, setSelectedMode] = useState<'lite' | 'full'>(currentPlan.mode);
    const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set(currentPlan.addOns));
    const [focusIndex, setFocusIndex] = useState(0);

    const modes = ['lite', 'full'];
    const addOns = ['memory', 'github', 'advanced-context'];

    const totalItems = modes.length + (selectedMode === 'lite' ? addOns.length : 0) + 2;

    useInput((input, key) => {
        if (key.escape) {
            onCancel();
            return;
        }

        if (key.upArrow) {
            setFocusIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setFocusIndex(prev => Math.min(totalItems - 1, prev + 1));
        } else if (key.return) {
            if (focusIndex < modes.length) {
                const newMode = modes[focusIndex] as 'lite' | 'full';
                setSelectedMode(newMode);
                if (newMode === 'full') {
                    setSelectedAddOns(new Set());
                }
            } else if (selectedMode === 'lite' && focusIndex < modes.length + addOns.length) {
                const addOnIndex = focusIndex - modes.length;
                const addOn = addOns[addOnIndex];
                setSelectedAddOns(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(addOn)) {
                        newSet.delete(addOn);
                    } else {
                        newSet.add(addOn);
                    }
                    return newSet;
                });
            } else {
                const buttonIndex = focusIndex - modes.length - (selectedMode === 'lite' ? addOns.length : 0);
                if (buttonIndex === 0) {
                    const newPlan: Plan = {
                        mode: selectedMode,
                        addOns: selectedMode === 'lite'
                            ? Array.from(selectedAddOns) as ('memory' | 'github' | 'advanced-context')[]
                            : []
                    };
                    onSave(newPlan);
                } else if (buttonIndex === 1) {
                    onCancel();
                }
            }
        }
    });

    return (
        <Box flexDirection="column" borderStyle="single" padding={1}>
            <Text bold>Plan Configuration</Text>

            <Box flexDirection="column" marginTop={1}>
                {modes.map((mode, index) => (
                    <Text key={mode} inverse={focusIndex === index}>
                        {selectedMode === mode ? '●' : '○'} {mode}
                    </Text>
                ))}
            </Box>

            {selectedMode === 'lite' && (
                <Box flexDirection="column" marginTop={1}>
                    <Text dimColor>Add-ons:</Text>
                    {addOns.map((addOn, index) => {
                        const itemIndex = modes.length + index;
                        return (
                            <Text key={addOn} inverse={focusIndex === itemIndex}>
                                {selectedAddOns.has(addOn) ? '[x]' : '[ ]'} {addOn}
                            </Text>
                        );
                    })}
                </Box>
            )}

            <Box flexDirection="row" marginTop={1} gap={2}>
                <Text inverse={focusIndex === totalItems - 2}>Save</Text>
                <Text inverse={focusIndex === totalItems - 1}>Cancel</Text>
            </Box>
        </Box>
    );
} 