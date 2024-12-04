import { assertEquals, assertThrows } from "@std/assert";
import { Database } from "@db/sqlite";
import { initializeDatabase, extractExpectedColumnsFromSchema } from "./index.ts";

Deno.test("initializeDatabase creates the blocks table", async () => {
    const db = new Database(":memory:");
    await initializeDatabase(db);
    const query = db.prepare("PRAGMA table_info(blocks)");
    const columns = [...query];

    const expectedColumns = extractExpectedColumnsFromSchema("schema.sql", "blocks");
    assertEquals(columns.length, expectedColumns.length);

    db.close();
});

Deno.test("extractExpectedColumnsFromSchema extracts correct columns", () => {
    const expectedColumns = extractExpectedColumnsFromSchema("schema.sql", "blocks");
    const expected = ["block_height", "block_hash", "transactions"];

    assertEquals(expectedColumns, expected);
});

Deno.test("extractExpectedColumnsFromSchema throws error for non-existent table", () => {
    assertThrows(() => {
        extractExpectedColumnsFromSchema("schema.sql", "non_existent_table");
    }, Error, "No se pudo encontrar la definición de la tabla non_existent_table en el esquema.");
});