import { createHash, randomBytes } from "node:crypto";

export const API_KEYS = [
    '76c522c46e469405534fe8201b05fac17f87856ac431be7e191119240dc7dc37',
    'b950b3056f7bf3ac84f3744246fe6145c8f89882fdfae44ea41517fa2a099066'
]

export const API_KEY_HASHES = [
    '36f5429b75c3e6f98d6cc8498e44b976dc441cbaf094c5edcf821a00a7f5efcb',
    'b433149763138ad564c4840d940c3e9d37cc1486811dc8f82ca0bcd661aa47f1'
];

export function createApiKey() {
    const apiKey = randomBytes(32).toString("hex"); // Generar API key segura
    const hash = createHash("sha256").update(apiKey).digest("hex"); // Hash de la API key
    return { apiKey, hash };
}