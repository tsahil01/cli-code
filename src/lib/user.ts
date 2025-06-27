import { WORKER_URL } from "./const.js";
import { UserData } from "../types.js";

export async function getUser(accessToken: string): Promise<UserData | null> {
    try {
        const user = await fetch(`${WORKER_URL}/user`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        })
        const data = await user.json();
        return data;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}