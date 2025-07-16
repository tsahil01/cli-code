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
        const response = await fetch(`${WORKER_URL}/models/available`);
        const data: ModelsResponse = await response.json();
        
        let availableModels: ModelCapabilities[] = [];
        
        if (data.models.anthropic) {
            availableModels.push(...data.models.anthropic);
        }
        
        if (data.models.openai) {
            availableModels.push(...data.models.openai);
        }
        
        if (data.models.gemini) {
            availableModels.push(...data.models.gemini);
        }
        
        if (data.models.other) {
            availableModels.push(...data.models.other);
        }
        
        return availableModels;
    } catch (error) {
        console.error("Error fetching available models:", error);
        return [];
    }
}

export { getModels, getAvailableModels };