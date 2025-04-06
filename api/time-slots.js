import { storage } from '../server/storage';
import { insertTimeSlotSchema } from '../shared/schema';

export default async function handler(req, res) {
  const method = req.method;

  // Rotas para slots de tempo
  try {
    switch (method) {
      case 'GET':
        if (req.query.id) {
          const timeSlot = await storage.getTimeSlot(Number(req.query.id));
          if (!timeSlot) {
            return res.status(404).json({ error: 'Horário não encontrado' });
          }
          return res.status(200).json(timeSlot);
        } else if (req.query.base === 'true') {
          const timeSlots = await storage.getBaseTimeSlots();
          return res.status(200).json(timeSlots);
        } else {
          const timeSlots = await storage.getAllTimeSlots();
          return res.status(200).json(timeSlots);
        }

      case 'POST':
        try {
          const validatedData = insertTimeSlotSchema.parse(req.body);
          const timeSlot = await storage.createTimeSlot(validatedData);
          return res.status(201).json(timeSlot);
        } catch (error) {
          return res.status(400).json({ error: 'Dados inválidos', details: error.message });
        }

      case 'DELETE':
        try {
          const id = Number(req.query.id);
          if (!id) {
            return res.status(400).json({ error: 'ID não fornecido' });
          }
          
          const existingTimeSlot = await storage.getTimeSlot(id);
          if (!existingTimeSlot) {
            return res.status(404).json({ error: 'Horário não encontrado' });
          }
          
          const deleted = await storage.deleteTimeSlot(id);
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