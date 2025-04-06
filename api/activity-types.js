import { storage } from '../server/storage';
import { insertActivityTypeSchema } from '../shared/schema';

export default async function handler(req, res) {
  const method = req.method;

  // Rotas para tipos de atividades
  try {
    if (method === 'GET') {
      if (req.query.id) {
        const activityType = await storage.getActivityType(Number(req.query.id));
        if (!activityType) {
          return res.status(404).json({ error: 'Tipo de atividade não encontrado' });
        }
        return res.status(200).json(activityType);
      } else if (req.query.code) {
        const activityType = await storage.getActivityTypeByCode(req.query.code);
        if (!activityType) {
          return res.status(404).json({ error: 'Tipo de atividade não encontrado' });
        }
        return res.status(200).json(activityType);
      } else {
        const activityTypes = await storage.getAllActivityTypes();
        return res.status(200).json(activityTypes);
      }
    }
    
    else if (method === 'POST') {
      try {
        console.log("Recebido POST em /api/activity-types com body:", req.body);
        
        // Validar e criar tipo de atividade
        const validatedData = insertActivityTypeSchema.parse(req.body);
        console.log("Dados validados:", validatedData);
        
        const activityType = await storage.createActivityType(validatedData);
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
        
        const existingActivityType = await storage.getActivityType(id);
        if (!existingActivityType) {
          return res.status(404).json({ error: 'Tipo de atividade não encontrado' });
        }
        
        // Validação parcial dos dados
        const validatedData = insertActivityTypeSchema.partial().parse(req.body);
        const updated = await storage.updateActivityType(id, validatedData);
        
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
        
        const existingActivityType = await storage.getActivityType(id);
        if (!existingActivityType) {
          return res.status(404).json({ error: 'Tipo de atividade não encontrado' });
        }
        
        const deleted = await storage.deleteActivityType(id);
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