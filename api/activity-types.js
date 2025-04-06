import { pool } from './db';
import { insertActivityTypeSchema } from '../shared/schema';

// Funções do storage
async function getAllActivityTypes() {
  try {
    const result = await pool.query(
      'SELECT * FROM activity_types ORDER BY name'
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar tipos de atividades:', error);
    return [];
  }
}

async function getActivityType(id) {
  try {
    const result = await pool.query(
      'SELECT * FROM activity_types WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return undefined;
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar tipo de atividade:', error);
    return undefined;
  }
}

async function getActivityTypeByCode(code) {
  try {
    const result = await pool.query(
      'SELECT * FROM activity_types WHERE code = $1',
      [code]
    );
    if (result.rows.length === 0) return undefined;
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar tipo de atividade por código:', error);
    return undefined;
  }
}

async function createActivityType(activityType) {
  try {
    const result = await pool.query(
      'INSERT INTO activity_types (code, name, color) VALUES ($1, $2, $3) RETURNING *',
      [activityType.code, activityType.name, activityType.color]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar tipo de atividade:', error);
    throw new Error(`Erro ao criar tipo de atividade: ${error}`);
  }
}

async function updateActivityType(id, data) {
  try {
    const currentType = await getActivityType(id);
    if (!currentType) return undefined;
    
    const updatedType = { ...currentType, ...data };
    
    const result = await pool.query(
      'UPDATE activity_types SET code = $1, name = $2, color = $3 WHERE id = $4 RETURNING *',
      [updatedType.code, updatedType.name, updatedType.color, id]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar tipo de atividade:', error);
    return undefined;
  }
}

async function deleteActivityType(id) {
  try {
    const result = await pool.query(
      'DELETE FROM activity_types WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro ao excluir tipo de atividade:', error);
    return false;
  }
}

export default async function handler(req, res) {
  const method = req.method;

  try {
    if (method === 'GET') {
      if (req.query.id) {
        const activityType = await getActivityType(Number(req.query.id));
        if (!activityType) {
          return res.status(404).json({ error: 'Tipo de atividade não encontrado' });
        }
        return res.status(200).json(activityType);
      } else if (req.query.code) {
        const activityType = await getActivityTypeByCode(req.query.code);
        if (!activityType) {
          return res.status(404).json({ error: 'Tipo de atividade não encontrado' });
        }
        return res.status(200).json(activityType);
      } else {
        const activityTypes = await getAllActivityTypes();
        return res.status(200).json(activityTypes);
      }
    }
    
    else if (method === 'POST') {
      try {
        console.log("Recebido POST em /api/activity-types com body:", req.body);
        
        // Validar e criar tipo de atividade
        const validatedData = insertActivityTypeSchema.parse(req.body);
        console.log("Dados validados:", validatedData);
        
        const activityType = await createActivityType(validatedData);
        console.log("Tipo de atividade criado:", activityType);
        
        return res.status(201).json(activityType);
      } catch (error) {
        console.error("Erro ao criar tipo de atividade:", error);
        return res.status(400).json({ error: 'Dados inválidos', details: error.message });
      }
    }
    
    else if (method === 'PUT') {
      try {
        const id = Number(req.query.id);
        if (!id) {
          return res.status(400).json({ error: 'ID não fornecido' });
        }
        
        const existingActivityType = await getActivityType(id);
        if (!existingActivityType) {
          return res.status(404).json({ error: 'Tipo de atividade não encontrado' });
        }
        
        const validatedData = insertActivityTypeSchema.partial().parse(req.body);
        const updated = await updateActivityType(id, validatedData);
        
        if (!updated) {
          return res.status(404).json({ error: 'Tipo de atividade não encontrado' });
        }
        
        return res.status(200).json(updated);
      } catch (error) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.message });
      }
    }
    
    else if (method === 'DELETE') {
      try {
        const id = Number(req.query.id);
        if (!id) {
          return res.status(400).json({ error: 'ID não fornecido' });
        }
        
        const existingActivityType = await getActivityType(id);
        if (!existingActivityType) {
          return res.status(404).json({ error: 'Tipo de atividade não encontrado' });
        }
        
        const deleted = await deleteActivityType(id);
        if (!deleted) {
          return res.status(500).json({ error: 'Erro ao excluir tipo de atividade' });
        }
        
        return res.status(204).end();
      } catch (error) {
        return res.status(500).json({ error: 'Erro ao processar solicitação', details: error.message });
      }
    }
    
    else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Método ${method} não permitido` });
    }
  } catch (error) {
    console.error('Erro ao processar requisição de tipos de atividades:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}