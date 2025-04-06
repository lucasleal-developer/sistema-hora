import { pool } from './db.js';

async function createTables() {
  try {
    // Criar tabela de profissionais
    await pool.query(`
      CREATE TABLE IF NOT EXISTS professionals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        initials TEXT NOT NULL,
        active BOOLEAN DEFAULT true
      )
    `);
    console.log('Tabela professionals criada ou já existe');

    // Criar tabela de tipos de atividade
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_types (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      )
    `);
    console.log('Tabela activity_types criada ou já existe');

    // Criar tabela de slots de tempo
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_base BOOLEAN DEFAULT false
      )
    `);
    console.log('Tabela time_slots criada ou já existe');

    // Criar tabela de agendamentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        professional_id INTEGER REFERENCES professionals(id),
        activity_type_id INTEGER REFERENCES activity_types(id),
        time_slot_id INTEGER REFERENCES time_slots(id),
        date TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT,
        notes TEXT
      )
    `);
    console.log('Tabela schedules criada ou já existe');

    return { success: true, message: 'Tabelas criadas com sucesso' };
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }

  try {
    const result = await createTables();
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 