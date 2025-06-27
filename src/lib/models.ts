import { WORKER_URL } from "./const.js";

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

export { getModels };