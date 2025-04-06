import { pool } from './db.js';
import { insertTimeSlotSchema } from './schema.js';

// Função para garantir que a tabela existe
async function ensureTableExists() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_base BOOLEAN DEFAULT false
      )
    `);
    console.log('Tabela time_slots verificada/criada com sucesso');
  } catch (error) {
    console.error('Erro ao verificar/criar tabela time_slots:', error);
    throw error;
  }
}

// Funções do storage
async function getAllTimeSlots() {
  try {
    await ensureTableExists();
    const result = await pool.query(
      'SELECT * FROM time_slots ORDER BY start_time'
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    throw error;
  }
}

async function getTimeSlot(id) {
  try {
    const result = await pool.query(
      'SELECT * FROM time_slots WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return undefined;
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar horário:', error);
    return undefined;
  }
}

async function getBaseTimeSlots() {
  try {
    const result = await pool.query(
      'SELECT * FROM time_slots WHERE is_base = true ORDER BY start_time'
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar horários base:', error);
    return [];
  }
}

async function createTimeSlot(timeSlot) {
  try {
    // Validar campos obrigatórios
    if (!timeSlot.start_time || !timeSlot.end_time) {
      throw new Error('Os campos start_time e end_time são obrigatórios');
    }

    // Definir is_base como false se não for fornecido
    const is_base = timeSlot.is_base ?? false;

    console.log('Criando time slot com dados:', {
      start_time: timeSlot.start_time,
      end_time: timeSlot.end_time,
      is_base
    });

    const result = await pool.query(
      'INSERT INTO time_slots (start_time, end_time, is_base) VALUES ($1, $2, $3) RETURNING *',
      [timeSlot.start_time, timeSlot.end_time, is_base]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar horário:', error);
    throw error;
  }
}

async function deleteTimeSlot(id) {
  try {
    const result = await pool.query(
      'DELETE FROM time_slots WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro ao excluir horário:', error);
    return false;
  }
}

export default async function handler(req, res) {
  const method = req.method;

  // Rotas para slots de tempo
  try {
    switch (method) {
      case 'GET':
        if (req.query.id) {
          const timeSlot = await getTimeSlot(Number(req.query.id));
          if (!timeSlot) {
            return res.status(404).json({ error: 'Horário não encontrado' });
          }
          return res.status(200).json(timeSlot);
        } else if (req.query.base === 'true') {
          const timeSlots = await getBaseTimeSlots();
          return res.status(200).json(timeSlots);
        } else {
          const timeSlots = await getAllTimeSlots();
          return res.status(200).json(timeSlots);
        }

      case 'POST':
        try {
          console.log('Recebido POST em /api/time-slots com body:', req.body);

          // Validar dados usando o schema
          const validatedData = insertTimeSlotSchema.parse(req.body);
          console.log('Dados validados:', validatedData);

          const timeSlot = await createTimeSlot(validatedData);
          console.log('Time slot criado:', timeSlot);

          return res.status(201).json(timeSlot);
        } catch (error) {
          console.error('Erro ao criar horário:', error);
          return res.status(400).json({ 
            error: 'Dados inválidos', 
            details: error.message,
            receivedData: req.body 
          });
        }

      case 'DELETE':
        try {
          const id = Number(req.query.id);
          if (!id) {
            return res.status(400).json({ error: 'ID não fornecido' });
          }
          
          const existingTimeSlot = await getTimeSlot(id);
          if (!existingTimeSlot) {
            return res.status(404).json({ error: 'Horário não encontrado' });
          }
          
          const deleted = await deleteTimeSlot(id);
          if (!deleted) {
            return res.status(500).json({ error: 'Erro ao excluir horário' });
          }
          
          return res.status(204).end();
        } catch (error) {
          return res.status(500).json({ error: 'Erro ao processar solicitação', details: error.message });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Método ${method} não permitido` });
    }
  } catch (error) {
    console.error('Erro ao processar requisição de horários:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}