import { WORKER_URL } from "./const.js";
import { UserData } from "../types.js";
import { handleTokenExpiry } from "./auth.js";

export async function getUser(accessToken: string, retryCount: number = 0): Promise<UserData | null> {
    if (retryCount > 1) {
        console.error("Max retries reached for getUser. Kindly login again.");
        return null;
    }

    try {
        const user = await fetch(`${WORKER_URL}/user`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        })
        const data = await user.json();
        if (data.error) {
            const newAccessToken = await handleTokenExpiry(data);
            if (newAccessToken) {
                return getUser(newAccessToken, retryCount + 1);
            }
            return null;
        }
        return data;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}