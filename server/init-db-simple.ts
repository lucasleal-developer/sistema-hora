import { pool } from './db';

async function createTables() {
  try {
    // Criação das tabelas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    console.log('✅ Tabela users criada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_types (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      );
    `);
    console.log('✅ Tabela activity_types criada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS professionals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        initials TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
      );
    `);
    console.log('✅ Tabela professionals criada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        interval INTEGER NOT NULL DEFAULT 30,
        is_base_slot INTEGER NOT NULL DEFAULT 1
      );
    `);
    console.log('✅ Tabela time_slots criada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        professional_id INTEGER NOT NULL,
        weekday TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        activity_code TEXT NOT NULL,
        location TEXT,
        notes TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela schedules criada');

    // Inserção dos tipos de atividades
    await pool.query(`
      INSERT INTO activity_types (code, name, color) VALUES
      ('aula', 'Aula', '#3b82f6'),
      ('reuniao', 'Reunião', '#8b5cf6'),
      ('plantao', 'Plantão', '#22c55e'),
      ('estudo', 'Estudo', '#eab308'),
      ('evento', 'Evento', '#ef4444'),
      ('ferias', 'Férias', '#06b6d4'),
      ('licenca', 'Licença', '#64748b'),
      ('disponivel_horario', 'Indisponível', '#6b7280')
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log('✅ Tipos de atividades inseridos');

    // Inserção dos horários padrão
    await pool.query(`
      INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES
      ('08:00', '08:30', 30, 1),
      ('08:30', '09:00', 30, 1),
      ('09:00', '09:30', 30, 1),
      ('09:30', '10:00', 30, 1),
      ('10:00', '10:30', 30, 1),
      ('10:30', '11:00', 30, 1),
      ('11:00', '11:30', 30, 1),
      ('11:30', '12:00', 30, 1),
      ('13:00', '13:30', 30, 1),
      ('13:30', '14:00', 30, 1),
      ('14:00', '14:30', 30, 1),
      ('14:30', '15:00', 30, 1),
      ('15:00', '15:30', 30, 1),
      ('15:30', '16:00', 30, 1),
      ('16:00', '16:30', 30, 1),
      ('16:30', '17:00', 30, 1),
      ('17:00', '17:30', 30, 1),
      ('17:30', '18:00', 30, 1),
      ('18:00', '18:30', 30, 1),
      ('18:30', '19:00', 30, 1);
    `);
    console.log('✅ Horários padrão inseridos');

    // Inserção dos professores
    await pool.query(`
      INSERT INTO professionals (name, initials, active) VALUES
      ('Prof. Paulo', 'PP', 1),
      ('Profa. Ana Maria', 'AM', 1),
      ('Prof. Carlos', 'CL', 1),
      ('Prof. João', 'JM', 1),
      ('Profa. Maria', 'MM', 1);
    `);
    console.log('✅ Professores inseridos');

    // Inserção das escalas de exemplo
    await pool.query(`
      INSERT INTO schedules (professional_id, weekday, start_time, end_time, activity_code, location, notes) VALUES
      (1, 'segunda', '08:00', '09:30', 'aula', 'Sala 101', 'Matemática'),
      (2, 'segunda', '08:00', '09:30', 'aula', 'Sala 203', 'Português'),
      (3, 'segunda', '08:00', '09:30', 'disponivel_horario', '', ''),
      (4, 'segunda', '08:00', '09:30', 'estudo', 'Biblioteca', 'Preparação de aulas'),
      (5, 'segunda', '08:00', '09:30', 'plantao', 'Sala Professores', 'Plantão de dúvidas'),
      (1, 'segunda', '09:45', '11:15', 'reuniao', 'Sala Reuniões', 'Reunião pedagógica');
    `);
    console.log('✅ Escalas de exemplo inseridas');

    console.log('\n✅ Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('\n❌ Erro ao inicializar o banco de dados:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Executa a função
createTables(); 