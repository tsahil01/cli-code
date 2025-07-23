import { useState } from 'react';
import { Plan } from '../types.js';

export function usePlan() {
    const [plan, setPlan] = useState<Plan>({ mode: 'lite', addOns: [] });
    const [showPlanDialog, setShowPlanDialog] = useState<boolean>(false);

    return {
        plan,
        setPlan,
        showPlanDialog,
        setShowPlanDialog,
    };
} 