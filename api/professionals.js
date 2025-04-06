import { storage } from '../server/storage';
import { insertProfessionalSchema } from '../shared/schema';

export default async function handler(req, res) {
  const method = req.method;

  // Rotas para profissionais
  try {
    switch (method) {
      case 'GET':
        if (req.query.id) {
          const professional = await storage.getProfessional(Number(req.query.id));
          if (!professional) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
          }
          return res.status(200).json(professional);
        } else {
          const professionals = await storage.getAllProfessionals();
          return res.status(200).json(professionals);
        }

      case 'POST':
        try {
          const validatedData = insertProfessionalSchema.parse(req.body);
          const professional = await storage.createProfessional(validatedData);
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
          
          const existingProfessional = await storage.getProfessional(id);
          if (!existingProfessional) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
          }
          
          // Validação parcial dos dados
          const validatedData = insertProfessionalSchema.partial().parse(req.body);
          const updated = await storage.updateProfessional(id, validatedData);
          
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
          
          const existingProfessional = await storage.getProfessional(id);
          if (!existingProfessional) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
          }
          
          const deleted = await storage.deleteProfessional(id);
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