import { Pool } from '@neondatabase/serverless';

// Configuração do pool de conexões
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
}); 