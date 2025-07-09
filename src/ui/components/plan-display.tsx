import React from 'react';
import { Text, Box } from 'ink';
import { Plan } from '../../types.js';

interface PlanDisplayProps {
    plan: Plan;
}

export function PlanDisplay({ plan }: PlanDisplayProps) {
    const addOnsText = plan.mode === 'lite' && plan.addOns.length > 0 
        ? ` (${plan.addOns.join(', ')})` 
        : '';
    
    return (
        <Box justifyContent="flex-end" marginRight={2}>
            <Text color="green">
                Plan: {plan.mode.charAt(0).toUpperCase() + plan.mode.slice(1)}{addOnsText}
            </Text>
        </Box>
    );
} 