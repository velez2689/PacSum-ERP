/**
 * PostgreSQL Database Connection
 * Direct PostgreSQL client for database operations
 */

import { Client } from 'pg';

let client: Client | null = null;

export async function getDb(): Promise<Client> {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
  }
  return client;
}

export async function queryDb<T>(query: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const result = await db.query(query, params);
  return result.rows as T[];
}

export async function queryDbSingle<T>(query: string, params: any[] = []): Promise<T | null> {
  const db = await getDb();
  const result = await db.query(query, params);
  return (result.rows[0] as T) || null;
}

export async function executeDb(query: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  await db.query(query, params);
}
