import { writeConfigFile } from "./configMngt.js";
import { BACKEND_URL } from "./const.js";

export async function login(refreshToken: string) {
    try {
        const response = await fetch(`${BACKEND_URL}/cli/tokens/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ refreshToken })
        })
        const data = await response.json();
        if (data.accessToken) {
            await writeConfigFile({ accessToken: data.accessToken });
            return data.accessToken;
        }
        return null;
    } catch (error) {
        console.error("Error refreshing tokens:", error);
        return null;
    }
}

export async function logout() {
    try {
        await writeConfigFile({ accessToken: null });
        return true;
    } catch (error) {
        console.error("Error logging out:", error);
        return false;
    }
}