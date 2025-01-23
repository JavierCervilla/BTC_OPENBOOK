import { createHash, randomBytes } from "node:crypto";
import { CONFIG } from "@/config/index.ts";

export const API_KEYS = ()=> {
    const partners = CONFIG.PARTNERS.CONFIG;
    const partnersArray = Object.keys(partners);
    const apiKeys = partnersArray.map((partner) => partners[partner]["api-key"]).flat();
    return apiKeys;
};

export const API_KEY_HASHES = API_KEYS().map((apiKey) => createHash("sha256").update(apiKey).digest("hex"));

export function createApiKey() {
    const apiKey = randomBytes(32).toString("hex"); // Generar API key segura
    const hash = createHash("sha256").update(apiKey).digest("hex"); // Hash de la API key
    return { apiKey, hash };
}