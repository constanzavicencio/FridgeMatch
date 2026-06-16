declare module "better-sqlite3" {
  // Minimal typings to satisfy build-time TypeScript checks.
  export interface RunResult {
    changes: number;
    lastInsertRowid: number;
  }

  export default class BetterSqlite3 {
    constructor(path: string, options?: any);
    exec(sql: string): void;
    prepare(sql: string): Statement;
    close(): void;
  }
}
