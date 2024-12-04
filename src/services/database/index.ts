import { Database } from "@db/sqlite";
import { CONFIG } from "@/config/index.ts";

export async function initializeDatabase(db: Database) {
    const schemaSql = await Deno.readTextFile(CONFIG.DATABASE.SCHEMA_PATH);
    db.exec(schemaSql);
}

export function extractExpectedColumnsFromSchema(schemaFilePath: string, tableName: string): string[] {
    const schemaSql = Deno.readTextFileSync(schemaFilePath);
    const regex = new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName} \\(([^)]+)\\)`, 'i');
    const match = schemaSql.match(regex);

    if (!match) {
        throw new Error(`No se pudo encontrar la definición de la tabla ${tableName} en el esquema.`);
    }

    const columnsDefinition = match[1];
    const columns = columnsDefinition.split(',').map(col => col.trim().split(' ')[0]);
    return columns;
}

export function initDB(): Database {
    const db = new Database(CONFIG.DATABASE.DB_NAME);
    initializeDatabase(db);
    return db;
}

initDB();