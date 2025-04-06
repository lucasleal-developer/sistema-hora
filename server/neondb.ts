import { db, pool } from './db';
import { log } from './vite';
import {
  users,
  activityTypeTable,
  professionals,
  timeSlots,
  schedules,
  defaultActivityTypes,
  type InsertTimeSlot
} from '@shared/schema';

export async function testNeonConnection() {
  try {
    log("Testando conexão com o Neon PostgreSQL...");
    const result = await pool.query("SELECT version()");
    const versionInfo = result.rows[0].version;
    log(`Conexão com o Neon PostgreSQL estabelecida com sucesso: ${versionInfo.split(',')[0]}`);
    return true;
  } catch (error) {
    log(`Erro ao conectar com o Neon PostgreSQL: ${error}`);
    return false;
  }
}

async function createTablesIfNotExist() {
  try {
    log("Criando tabelas no Neon PostgreSQL se não existirem...");
    
    // Usando o schema do drizzle para criar as tabelas
    try {
      // Verifica se a tabela users existe
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        )
      `);
      log("Tabela users verificada/criada");
      
      // Verifica se a tabela activity_types existe
      await pool.query(`
        CREATE TABLE IF NOT EXISTS activity_types (
          id SERIAL PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          color TEXT NOT NULL
        )
      `);
      log("Tabela activity_types verificada/criada");
      
      // Verifica se a tabela professionals existe
      await pool.query(`
        CREATE TABLE IF NOT EXISTS professionals (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          initials TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 1
        )
      `);
      log("Tabela professionals verificada/criada");
      
      // Verifica se a tabela time_slots existe
      await pool.query(`
        CREATE TABLE IF NOT EXISTS time_slots (
          id SERIAL PRIMARY KEY,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          interval INTEGER NOT NULL DEFAULT 30,
          is_base_slot INTEGER NOT NULL DEFAULT 1
        )
      `);
      log("Tabela time_slots verificada/criada");
      
      // Verifica se a tabela schedules existe
      await pool.query(`
        CREATE TABLE IF NOT EXISTS schedules (
          id SERIAL PRIMARY KEY,
          professional_id INTEGER NOT NULL,
          weekday TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          activity_code TEXT NOT NULL,
          location TEXT,
          notes TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      log("Tabela schedules verificada/criada");
      
      return true;
    } catch (error) {
      log(`Erro ao criar tabelas no Neon PostgreSQL: ${error}`);
      return false;
    }
  } catch (error) {
    log(`Erro ao criar tabelas no Neon PostgreSQL: ${error}`);
    return false;
  }
}

async function populateDefaultData() {
  try {
    log("Verificando se é necessário adicionar dados padrão...");
    
    // Verificar se já existem tipos de atividade
    const activityTypesResult = await pool.query("SELECT COUNT(*) FROM activity_types");
    const activityTypesCount = parseInt(activityTypesResult.rows[0].count);
    
    if (activityTypesCount === 0) {
      log("Inserindo tipos de atividade padrão...");
      for (const actType of defaultActivityTypes) {
        try {
          await pool.query(
            `INSERT INTO activity_types (code, name, color) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (code) DO NOTHING`,
            [actType.code, actType.name, actType.color]
          );
          log(`Tipo de atividade ${actType.code} inserido com sucesso`);
        } catch (error) {
          log(`Erro ao inserir tipo de atividade ${actType.code}: ${error}`);
        }
      }
    } else {
      log(`${activityTypesCount} tipos de atividade já existem, pulando inserção`);
    }
    
    // Verificar se já existem slots de tempo
    const timeSlotsResult = await pool.query("SELECT COUNT(*) FROM time_slots");
    const timeSlotsCount = parseInt(timeSlotsResult.rows[0].count);
    
    if (timeSlotsCount === 0) {
      log("Inserindo slots de tempo padrão...");
      const defaultTimeSlots: InsertTimeSlot[] = [
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
      
      for (const slot of defaultTimeSlots) {
        try {
          await pool.query(
            `INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (start_time, end_time) DO NOTHING`,
            [slot.startTime, slot.endTime, slot.interval, slot.isBaseSlot]
          );
          log(`Slot de tempo ${slot.startTime}-${slot.endTime} inserido com sucesso`);
        } catch (error) {
          log(`Erro ao inserir slot de tempo ${slot.startTime}-${slot.endTime}: ${error}`);
        }
      }
    } else {
      log(`${timeSlotsCount} slots de tempo já existem, pulando inserção`);
    }
    
    // Verificar se já existem profissionais
    const professionalsResult = await pool.query("SELECT COUNT(*) FROM professionals");
    const professionalsCount = parseInt(professionalsResult.rows[0].count);
    
    if (professionalsCount === 0) {
      log("Inserindo profissionais padrão...");
      const defaultProfessionals = [
        { name: "Prof. Paulo", initials: "PP", active: 1 },
        { name: "Profa. Ana Maria", initials: "AM", active: 1 },
        { name: "Prof. Carlos", initials: "CL", active: 1 },
        { name: "Prof. João", initials: "JM", active: 1 },
        { name: "Profa. Maria", initials: "MM", active: 1 }
      ];
      
      for (const prof of defaultProfessionals) {
        try {
          await pool.query(
            `INSERT INTO professionals (name, initials, active) 
             VALUES ($1, $2, $3)
             ON CONFLICT (name) DO NOTHING`,
            [prof.name, prof.initials, prof.active]
          );
          log(`Profissional ${prof.name} inserido com sucesso`);
        } catch (error) {
          log(`Erro ao inserir profissional ${prof.name}: ${error}`);
        }
      }
    } else {
      log(`${professionalsCount} profissionais já existem, pulando inserção`);
    }
    
    return true;
  } catch (error) {
    log(`Erro ao popular dados padrão no Neon PostgreSQL: ${error}`);
    return false;
  }
}

export async function initializeNeonDb() {
  try {
    // Testa a conexão com o banco Neon
    const connected = await testNeonConnection();
    
    if (connected) {
      // Cria as tabelas se não existirem
      const tablesCreated = await createTablesIfNotExist();
      
      if (tablesCreated) {
        // Popula com dados padrão se necessário
        await populateDefaultData();
        return true;
      } else {
        log("Falha ao criar tabelas no Neon PostgreSQL");
        return false;
      }
    } else {
      log("Falha na conexão com o Neon PostgreSQL");
      return false;
    }
  } catch (error) {
    log(`Erro ao inicializar o banco de dados Neon: ${error}`);
    return false;
  }
}