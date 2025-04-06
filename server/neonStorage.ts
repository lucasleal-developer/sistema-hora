import { pool } from './db';
import { IStorage } from './storage';
import {
  User,
  InsertUser,
  Professional,
  InsertProfessional,
  ActivityType,
  InsertActivityType,
  TimeSlot,
  InsertTimeSlot,
  Schedule,
  InsertSchedule,
  WeekDay
} from '@shared/schema';
import { log } from './vite';

export class NeonStorage implements IStorage {
  constructor() {
    // Não é necessário inicializar nada aqui, pois a inicialização 
    // do banco de dados é feita no neondb.ts
  }
  
  // Usuários
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) return undefined;
      return result.rows[0] as User;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) return undefined;
      return result.rows[0] as User;
    } catch (error) {
      console.error('Erro ao buscar usuário por nome de usuário:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
        [user.username, user.password]
      );
      
      return result.rows[0] as User;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw new Error(`Erro ao criar usuário: ${error}`);
    }
  }
  
  // Profissionais
  async getAllProfessionals(): Promise<Professional[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM professionals ORDER BY name'
      );
      
      return result.rows as Professional[];
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      throw new Error(`Erro ao buscar profissionais: ${error}`);
    }
  }

  async getProfessional(id: number): Promise<Professional | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM professionals WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) return undefined;
      return result.rows[0] as Professional;
    } catch (error) {
      console.error('Erro ao buscar profissional:', error);
      return undefined;
    }
  }

  async createProfessional(professional: InsertProfessional): Promise<Professional> {
    try {
      const result = await pool.query(
        'INSERT INTO professionals (name, initials, active) VALUES ($1, $2, $3) RETURNING *',
        [professional.name, professional.initials, professional.active]
      );
      
      return result.rows[0] as Professional;
    } catch (error) {
      console.error('Erro ao criar profissional:', error);
      throw new Error(`Erro ao criar profissional: ${error}`);
    }
  }

  async updateProfessional(id: number, data: Partial<InsertProfessional>): Promise<Professional | undefined> {
    try {
      const currentProf = await this.getProfessional(id);
      if (!currentProf) return undefined;
      
      const updatedProf = { ...currentProf, ...data };
      
      const result = await pool.query(
        'UPDATE professionals SET name = $1, initials = $2, active = $3 WHERE id = $4 RETURNING *',
        [updatedProf.name, updatedProf.initials, updatedProf.active, id]
      );
      
      return result.rows[0] as Professional;
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error);
      return undefined;
    }
  }

  async deleteProfessional(id: number): Promise<boolean> {
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
  
  // Tipos de Atividades
  async getAllActivityTypes(): Promise<ActivityType[]> {
    try {
      log("NeonStorage: Buscando todos os tipos de atividades");
      
      const result = await pool.query(
        'SELECT * FROM activity_types ORDER BY name'
      );
      
      return result.rows as ActivityType[];
    } catch (error) {
      console.error('Erro ao buscar tipos de atividades:', error);
      return []; // Retornar array vazio para não quebrar a UI
    }
  }

  async getActivityType(id: number): Promise<ActivityType | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM activity_types WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) return undefined;
      return result.rows[0] as ActivityType;
    } catch (error) {
      console.error('Erro ao buscar tipo de atividade:', error);
      return undefined;
    }
  }

  async getActivityTypeByCode(code: string): Promise<ActivityType | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM activity_types WHERE code = $1',
        [code]
      );
      
      if (result.rows.length === 0) return undefined;
      return result.rows[0] as ActivityType;
    } catch (error) {
      console.error('Erro ao buscar tipo de atividade por código:', error);
      return undefined;
    }
  }

  async createActivityType(activityType: InsertActivityType): Promise<ActivityType> {
    try {
      const result = await pool.query(
        'INSERT INTO activity_types (code, name, color) VALUES ($1, $2, $3) RETURNING *',
        [activityType.code, activityType.name, activityType.color]
      );
      
      return result.rows[0] as ActivityType;
    } catch (error) {
      console.error('Erro ao criar tipo de atividade:', error);
      throw new Error(`Erro ao criar tipo de atividade: ${error}`);
    }
  }

  async updateActivityType(id: number, data: Partial<InsertActivityType>): Promise<ActivityType | undefined> {
    try {
      const currentActivityType = await this.getActivityType(id);
      if (!currentActivityType) return undefined;
      
      const updatedActivityType = { ...currentActivityType, ...data };
      
      const result = await pool.query(
        'UPDATE activity_types SET code = $1, name = $2, color = $3 WHERE id = $4 RETURNING *',
        [updatedActivityType.code, updatedActivityType.name, updatedActivityType.color, id]
      );
      
      return result.rows[0] as ActivityType;
    } catch (error) {
      console.error('Erro ao atualizar tipo de atividade:', error);
      return undefined;
    }
  }

  async deleteActivityType(id: number): Promise<boolean> {
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
  
  // Horários
  async getAllTimeSlots(): Promise<TimeSlot[]> {
    try {
      const result = await pool.query(
        'SELECT id, start_time as "startTime", end_time as "endTime", interval, is_base_slot as "isBaseSlot" FROM time_slots ORDER BY start_time'
      );
      
      return result.rows as TimeSlot[];
    } catch (error) {
      console.error('Erro ao buscar slots de tempo:', error);
      throw new Error(`Erro ao buscar horários: ${error}`);
    }
  }

  async getBaseTimeSlots(): Promise<TimeSlot[]> {
    try {
      const result = await pool.query(
        'SELECT id, start_time as "startTime", end_time as "endTime", interval, is_base_slot as "isBaseSlot" FROM time_slots WHERE is_base_slot = 1 ORDER BY start_time'
      );
      
      return result.rows as TimeSlot[];
    } catch (error) {
      console.error('Erro ao buscar slots de tempo base:', error);
      throw new Error(`Erro ao buscar horários base: ${error}`);
    }
  }

  async getTimeSlot(id: number): Promise<TimeSlot | undefined> {
    try {
      const result = await pool.query(
        'SELECT id, start_time as "startTime", end_time as "endTime", interval, is_base_slot as "isBaseSlot" FROM time_slots WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) return undefined;
      return result.rows[0] as TimeSlot;
    } catch (error) {
      console.error('Erro ao buscar slot de tempo:', error);
      return undefined;
    }
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    try {
      const result = await pool.query(
        'INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ($1, $2, $3, $4) RETURNING id, start_time as "startTime", end_time as "endTime", interval, is_base_slot as "isBaseSlot"',
        [timeSlot.startTime, timeSlot.endTime, timeSlot.interval, timeSlot.isBaseSlot]
      );
      
      return result.rows[0] as TimeSlot;
    } catch (error) {
      console.error('Erro ao criar slot de tempo:', error);
      throw new Error(`Erro ao criar horário: ${error}`);
    }
  }

  async deleteTimeSlot(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM time_slots WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Erro ao excluir slot de tempo:', error);
      return false;
    }
  }
  
  // Escalas
  async getSchedulesByDay(weekday: WeekDay): Promise<Schedule[]> {
    try {
      const result = await pool.query(
        'SELECT id, professional_id as "professionalId", weekday, start_time as "startTime", end_time as "endTime", activity_code as "activityCode", location, notes, updated_at as "updatedAt" FROM schedules WHERE weekday = $1',
        [weekday]
      );
      
      return result.rows as Schedule[];
    } catch (error) {
      console.error('Erro ao buscar escalas por dia:', error);
      throw new Error(`Erro ao buscar escalas por dia: ${error}`);
    }
  }

  async getSchedulesByProfessional(professionalId: number): Promise<Schedule[]> {
    try {
      const result = await pool.query(
        'SELECT id, professional_id as "professionalId", weekday, start_time as "startTime", end_time as "endTime", activity_code as "activityCode", location, notes, updated_at as "updatedAt" FROM schedules WHERE professional_id = $1',
        [professionalId]
      );
      
      return result.rows as Schedule[];
    } catch (error) {
      console.error('Erro ao buscar escalas por profissional:', error);
      throw new Error(`Erro ao buscar escalas por profissional: ${error}`);
    }
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    try {
      const result = await pool.query(
        'SELECT id, professional_id as "professionalId", weekday, start_time as "startTime", end_time as "endTime", activity_code as "activityCode", location, notes, updated_at as "updatedAt" FROM schedules WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) return undefined;
      return result.rows[0] as Schedule;
    } catch (error) {
      console.error('Erro ao buscar escala:', error);
      return undefined;
    }
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    try {
      const result = await pool.query(
        'INSERT INTO schedules (professional_id, weekday, start_time, end_time, activity_code, location, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, professional_id as "professionalId", weekday, start_time as "startTime", end_time as "endTime", activity_code as "activityCode", location, notes, updated_at as "updatedAt"',
        [
          schedule.professionalId,
          schedule.weekday,
          schedule.startTime,
          schedule.endTime,
          schedule.activityCode,
          schedule.location,
          schedule.notes
        ]
      );
      
      return result.rows[0] as Schedule;
    } catch (error) {
      console.error('Erro ao criar escala:', error);
      throw new Error(`Erro ao criar escala: ${error}`);
    }
  }

  async updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    try {
      const currentSchedule = await this.getSchedule(id);
      if (!currentSchedule) return undefined;
      
      const updatedSchedule = { ...currentSchedule, ...data };
      
      const result = await pool.query(
        'UPDATE schedules SET professional_id = $1, weekday = $2, start_time = $3, end_time = $4, activity_code = $5, location = $6, notes = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING id, professional_id as "professionalId", weekday, start_time as "startTime", end_time as "endTime", activity_code as "activityCode", location, notes, updated_at as "updatedAt"',
        [
          updatedSchedule.professionalId,
          updatedSchedule.weekday,
          updatedSchedule.startTime,
          updatedSchedule.endTime,
          updatedSchedule.activityCode,
          updatedSchedule.location,
          updatedSchedule.notes,
          id
        ]
      );
      
      return result.rows[0] as Schedule;
    } catch (error) {
      console.error('Erro ao atualizar escala:', error);
      return undefined;
    }
  }

  async deleteSchedule(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM schedules WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Erro ao excluir escala:', error);
      return false;
    }
  }
}