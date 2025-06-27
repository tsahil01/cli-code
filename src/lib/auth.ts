import { appendConfigFile, readConfigFile, writeConfigFile } from "./configMngt.js";
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
            await appendConfigFile({ accessToken: data.accessToken });
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
        await writeConfigFile({});
        return true;
    } catch (error) {
        console.error("Error logging out:", error);
        return false;
    }
}

export async function refreshToken(): Promise<string | null> {
    const config = await readConfigFile();
    if (!config.refreshToken) {
        console.error("No refresh token found");
        return null;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/cli/tokens/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ refreshToken: config.refreshToken })
        });
        
        if (!response.ok) {
            console.error("Failed to refresh token:", response.status);
            return null;
        }
        
        const data = await response.json();
        if (data.accessToken) {
            await writeConfigFile({ ...config, accessToken: data.accessToken });
            return data.accessToken;
        }
        return null;
    } catch (error) {
        console.error("Network error while refreshing token:", error);
        return null;
    }
}

export async function handleTokenExpiry(data: any): Promise<string | null> {
    if (data.error) {
        const details = data.error.details;
        if (details?.name === "TokenExpiredError") { 
            console.log("Token expired, refreshing...");
            const newAccessToken = await refreshToken();
            return newAccessToken;
        } else if (details?.name === "JsonWebTokenError") {
            console.error("Invalid token");
            return null;
        } else {
            console.error("Unknown auth error:", data.error);
            return null;
        }
    }
    return null;
}