import { UsageMetadata } from "@/types";
import { useState } from "react";

export function useUsage() {
    const [usage, setUsageState] = useState<UsageMetadata | null>(null);
    let totalUsage = 0;
    if (usage) {
        totalUsage = usage.inputTokens + usage.outputTokens;
    }
    return { usage, setUsage: setUsageState, totalUsage };
}