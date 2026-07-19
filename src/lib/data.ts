import fs from "fs";
import path from "path";
import { Model, Provider, LastSync } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

export async function getProviders(): Promise<Provider[]> {
  try {
    const filePath = path.join(DATA_DIR, "providers.json");
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading providers.json:", error);
    return [];
  }
}

export async function getModels(): Promise<Model[]> {
  try {
    const filePath = path.join(DATA_DIR, "models.json");
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading models.json:", error);
    return [];
  }
}

export async function getLastSync(): Promise<LastSync> {
  try {
    const filePath = path.join(DATA_DIR, "last-sync.json");
    if (!fs.existsSync(filePath)) {
      return {
        syncedAt: new Date().toISOString(),
        totalModels: 0,
        onlineModels: 0,
        verifiedModels: 0,
        providerCount: 0,
      };
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading last-sync.json:", error);
    return {
      syncedAt: new Date().toISOString(),
      totalModels: 0,
      onlineModels: 0,
      verifiedModels: 0,
      providerCount: 0,
    };
  }
}
