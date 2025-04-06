import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Configura o WebSocket para o Neon apenas em ambiente não-serverless
if (process.env.NODE_ENV !== 'production') {
  neonConfig.webSocketConstructor = ws;
}

// Usa a URL do pooler para melhor performance
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não está definida no arquivo .env');
}

// Cria o pool de conexões com configurações específicas para serverless
export const pool = new Pool({ 
  connectionString,
  connectionTimeoutMillis: 5000, // 5 segundos
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo máximo que uma conexão pode ficar ociosa
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Configura o Drizzle ORM
export const db = drizzle({ client: pool, schema });

// Função para testar a conexão
export async function testConnection() {
  try {
    const result = await pool.query('SELECT version()');
    console.log('Conexão com o Neon PostgreSQL estabelecida com sucesso:', result.rows[0].version);
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o Neon PostgreSQL:', error);
    return false;
  }
}

