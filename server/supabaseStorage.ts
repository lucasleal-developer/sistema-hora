import { supabase } from './supabase';
import { IStorage } from './storage';
import {
  User, InsertUser,
  Professional, InsertProfessional,
  ActivityType, InsertActivityType,
  TimeSlot, InsertTimeSlot,
  Schedule, InsertSchedule,
  WeekDay,
  defaultActivityTypes
} from '@shared/schema';

export class SupabaseStorage implements IStorage {
  constructor() {
    // Inicializa as tabelas básicas
    this.setupDatabase().catch(err => {
      console.error("Erro ao configurar banco de dados Supabase:", err);
    });
  }

  async setupDatabase() {
    try {
      // Vamos apenas adicionar os dados padrão se as tabelas existirem
      try {
        // Verifica se já existem tipos de atividades
        const { data: existingActivityTypes, error: activityError, count } = await supabase
          .from('activity_types')
          .select('*', { count: 'exact', head: true });
        
        if (!activityError) {
          // Se não houver erro, a tabela existe
          console.log("Tabela activity_types existe no Supabase");
          
          // Se não houver registros, insere os tipos de atividade padrão
          if (!count || count === 0) {
            console.log("Inicializando tipos de atividades padrão no Supabase");
            await this.initDefaultActivityTypes();
          } else {
            console.log(`Tabela activity_types já contém ${count} registros`);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar/adicionar tipos de atividades:", err);
      }
      
      try {
        // Verifica se já existem slots de tempo
        const { data: existingTimeSlots, error: timeSlotsError, count: timeSlotsCount } = await supabase
          .from('time_slots')
          .select('*', { count: 'exact', head: true });
        
        if (!timeSlotsError) {
          console.log("Tabela time_slots existe no Supabase");
          
          // Se não houver registros, insere os slots de tempo padrão
          if (!timeSlotsCount || timeSlotsCount === 0) {
            console.log("Inicializando slots de tempo padrão no Supabase");
            await this.initDefaultTimeSlots();
          } else {
            console.log(`Tabela time_slots já contém ${timeSlotsCount} registros`);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar/adicionar slots de tempo:", err);
      }
      
      try {
        // Verifica se já existem profissionais
        const { data: existingProfessionals, error: professionalsError, count: professionalsCount } = await supabase
          .from('professionals')
          .select('*', { count: 'exact', head: true });
        
        if (!professionalsError) {
          console.log("Tabela professionals existe no Supabase");
          
          // Se não houver registros, insere os profissionais padrão
          if (!professionalsCount || professionalsCount === 0) {
            console.log("Inicializando profissionais de exemplo no Supabase");
            await this.initDefaultProfessionals();
          } else {
            console.log(`Tabela professionals já contém ${professionalsCount} registros`);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar/adicionar profissionais:", err);
      }

      console.log("Configuração do banco de dados Supabase concluída com sucesso");
    } catch (err) {
      console.error("Erro durante a configuração do banco de dados Supabase:", err);
      throw err;
    }
  }
  
  // Métodos auxiliares para inicialização de dados
  async initDefaultActivityTypes() {
    const defaultTypes = defaultActivityTypes;
    
    for (const actType of defaultTypes) {
      try {
        await this.createActivityType(actType);
        console.log(`Tipo de atividade ${actType.code} criado com sucesso`);
      } catch (error) {
        console.error(`Erro ao criar tipo de atividade ${actType.code}:`, error);
      }
    }
  }
  
  async initDefaultTimeSlots() {
    const defaultSlots: InsertTimeSlot[] = [
      { startTime: "08:00", endTime: "08:30", interval: 30, isBaseSlot: 1 },
      { startTime: "08:30", endTime: "09:00", interval: 30, isBaseSlot: 1 },
      { startTime: "09:00", endTime: "09:30", interval: 30, isBaseSlot: 1 },
      { startTime: "09:30", endTime: "10:00", interval: 30, isBaseSlot: 1 },
      { startTime: "10:00", endTime: "10:30", interval: 30, isBaseSlot: 1 },
      { startTime: "10:30", endTime: "11:00", interval: 30, isBaseSlot: 1 },
      { startTime: "11:00", endTime: "11:30", interval: 30, isBaseSlot: 1 },
      { startTime: "11:30", endTime: "12:00", interval: 30, isBaseSlot: 1 },
      { startTime: "13:00", endTime: "13:30", interval: 30, isBaseSlot: 1 },
      { startTime: "13:30", endTime: "14:00", interval: 30, isBaseSlot: 1 },
      { startTime: "14:00", endTime: "14:30", interval: 30, isBaseSlot: 1 },
      { startTime: "14:30", endTime: "15:00", interval: 30, isBaseSlot: 1 },
      { startTime: "15:00", endTime: "15:30", interval: 30, isBaseSlot: 1 },
      { startTime: "15:30", endTime: "16:00", interval: 30, isBaseSlot: 1 },
      { startTime: "16:00", endTime: "16:30", interval: 30, isBaseSlot: 1 },
      { startTime: "16:30", endTime: "17:00", interval: 30, isBaseSlot: 1 },
      { startTime: "17:00", endTime: "17:30", interval: 30, isBaseSlot: 1 },
      { startTime: "17:30", endTime: "18:00", interval: 30, isBaseSlot: 1 },
      { startTime: "18:00", endTime: "18:30", interval: 30, isBaseSlot: 1 },
      { startTime: "18:30", endTime: "19:00", interval: 30, isBaseSlot: 1 }
    ];
    
    for (const slot of defaultSlots) {
      try {
        await this.createTimeSlot(slot);
        console.log(`Slot de tempo ${slot.startTime}-${slot.endTime} criado com sucesso`);
      } catch (error) {
        console.error(`Erro ao criar slot de tempo ${slot.startTime}-${slot.endTime}:`, error);
      }
    }
  }
  
  async initDefaultProfessionals() {
    const defaultProfessionals: InsertProfessional[] = [
      { name: "Prof. Paulo", initials: "PP", active: 1 },
      { name: "Profa. Ana Maria", initials: "AM", active: 1 },
      { name: "Prof. Carlos", initials: "CL", active: 1 },
      { name: "Prof. João", initials: "JM", active: 1 },
      { name: "Profa. Maria", initials: "MM", active: 1 }
    ];
    
    for (const professional of defaultProfessionals) {
      try {
        await this.createProfessional(professional);
        console.log(`Profissional ${professional.name} criado com sucesso`);
      } catch (error) {
        console.error(`Erro ao criar profissional ${professional.name}:`, error);
      }
    }
  }
  // Usuários
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Erro ao criar usuário: ${error?.message || 'Desconhecido'}`);
    }
    
    return data as User;
  }
  
  // Profissionais
  async getAllProfessionals(): Promise<Professional[]> {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .order('name');
    
    if (error) {
      throw new Error(`Erro ao buscar profissionais: ${error.message}`);
    }
    
    return data as Professional[] || [];
  }

  async getProfessional(id: number): Promise<Professional | undefined> {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Professional;
  }

  async createProfessional(professional: InsertProfessional): Promise<Professional> {
    const { data, error } = await supabase
      .from('professionals')
      .insert(professional)
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Erro ao criar profissional: ${error?.message || 'Desconhecido'}`);
    }
    
    return data as Professional;
  }

  async updateProfessional(id: number, data: Partial<InsertProfessional>): Promise<Professional | undefined> {
    const { data: updatedData, error } = await supabase
      .from('professionals')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !updatedData) return undefined;
    return updatedData as Professional;
  }

  async deleteProfessional(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('professionals')
      .delete()
      .eq('id', id);
    
    return !error;
  }
  
  // Tipos de Atividades
  async getAllActivityTypes(): Promise<ActivityType[]> {
    try {
      console.log("SupabaseStorage: Buscando todos os tipos de atividades");
      
      const { data, error } = await supabase
        .from('activity_types')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Erro do Supabase ao buscar tipos de atividades:", error);
        return [];
      }
      
      return data as ActivityType[] || [];
    } catch (error) {
      console.error("Erro não tratado ao buscar tipos de atividades:", error);
      return []; // Retorna array vazio em caso de erro para não quebrar a UI
    }
  }

  async getActivityType(id: number): Promise<ActivityType | undefined> {
    const { data, error } = await supabase
      .from('activity_types')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as ActivityType;
  }

  async getActivityTypeByCode(code: string): Promise<ActivityType | undefined> {
    const { data, error } = await supabase
      .from('activity_types')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error || !data) return undefined;
    return data as ActivityType;
  }

