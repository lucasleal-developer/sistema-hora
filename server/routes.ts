import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProfessionalSchema, 
  insertTimeSlotSchema, 
  insertScheduleSchema,
  weekdays,
  type WeekDay
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // API para profissionais
  apiRouter.get("/professionals", async (req: Request, res: Response) => {
    try {
      const professionals = await storage.getAllProfessionals();
      res.json(professionals);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar profissionais" });
    }
  });
  
  apiRouter.post("/professionals", async (req: Request, res: Response) => {
    try {
      const data = insertProfessionalSchema.parse(req.body);
      const professional = await storage.createProfessional(data);
      res.status(201).json(professional);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar profissional" });
      }
    }
  });
  
  apiRouter.put("/professionals/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = insertProfessionalSchema.partial().parse(req.body);
      const professional = await storage.updateProfessional(id, data);
      
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }
      
      res.json(professional);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar profissional" });
      }
    }
  });
  
  apiRouter.delete("/professionals/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteProfessional(id);
      
      if (!success) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir profissional" });
    }
  });
  
  // API para tipos de atividades
  apiRouter.get("/activity-types", async (req: Request, res: Response) => {
    try {
      console.log("Iniciando busca de tipos de atividades...");
      const activityTypes = await storage.getAllActivityTypes();
      console.log("Tipos de atividades encontrados:", activityTypes ? activityTypes.length : 0);
      res.json(activityTypes || []);
    } catch (error) {
      console.error("Erro ao buscar tipos de atividades:", error);
      res.status(500).json({ message: "Erro ao buscar tipos de atividades" });
    }
  });
  
  apiRouter.post("/activity-types", async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const activityType = await storage.createActivityType(data);
      res.status(201).json(activityType);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar tipo de atividade" });
    }
  });
  
  apiRouter.put("/activity-types/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = req.body;
      const activityType = await storage.updateActivityType(id, data);
      
      if (!activityType) {
        return res.status(404).json({ message: "Tipo de atividade não encontrado" });
      }
      
      res.json(activityType);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar tipo de atividade" });
    }
  });
  
  apiRouter.delete("/activity-types/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteActivityType(id);
      
      if (!success) {
        return res.status(404).json({ message: "Tipo de atividade não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir tipo de atividade" });
    }
  });
  
  // API para horários
  apiRouter.get("/time-slots", async (req: Request, res: Response) => {
    try {
      const timeSlots = await storage.getAllTimeSlots();
      res.json(timeSlots);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar horários" });
    }
  });
  
  apiRouter.post("/time-slots", async (req: Request, res: Response) => {
    try {
      const data = insertTimeSlotSchema.parse(req.body);
      const timeSlot = await storage.createTimeSlot(data);
      res.status(201).json(timeSlot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar horário" });
      }
    }
  });
  
  apiRouter.delete("/time-slots/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteTimeSlot(id);
      
      if (!success) {
        return res.status(404).json({ message: "Horário não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir horário" });
    }
  });
  
  // API para escalas
  apiRouter.get("/schedules/:weekday", async (req: Request, res: Response) => {
    try {
      const weekday = req.params.weekday as WeekDay;
      console.log(`GET /schedules/${weekday} - Buscando horários`);
      
      // Verifica se o dia da semana é válido
      if (!weekdays.includes(weekday as any)) {
        return res.status(400).json({ message: "Dia da semana inválido" });
      }
      
      // Busca todas as escalas do dia e profissionais
      const schedules = await storage.getSchedulesByDay(weekday);
      console.log("Escalas encontradas:", schedules.length);
      
      const professionals = await storage.getAllProfessionals();
      
      // Formata os dados para retornar
      const formattedData = {
        dia: weekday,
        profissionais: professionals.map(p => {
          // Filtra as escalas desse profissional
          const profSchedules = schedules.filter(s => s.professionalId === p.id);
          
          return {
            id: p.id,
            nome: p.name,
            iniciais: p.initials,
            horarios: profSchedules.map(s => ({
              id: s.id,
              hora: s.startTime,
              horaFim: s.endTime,
              atividade: s.activityCode,
              local: s.location || "",
              observacoes: s.notes || ""
            }))
          };
        })
      };
      
      res.json(formattedData);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar escalas" });
    }
  });
  
  apiRouter.get("/schedules", async (req: Request, res: Response) => {
    try {
      const professionalId = req.query.professionalId ? Number(req.query.professionalId) : undefined;
      
      if (!professionalId) {
        return res.status(400).json({ message: "ID do profissional é obrigatório" });
      }
      
      const schedules = await storage.getSchedulesByProfessional(professionalId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar escalas do profissional" });
    }
  });
  
  apiRouter.post("/schedules", async (req: Request, res: Response) => {
    try {
      console.log("POST /schedules - Criando nova atividade com dados:", req.body);
      const data = insertScheduleSchema.parse(req.body);
      
      // Verificar se já existe uma escala com os mesmos dados
      // Garantir que o dia da semana é um valor válido antes de verificar duplicatas
      const weekday = data.weekday;
      if (!weekdays.includes(weekday as any)) {
        return res.status(400).json({ message: "Dia da semana inválido" });
      }
      
      const existingSchedules = await storage.getSchedulesByDay(weekday as WeekDay);
      const duplicateSchedule = existingSchedules.find(s => 
        s.professionalId === data.professionalId && 
        s.startTime === data.startTime && 
        s.endTime === data.endTime
      );
      
      if (duplicateSchedule) {
        console.log("Encontrada escala existente com os mesmos dados:", duplicateSchedule);
        console.log("Atualizando escala existente em vez de criar nova");
        const updatedSchedule = await storage.updateSchedule(duplicateSchedule.id, data);
        return res.status(200).json(updatedSchedule);
      }
      
      // Criar nova escala
      const schedule = await storage.createSchedule(data);
      console.log("Nova escala criada:", schedule);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Erro ao criar escala:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar escala" });
      }
    }
  });
  
  apiRouter.put("/schedules/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      console.log("PUT /schedules/:id - Recebendo requisição para atualizar ID:", id, "Dados:", req.body);
      
      const data = insertScheduleSchema.partial().parse(req.body);
      
      // Verifica se existe uma atividade existente para esse ID
      const existingSchedule = await storage.getSchedule(id);
      if (!existingSchedule) {
        console.log(`Escala ID:${id} não encontrada`);
        return res.status(404).json({ message: "Escala não encontrada" });
      }
      
      console.log("Escala existente encontrada:", existingSchedule);
      const schedule = await storage.updateSchedule(id, data);
      console.log("Escala atualizada:", schedule);
      
      res.json(schedule);
    } catch (error) {
      console.error("Erro ao atualizar escala:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar escala" });
      }
    }
  });
  
  apiRouter.delete("/schedules/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteSchedule(id);
      
      if (!success) {
        return res.status(404).json({ message: "Escala não encontrada" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir escala" });
    }
  });
  
  // Prefixo para todas as rotas da API
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
