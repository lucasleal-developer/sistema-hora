import { pool } from './db.js';

// Função para garantir que todas as tabelas existem
async function ensureTablesExist() {
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
    console.log('Tabela professionals verificada/criada com sucesso');

    // Criar tabela de tipos de atividade
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_types (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      )
    `);
    console.log('Tabela activity_types verificada/criada com sucesso');

    // Criar tabela de slots de tempo
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_base BOOLEAN DEFAULT false
      )
    `);
    console.log('Tabela time_slots verificada/criada com sucesso');

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
    console.log('Tabela schedules verificada/criada com sucesso');
  } catch (error) {
    console.error('Erro ao verificar/criar tabelas:', error);
    throw error;
  }
}

// Funções do storage
async function getAllSchedules() {
  try {
    await ensureTablesExist();
    const result = await pool.query(`
      SELECT 
        s.*,
        p.name as professional_name,
        at.name as activity_type_name,
        ts.start_time,
        ts.end_time
      FROM schedules s
      JOIN professionals p ON s.professional_id = p.id
      JOIN activity_types at ON s.activity_type_id = at.id
      JOIN time_slots ts ON s.time_slot_id = ts.id
      ORDER BY s.date DESC, ts.start_time ASC
    `);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw error;
  }
}

async function getSchedule(id) {
  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        p.name as professional_name,
        at.name as activity_type_name,
        ts.start_time,
        ts.end_time
      FROM schedules s
      JOIN professionals p ON s.professional_id = p.id
      JOIN activity_types at ON s.activity_type_id = at.id
      JOIN time_slots ts ON s.time_slot_id = ts.id
      WHERE s.id = $1
    `, [id]);
    if (result.rows.length === 0) return undefined;
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    return undefined;
  }
}

async function getSchedulesByProfessionalAndDate(professionalId, date) {
  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        p.name as professional_name,
        at.name as activity_type_name,
        ts.start_time,
        ts.end_time
      FROM schedules s
      JOIN professionals p ON s.professional_id = p.id
      JOIN activity_types at ON s.activity_type_id = at.id
      JOIN time_slots ts ON s.time_slot_id = ts.id
      WHERE s.professional_id = $1 AND s.date = $2
      ORDER BY ts.start_time ASC
    `, [professionalId, date]);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar agendamentos por profissional e data:', error);
    return [];
  }
}

async function createSchedule(schedule) {
  try {
    const result = await pool.query(`
      INSERT INTO schedules (
        professional_id,
        activity_type_id,
        time_slot_id,
        date,
        client_name,
        client_phone,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      schedule.professional_id,
      schedule.activity_type_id,
      schedule.time_slot_id,
      schedule.date,
      schedule.client_name,
      schedule.client_phone,
      schedule.notes
    ]);
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    throw new Error(`Erro ao criar agendamento: ${error}`);
  }
}

async function updateSchedule(id, schedule) {
  try {
    const result = await pool.query(`
      UPDATE schedules
      SET 
        professional_id = $1,
        activity_type_id = $2,
        time_slot_id = $3,
        date = $4,
        client_name = $5,
        client_phone = $6,
        notes = $7
      WHERE id = $8
      RETURNING *
    `, [
      schedule.professional_id,
      schedule.activity_type_id,
      schedule.time_slot_id,
      schedule.date,
      schedule.client_name,
      schedule.client_phone,
      schedule.notes,
      id
    ]);
    if (result.rows.length === 0) return undefined;
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw new Error(`Erro ao atualizar agendamento: ${error}`);
  }
}

async function deleteSchedule(id) {
  try {
    const result = await pool.query(
      'DELETE FROM schedules WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    return false;
  }
}

export default async function handler(req, res) {
  const method = req.method;

  try {
    switch (method) {
      case 'GET':
        if (req.query.id) {
          const schedule = await getSchedule(Number(req.query.id));
          if (!schedule) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
          }
          return res.status(200).json(schedule);
        } else if (req.query.professional_id && req.query.date) {
          const schedules = await getSchedulesByProfessionalAndDate(
            Number(req.query.professional_id),
            req.query.date
          );
          return res.status(200).json(schedules);
        } else {
          const schedules = await getAllSchedules();
          return res.status(200).json(schedules);
        }

      case 'POST':
        try {
          const schedule = await createSchedule(req.body);
          return res.status(201).json(schedule);
        } catch (error) {
          return res.status(400).json({ error: 'Dados inválidos', details: error.message });
        }

      case 'PUT':
        try {
          const id = Number(req.query.id);
          if (!id) {
            return res.status(400).json({ error: 'ID não fornecido' });
          }
          
          const existingSchedule = await getSchedule(id);
          if (!existingSchedule) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
          }
          
          const schedule = await updateSchedule(id, req.body);
          if (!schedule) {
            return res.status(500).json({ error: 'Erro ao atualizar agendamento' });
          }
          
          return res.status(200).json(schedule);
        } catch (error) {
          return res.status(400).json({ error: 'Dados inválidos', details: error.message });
        }

      case 'DELETE':
        try {
          const id = Number(req.query.id);
          if (!id) {
            return res.status(400).json({ error: 'ID não fornecido' });
          }
          
          const existingSchedule = await getSchedule(id);
          if (!existingSchedule) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
          }
          
          const deleted = await deleteSchedule(id);
          if (!deleted) {
            return res.status(500).json({ error: 'Erro ao excluir agendamento' });
          }
          
          return res.status(204).end();
        } catch (error) {
          return res.status(500).json({ error: 'Erro ao processar solicitação', details: error.message });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Método ${method} não permitido` });
    }
  } catch (error) {
    console.error('Erro ao processar requisição de agendamentos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}