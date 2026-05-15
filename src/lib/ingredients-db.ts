import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "ingredients.db");

function createDatabase() {
  fs.mkdirSync(DB_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  `);

  return db;
}

const db = createDatabase();

export type IngredientRow = {
  id: number;
  username: string;
  name: string;
  quantity: number;
  unit: string;
  createdAt: string;
};

export function getIngredients(username: string) {
  return db
    .prepare(
      "SELECT id, username, name, quantity, unit, createdAt FROM ingredients WHERE username = ? ORDER BY id ASC"
    )
    .all(username) as IngredientRow[];
}

export function createIngredient(username: string, name: string, quantity: number, unit: string) {
  const result = db
    .prepare(
      "INSERT INTO ingredients (username, name, quantity, unit) VALUES (?, ?, ?, ?)"
    )
    .run(username, name, quantity, unit);

  return db
    .prepare(
      "SELECT id, username, name, quantity, unit, createdAt FROM ingredients WHERE id = ? AND username = ?"
    )
    .get(Number(result.lastInsertRowid), username) as IngredientRow | undefined;
}

export function updateIngredient(
  username: string,
  id: number,
  data: Partial<Pick<IngredientRow, "name" | "quantity" | "unit">>
) {
  const current = db
    .prepare(
      "SELECT id, username, name, quantity, unit, createdAt FROM ingredients WHERE id = ? AND username = ?"
    )
    .get(id, username) as IngredientRow | undefined;

  if (!current) {
    return null;
  }

  const next = {
    name: data.name ?? current.name,
    quantity: data.quantity ?? current.quantity,
    unit: data.unit ?? current.unit,
  };

  db
    .prepare(
      "UPDATE ingredients SET name = ?, quantity = ?, unit = ? WHERE id = ? AND username = ?"
    )
    .run(next.name, next.quantity, next.unit, id, username);

  return db
    .prepare(
      "SELECT id, username, name, quantity, unit, createdAt FROM ingredients WHERE id = ? AND username = ?"
    )
    .get(id, username) as IngredientRow | undefined;
}

export function deleteIngredient(username: string, id: number) {
  const result = db
    .prepare("DELETE FROM ingredients WHERE id = ? AND username = ?")
    .run(id, username);

  return result.changes > 0;
}
