import fs from "fs";
import path from "path";
import os from "os";

type Config = Record<string, any>;

async function createConfigFile() {
    const configPath = path.join(os.homedir(), ".config", "cli-code", "config.json");
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify({}));
    }
}

async function writeConfigFile(config: Config) {
    const configPath = path.join(os.homedir(), ".config", "cli-code", "config.json");
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function appendConfigFile(newData: Config) {
    const existingConfig = await readConfigFile();
    const mergedConfig = { ...existingConfig, ...newData };
    await writeConfigFile(mergedConfig);
}

async function readConfigFile(key?: string): Promise<any> {
    const configPath = path.join(os.homedir(), ".config", "cli-code", "config.json");
    
    try {
        if (!fs.existsSync(configPath)) {
            await createConfigFile();
            return key ? undefined : {};
        }
        
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        return key ? config[key] : config;
    } catch (error) {
        console.error("Error reading config file:", error);
        return key ? undefined : {};
    }
}

export { createConfigFile, writeConfigFile, appendConfigFile, readConfigFile };