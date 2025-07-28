import fs from "fs";
import path from "path";
import os from "os";
import { Session, Message } from "../types.js";

const SESSIONS_DIR = path.join(os.homedir(), ".config", "cli-code", "sessions");

function ensureSessionsDirectory() {
    if (!fs.existsSync(SESSIONS_DIR)) {
        fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
}

function getCurrentSessionId(): string {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function getSessionIdForDirectory(directory: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dirHash = Buffer.from(directory).toString('base64').slice(0, 8);
    return `${timestamp}-${dirHash}`;
}

function getSessionFilePath(sessionId: string): string {
    return path.join(SESSIONS_DIR, `${sessionId}.json`);
}

async function autoSaveSession(messages: Message[], directory: string, sessionId?: string) {
    try {
        ensureSessionsDirectory();
        const currentSessionId = sessionId || getCurrentSessionId();
        
        const session: Session = {
            date: currentSessionId,
            messages,
            directory
        };
        
        const sessionPath = getSessionFilePath(currentSessionId);
        fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
        
        return currentSessionId;
    } catch (error) {
        console.error("Error auto-saving session:", error);
        throw error;
    }
}

async function loadSession(sessionId: string): Promise<Session | null> {
    try {
        const sessionPath = getSessionFilePath(sessionId);
        
        if (!fs.existsSync(sessionPath)) {
            return null;
        }
        
        const sessionData = fs.readFileSync(sessionPath, "utf8");
        return JSON.parse(sessionData) as Session;
    } catch (error) {
        console.error("Error loading session:", error);
        return null;
    }
}

async function listSessions(): Promise<Session[]> {
    try {
        ensureSessionsDirectory();
        
        const files = fs.readdirSync(SESSIONS_DIR);
        const sessionFiles = files.filter(file => file.endsWith('.json'));
        
        const sessions: Session[] = [];
        
        for (const file of sessionFiles) {
            const sessionId = file.replace('.json', '');
            const session = await loadSession(sessionId);
            if (session) {
                sessions.push(session);
            }
        }
        
        return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error("Error listing sessions:", error);
        return [];
    }
}

async function deleteSession(sessionId: string): Promise<boolean> {
    try {
        const sessionPath = getSessionFilePath(sessionId);
        
        if (!fs.existsSync(sessionPath)) {
            return false;
        }
        
        fs.unlinkSync(sessionPath);
        return true;
    } catch (error) {
        console.error("Error deleting session:", error);
        return false;
    }
}

export {
    autoSaveSession,
    loadSession,
    listSessions,
    deleteSession,
    getCurrentSessionId,
    getSessionIdForDirectory,
    ensureSessionsDirectory
};