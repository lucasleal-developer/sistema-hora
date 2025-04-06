import { storage } from '../server/storage';
import { insertScheduleSchema } from '../shared/schema';

export default async function handler(req, res) {
  const method = req.method;

  // Rotas para agendamentos
  try {
    switch (method) {
      case 'GET':
        if (req.query.id) {
          const schedule = await storage.getSchedule(Number(req.query.id));
          if (!schedule) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
          }
          return res.status(200).json(schedule);
        } else if (req.query.weekday) {
          const schedules = await storage.getSchedulesByDay(req.query.weekday);
          return res.status(200).json(schedules);
        } else if (req.query.professionalId) {
          const schedules = await storage.getSchedulesByProfessional(Number(req.query.professionalId));
          return res.status(200).json(schedules);
        } else {
          // Busca todos os agendamentos (não recomendado em produção)
          return res.status(400).json({ error: 'Parâmetro de filtro obrigatório (weekday ou professionalId)' });
        }

      case 'POST':
        try {
          const validatedData = insertScheduleSchema.parse(req.body);
          const schedule = await storage.createSchedule(validatedData);
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
          
          const existingSchedule = await storage.getSchedule(id);
          if (!existingSchedule) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
          }
          
          // Validação parcial dos dados
          const validatedData = insertScheduleSchema.partial().parse(req.body);
          const updated = await storage.updateSchedule(id, validatedData);
          
          if (!updated) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
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
          
          const existingSchedule = await storage.getSchedule(id);
          if (!existingSchedule) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
          }
          
          const deleted = await storage.deleteSchedule(id);
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