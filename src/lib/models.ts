import { WORKER_URL } from "./const.js";
import { ModelsResponse, ModelCapabilities } from "../types.js";
import { readConfigFile } from "./configMngt.js";

async function getModels() {
    try {
        const response = await fetch(`${WORKER_URL}/models`);
        const data = await response.json();
        return data.models;
    } catch (error) {
        console.error("Error fetching models:", error);
        return [];
    }
}

async function getAvailableModels(): Promise<ModelCapabilities[]> {
    try {
        const response = await fetch(`${WORKER_URL}/models`);
        const data: ModelsResponse = await response.json();
        
        const config = await readConfigFile();
        const hasAnthropicKey = !!config.ANTHROPIC_API_KEY;
        const hasGeminiKey = !!config.GEMINI_API_KEY;
        
        let availableModels: ModelCapabilities[] = [];
        
        if (hasAnthropicKey && data.models.anthropic) {
            availableModels.push(...data.models.anthropic);
        }
        
        if (hasGeminiKey && data.models.gemini) {
            availableModels.push(...data.models.gemini);
        }
        
        return availableModels;
    } catch (error) {
        console.error("Error fetching available models:", error);
        return [];
    }
}

export { getModels, getAvailableModels };