  async createActivityType(activityType: InsertActivityType): Promise<ActivityType> {
    try {
      const { data, error } = await supabase
        .from('activity_types')
        .insert(activityType)
        .select()
        .single();
      
      if (error || !data) {
        throw new Error(`Erro ao criar tipo de atividade: ${error?.message || 'Desconhecido'}`);
      }
      
      return data as ActivityType;
    } catch (error) {
      const supabaseError = error as Error;
      console.error("Erro ao criar tipo de atividade:", supabaseError);
      throw new Error(`Erro ao criar tipo de atividade: ${supabaseError.message}`);
    }
  }

  async updateActivityType(id: number, data: Partial<InsertActivityType>): Promise<ActivityType | undefined> {
    const { data: updatedData, error } = await supabase
      .from('activity_types')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !updatedData) return undefined;
    return updatedData as ActivityType;
  }

  async deleteActivityType(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('activity_types')
      .delete()
      .eq('id', id);
    
    return !error;
  }
  
  // Horários
  async getAllTimeSlots(): Promise<TimeSlot[]> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('startTime');
    
    if (error) {
      throw new Error(`Erro ao buscar horários: ${error.message}`);
    }
    
    return data as TimeSlot[] || [];
  }

  async getBaseTimeSlots(): Promise<TimeSlot[]> {
    // Suponha que os slots base não tenham alguma propriedade específica
    // ou tenham uma flag "isBase" = true, por exemplo
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('startTime');
    
    if (error) {
      throw new Error(`Erro ao buscar horários base: ${error.message}`);
    }
    
    return data as TimeSlot[] || [];
  }

  async getTimeSlot(id: number): Promise<TimeSlot | undefined> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as TimeSlot;
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const { data, error } = await supabase
      .from('time_slots')
      .insert(timeSlot)
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Erro ao criar horário: ${error?.message || 'Desconhecido'}`);
    }
    
    return data as TimeSlot;
  }

  async deleteTimeSlot(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id);
    
    return !error;
  }
  
  // Escalas
  async getSchedulesByDay(weekday: WeekDay): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('weekday', weekday);
    
    if (error) {
      throw new Error(`Erro ao buscar escalas por dia: ${error.message}`);
    }
    
    return data as Schedule[] || [];
  }

  async getSchedulesByProfessional(professionalId: number): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('professionalId', professionalId);
    
    if (error) {
      throw new Error(`Erro ao buscar escalas por profissional: ${error.message}`);
    }
    
    return data as Schedule[] || [];
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Schedule;
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert(schedule)
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Erro ao criar escala: ${error?.message || 'Desconhecido'}`);
    }
    
    return data as Schedule;
  }

  async updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const { data: updatedData, error } = await supabase
      .from('schedules')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !updatedData) return undefined;
    return updatedData as Schedule;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);
    
    return !error;
  }
}