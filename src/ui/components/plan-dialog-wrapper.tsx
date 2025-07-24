import React from 'react';
import { PlanDialog } from './plan-dialog.js';
import { Plan } from '../../types.js';
import { appendConfigFile } from '../../lib/configMngt.js';

type Props = {
    plan: Plan;
    setPlan: (plan: Plan) => void;
    showPlanDialog: boolean;
    setShowPlanDialog: (show: boolean) => void;
};

export function PlanDialogWrapper({ plan, setPlan, showPlanDialog, setShowPlanDialog }: Props) {
    if (!showPlanDialog) return null;
    return (
        <PlanDialog
            currentPlan={plan}
            onSave={async (newPlan) => {
                setPlan(newPlan);
                await appendConfigFile({ plan: newPlan });
                setShowPlanDialog(false);
            }}
            onCancel={() => setShowPlanDialog(false)}
        />
    );
} 