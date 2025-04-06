import { pool } from './db.js';
import { insertProfessionalSchema } from './schema.js';

// Função para garantir que a tabela existe
async function ensureTableExists() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS professionals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        initials TEXT NOT NULL,
        active BOOLEAN DEFAULT true
      )
    `);
    console.log('Tabela professionals verificada/criada com sucesso');
  } catch (error) {
    console.error('Erro ao verificar/criar tabela professionals:', error);
    throw error;
  }
}

// Funções do storage
async function getAllProfessionals() {
  try {
    await ensureTableExists();
    const result = await pool.query(
      'SELECT * FROM professionals ORDER BY name'
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    throw error;
  }
}

async function getProfessional(id) {
  try {
    const result = await pool.query(
      'SELECT * FROM professionals WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return undefined;
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar profissional:', error);
    return undefined;
  }
}

async function createProfessional(professional) {
  try {
    const result = await pool.query(
      'INSERT INTO professionals (name, initials, active) VALUES ($1, $2, $3) RETURNING *',
      [professional.name, professional.initials, professional.active]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar profissional:', error);
    throw new Error(`Erro ao criar profissional: ${error}`);
  }
}

async function updateProfessional(id, data) {
  try {
    const currentProf = await getProfessional(id);
    if (!currentProf) return undefined;
    
    const updatedProf = { ...currentProf, ...data };
    
    const result = await pool.query(
      'UPDATE professionals SET name = $1, initials = $2, active = $3 WHERE id = $4 RETURNING *',
      [updatedProf.name, updatedProf.initials, updatedProf.active, id]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar profissional:', error);
    return undefined;
  }
}

async function deleteProfessional(id) {
  try {
    const result = await pool.query(
      'DELETE FROM professionals WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro ao excluir profissional:', error);
    return false;
  }
}

export default async function handler(req, res) {
  const method = req.method;

  try {
    switch (method) {
      case 'GET':
        if (req.query.id) {
          const professional = await getProfessional(Number(req.query.id));
          if (!professional) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
          }
          return res.status(200).json(professional);
        } else {
          const professionals = await getAllProfessionals();
          return res.status(200).json(professionals);
        }

      case 'POST':
        try {
          const validatedData = insertProfessionalSchema.parse(req.body);
          const professional = await createProfessional(validatedData);
          return res.status(201).json(professional);
        } catch (error) {
          return res.status(400).json({ error: 'Dados inválidos', details: error.message });
        }

      case 'PUT':
        try {
          const id = Number(req.query.id);
          if (!id) {
            return res.status(400).json({ error: 'ID não fornecido' });
          }
          
          const existingProfessional = await getProfessional(id);
          if (!existingProfessional) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
          }
          
          const validatedData = insertProfessionalSchema.partial().parse(req.body);
          const updated = await updateProfessional(id, validatedData);
          
          if (!updated) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
          }
          
          return res.status(200).json(updated);
        } catch (error) {
          return res.status(400).json({ error: 'Dados inválidos', details: error.message });
        }

      case 'DELETE':
        try {
          const id = Number(req.query.id);
          if (!id) {
            return res.status(400).json({ error: 'ID não fornecido' });
          }
          
          const existingProfessional = await getProfessional(id);
          if (!existingProfessional) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
          }
          
          const deleted = await deleteProfessional(id);
          if (!deleted) {
            return res.status(500).json({ error: 'Erro ao excluir profissional' });
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
    console.error('Erro ao processar requisição de profissionais:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}