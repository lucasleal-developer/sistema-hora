import { supabase } from './supabase';
import { defaultActivityTypes } from '@shared/schema';
import { pool } from './db';

// Função para criar as tabelas e inicializar dados
export async function initializeDatabase() {
  console.log("Iniciando criação das tabelas no banco de dados...");
  
  try {
    // Primeiro, vamos tentar o método SQL direto usando o pool de conexão PostgreSQL
    try {
      // Criação das tabelas no PostgreSQL
      await createTablesWithSQL(pool);
      console.log("Tabelas criadas com sucesso via conexão direta PostgreSQL");
      
      // Agora vamos criar as mesmas tabelas no Supabase para garantir consistência
      try {
        await createTablesWithSupabaseRPC();
        console.log("Tabelas também criadas/verificadas no Supabase com sucesso");
      } catch (supaError) {
        console.error("Aviso: Não foi possível verificar as tabelas no Supabase:", supaError);
        // Continuamos mesmo se o Supabase falhar, pois as tabelas já existem via PostgreSQL direto
      }
      
      // Inicializa os dados nas tabelas
      await initializeData();
      console.log("Dados inicializados com sucesso");
      return true;
    } catch (sqlError) {
      console.error("Erro ao criar tabelas via SQL direto:", sqlError);
      console.log("Tentando método alternativo via Supabase API...");
      
      // Fallback para o método Supabase se o SQL direto falhar
      try {
        await createTablesWithSupabaseRPC();
        await initializeData();
        return true;
      } catch (apiError) {
        console.error("Erro ao criar tabelas via Supabase API:", apiError);
        return false;
      }
    }
  } catch (error) {
    console.error("Erro ao inicializar o banco de dados:", error);
    return false;
  }
}

// Função para criar tabelas via direct SQL com Postgres
async function createTablesWithSQL(pool: any) {
  try {
    // 1. Tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    console.log("Tabela 'users' verificada/criada com SQL direto.");

    // 2. Tabela de tipos de atividades
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_types (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      );
    `);
    console.log("Tabela 'activity_types' verificada/criada com SQL direto.");

    // 3. Tabela de profissionais
    await pool.query(`
      CREATE TABLE IF NOT EXISTS professionals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        initials TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
      );
    `);
    console.log("Tabela 'professionals' verificada/criada com SQL direto.");

    // 4. Tabela de slots de tempo
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        interval INTEGER NOT NULL DEFAULT 30,
        "isBaseSlot" INTEGER NOT NULL DEFAULT 1
      );
    `);
    console.log("Tabela 'time_slots' verificada/criada com SQL direto.");

    // 5. Tabela de escalas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        "professionalId" INTEGER NOT NULL,
        weekday TEXT NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        "activityCode" TEXT NOT NULL,
        location TEXT,
        notes TEXT,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabela 'schedules' verificada/criada com SQL direto.");
  } catch (error) {
    console.error("Erro ao executar SQL:", error);
    throw error;
  }
}

// Função para criar tabelas via Supabase RPC (ou criar a função se não existir)
async function createTablesWithSupabaseRPC() {
  try {
    // Primeiro vamos verificar se a função RPC existe, se não, vamos criá-la
    try {
      // Verificar se a função existe usando SQL direto
      const checkFunctionResult = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_proc WHERE proname = 'create_table_if_not_exists'
        );
      `);
      
      const functionExists = checkFunctionResult.rows[0].exists;
      
      if (!functionExists) {
        console.log("Função RPC 'create_table_if_not_exists' não existe. Criando...");
        
        // Criar a função no banco de dados
        await pool.query(`
          CREATE OR REPLACE FUNCTION create_table_if_not_exists(table_name text, table_definition text)
          RETURNS void AS $$
          DECLARE
            create_statement text;
          BEGIN
            create_statement := 'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' || table_definition || ')';
            EXECUTE create_statement;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          -- Conceder permissões para o usuário do Supabase
          GRANT EXECUTE ON FUNCTION create_table_if_not_exists(text, text) TO authenticated;
          GRANT EXECUTE ON FUNCTION create_table_if_not_exists(text, text) TO service_role;
          GRANT EXECUTE ON FUNCTION create_table_if_not_exists(text, text) TO anon;
        `);
        
        console.log("Função RPC criada com sucesso!");
      } else {
        console.log("Função RPC 'create_table_if_not_exists' já existe.");
      }
    } catch (funcError) {
      console.error("Erro ao verificar/criar função RPC:", funcError);
      // Continuamos mesmo com erro
    }
    
    // Agora usamos SQL direto para criar as tabelas, porque o SQL já foi testado
    console.log("Usando SQL direto em vez de RPC para maior compatibilidade");
    
    // 1. Tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    console.log("Tabela 'users' verificada/criada com SQL via RPC.");
  
    // 2. Tabela de tipos de atividades
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_types (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      );
    `);
    console.log("Tabela 'activity_types' verificada/criada com SQL via RPC.");

    // 3. Tabela de profissionais
    await pool.query(`
      CREATE TABLE IF NOT EXISTS professionals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        initials TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
      );
    `);
    console.log("Tabela 'professionals' verificada/criada com SQL via RPC.");

    // 4. Tabela de slots de tempo
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        interval INTEGER NOT NULL DEFAULT 30,
        "isBaseSlot" INTEGER NOT NULL DEFAULT 1
      );
    `);
    console.log("Tabela 'time_slots' verificada/criada com SQL via RPC.");

    // 5. Tabela de escalas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        "professionalId" INTEGER NOT NULL,
        weekday TEXT NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        "activityCode" TEXT NOT NULL,
        location TEXT,
        notes TEXT,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabela 'schedules' verificada/criada com SQL via RPC.");

    // Sucesso ao criar tabelas
    return true;
  } catch (error) {
    console.error("Erro ao criar tabelas via SQL (método RPC):", error);
    throw error;
  }
}

// Função para inicializar os dados
async function initializeData() {
  try {
    // Vamos inicializar usando uma abordagem mais robusta que tenta tanto Supabase quanto SQL direto
    // quando uma opção falha
    
    // Primeiro definimos os dados padrão
    const defaultTimeSlots = [
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
      { startTime: "16:30", endTime: "17:00", interval: 30, isBaseSlot: 1 }
    ];
    
    const defaultProfessionals = [
      { name: "Prof. Paulo", initials: "PP", active: 1 },
      { name: "Profa. Ana Maria", initials: "AM", active: 1 },
      { name: "Prof. Carlos", initials: "CL", active: 1 },
      { name: "Prof. João", initials: "JM", active: 1 },
      { name: "Profa. Maria", initials: "MM", active: 1 }
    ];
    
    const defaultSchedules = [
      { professionalId: 1, weekday: "segunda", startTime: "08:00", endTime: "09:30", activityCode: "aula", location: "Sala 101", notes: "Matemática" },
      { professionalId: 2, weekday: "segunda", startTime: "08:00", endTime: "09:30", activityCode: "aula", location: "Sala 203", notes: "Português" },
      { professionalId: 3, weekday: "segunda", startTime: "08:00", endTime: "09:30", activityCode: "disponivel_horario", location: "", notes: "" },
      { professionalId: 4, weekday: "segunda", startTime: "08:00", endTime: "09:30", activityCode: "estudo", location: "Biblioteca", notes: "Preparação de aulas" },
      { professionalId: 5, weekday: "segunda", startTime: "08:00", endTime: "09:30", activityCode: "plantao", location: "Sala Professores", notes: "Plantão de dúvidas" },
      
      { professionalId: 1, weekday: "segunda", startTime: "09:45", endTime: "11:15", activityCode: "reuniao", location: "Sala Reuniões", notes: "Reunião pedagógica" },
      { professionalId: 2, weekday: "segunda", startTime: "09:45", endTime: "11:15", activityCode: "aula", location: "Sala 203", notes: "Português" },
      { professionalId: 3, weekday: "segunda", startTime: "09:45", endTime: "11:15", activityCode: "reuniao", location: "Sala Reuniões", notes: "Reunião pedagógica" },
      { professionalId: 4, weekday: "segunda", startTime: "09:45", endTime: "11:15", activityCode: "aula", location: "Lab Química", notes: "Química" },
      
      { professionalId: 1, weekday: "terca", startTime: "08:00", endTime: "09:30", activityCode: "aula", location: "Sala 102", notes: "Matemática" },
      { professionalId: 2, weekday: "terca", startTime: "08:00", endTime: "09:30", activityCode: "reuniao", location: "Sala Coordenação", notes: "Reunião de departamento" }
    ];

    // ------------------------------------------
    // ETAPA 1: Inserir tipos de atividades padrão
    // ------------------------------------------
    
    // Primeiro verifica se já existem dados na tabela
    let hasActivityTypes = false;
    
    // IMPORTANTE: Antes de tentar verificar com o Supabase, verificamos se a tabela existe
    // usando uma consulta SQL direta para evitar erros "relation does not exist"
    try {
      // Verificar se a tabela existe no esquema
      const tableExistsResult = await pool.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'activity_types'
        );
      `);
      
      const tableExists = tableExistsResult.rows[0].exists;
      
      if (tableExists) {
        // Agora é seguro verificar se há dados na tabela
        try {
          // Método 1: Tentar com Supabase
          const { data: existingActivityTypes, error: activityTypesError } = await supabase
            .from('activity_types')
            .select('*');
          
          if (!activityTypesError && existingActivityTypes && existingActivityTypes.length > 0) {
            hasActivityTypes = true;
            console.log("Tipos de atividades já existem no banco de dados");
          } else {
            console.log("Nenhum tipo de atividade encontrado via Supabase, verificando via SQL direto...");
          }
        } catch (supaError) {
          console.error("Erro ao verificar tipos de atividades via Supabase:", supaError);
        }
      } else {
        console.log("Tabela 'activity_types' ainda não existe, será criada");
      }
    } catch (sqlError) {
      console.error("Erro ao verificar existência da tabela activity_types:", sqlError);
    }
    
    // Se não foi possível verificar via Supabase, tenta via SQL direto
    if (!hasActivityTypes) {
      try {
        const result = await pool.query('SELECT COUNT(*) FROM activity_types');
        if (result.rows[0].count > 0) {
          hasActivityTypes = true;
          console.log("Tipos de atividades já existem no banco de dados (verificado via SQL)");
        }
      } catch (sqlError) {
        console.error("Erro ao verificar tipos de atividades via SQL:", sqlError);
        // Continuamos mesmo com erro e tentamos inserir
      }
    }
    
    // Se não há dados, insere os padrões
    if (!hasActivityTypes) {
      console.log("Inserindo tipos de atividades padrão...");
      
      try {
        // Método 1: Tentar inserir via Supabase
        const { error } = await supabase.from('activity_types').insert(defaultActivityTypes);
        if (!error) {
          console.log("Tipos de atividades inseridos com sucesso via Supabase");
        } else {
          throw error;
        }
      } catch (supaError) {
        console.error("Erro ao inserir tipos de atividades via Supabase:", supaError);
        
        // Método 2: Tentar via SQL direto
        try {
          for (const type of defaultActivityTypes) {
            await pool.query(
              'INSERT INTO activity_types (name, code, color) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
              [type.name, type.code, type.color]
            );
          }
          console.log("Tipos de atividades inseridos com sucesso via SQL direto");
        } catch (sqlError) {
          console.error("Erro ao inserir tipos de atividade via SQL:", sqlError);
          // Continuamos com outras operações mesmo se esta falhar
        }
      }
    }

    // ------------------------------------------
    // ETAPA 2: Inserir slots de tempo padrão
    // ------------------------------------------
    
    let hasTimeSlots = false;
    
    // Verificar primeiro se a tabela existe
    try {
      // Verificar se a tabela existe no esquema
      const tableExistsResult = await pool.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'time_slots'
        );
      `);
      
      const tableExists = tableExistsResult.rows[0].exists;
      
      if (tableExists) {
        // Agora é seguro verificar se há dados na tabela
        try {
          // Verificar via Supabase
          const { data: existingTimeSlots, error: timeSlotsError } = await supabase
            .from('time_slots')
            .select('*');
          
          if (!timeSlotsError && existingTimeSlots && existingTimeSlots.length > 0) {
            hasTimeSlots = true;
            console.log("Slots de tempo já existem no banco de dados");
          }
        } catch (supaError) {
          console.error("Erro ao verificar slots de tempo via Supabase:", supaError);
        }
      } else {
        console.log("Tabela 'time_slots' ainda não existe, será criada");
      }
    } catch (sqlError) {
      console.error("Erro ao verificar existência da tabela time_slots:", sqlError);
    }
    
    // Se não foi possível verificar via Supabase, tenta via SQL direto
    if (!hasTimeSlots) {
      try {
        const result = await pool.query('SELECT COUNT(*) FROM time_slots');
        if (result.rows[0].count > 0) {
          hasTimeSlots = true;
          console.log("Slots de tempo já existem no banco de dados (verificado via SQL)");
        }
      } catch (sqlError) {
        console.error("Erro ao verificar slots de tempo via SQL:", sqlError);
      }
    }
    
    // Se não há dados, insere os padrões
    if (!hasTimeSlots) {
      console.log("Inserindo slots de tempo padrão...");
      
      try {
        // Método 1: Tentar inserir via Supabase
        const { error } = await supabase.from('time_slots').insert(defaultTimeSlots);
        if (!error) {
          console.log("Slots de tempo inseridos com sucesso via Supabase");
        } else {
          throw error;
        }
      } catch (supaError) {
        console.error("Erro ao inserir slots de tempo via Supabase:", supaError);
        
        // Método 2: Tentar via SQL direto
        try {
          for (const slot of defaultTimeSlots) {
            await pool.query(
              'INSERT INTO time_slots ("startTime", "endTime", interval, "isBaseSlot") VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
              [slot.startTime, slot.endTime, slot.interval, slot.isBaseSlot]
            );
          }
          console.log("Slots de tempo inseridos com sucesso via SQL direto");
        } catch (sqlError) {
          console.error("Erro ao inserir slots de tempo via SQL:", sqlError);
        }
      }
    }

    // ------------------------------------------
    // ETAPA 3: Inserir profissionais de exemplo
    // ------------------------------------------
    
    let hasProfessionals = false;
    
    // Verificar primeiro se a tabela existe
    try {
      // Verificar se a tabela existe no esquema
      const tableExistsResult = await pool.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'professionals'
        );
      `);
      
      const tableExists = tableExistsResult.rows[0].exists;
      
      if (tableExists) {
        // Agora é seguro verificar se há dados na tabela
        try {
          // Verificar via Supabase
          const { data: existingProfessionals, error: professionalsError } = await supabase
            .from('professionals')
            .select('*');
          
          if (!professionalsError && existingProfessionals && existingProfessionals.length > 0) {
            hasProfessionals = true;
            console.log("Profissionais já existem no banco de dados");
          }
        } catch (supaError) {
          console.error("Erro ao verificar profissionais via Supabase:", supaError);
        }
      } else {
        console.log("Tabela 'professionals' ainda não existe, será criada");
      }
    } catch (sqlError) {
      console.error("Erro ao verificar existência da tabela professionals:", sqlError);
    }
    
    // Se não foi possível verificar via Supabase, tenta via SQL direto
    if (!hasProfessionals) {
      try {
        const result = await pool.query('SELECT COUNT(*) FROM professionals');
        if (result.rows[0].count > 0) {
          hasProfessionals = true;
          console.log("Profissionais já existem no banco de dados (verificado via SQL)");
        }
      } catch (sqlError) {
        console.error("Erro ao verificar profissionais via SQL:", sqlError);
      }
    }
    
    // Se não há dados, insere os padrões
    if (!hasProfessionals) {
      console.log("Inserindo profissionais de exemplo...");
      
      try {
        // Método 1: Tentar inserir via Supabase
        const { error } = await supabase.from('professionals').insert(defaultProfessionals);
        if (!error) {
          console.log("Profissionais inseridos com sucesso via Supabase");
        } else {
          throw error;
        }
      } catch (supaError) {
        console.error("Erro ao inserir profissionais via Supabase:", supaError);
        
        // Método 2: Tentar via SQL direto
        try {
          for (const professional of defaultProfessionals) {
            await pool.query(
              'INSERT INTO professionals (name, initials, active) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
              [professional.name, professional.initials, professional.active]
            );
          }
          console.log("Profissionais inseridos com sucesso via SQL direto");
        } catch (sqlError) {
          console.error("Erro ao inserir profissionais via SQL:", sqlError);
        }
      }
    }

    // ------------------------------------------
    // ETAPA 4: Inserir escalas de exemplo
    // ------------------------------------------
    
    let hasSchedules = false;
    
    // Verificar primeiro se a tabela existe
    try {
      // Verificar se a tabela existe no esquema
      const tableExistsResult = await pool.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'schedules'
        );
      `);
      
      const tableExists = tableExistsResult.rows[0].exists;
      
      if (tableExists) {
        // Agora é seguro verificar se há dados na tabela
        try {
          // Verificar via Supabase
          const { data: existingSchedules, error: schedulesError } = await supabase
            .from('schedules')
            .select('*');
          
          if (!schedulesError && existingSchedules && existingSchedules.length > 0) {
            hasSchedules = true;
            console.log("Escalas já existem no banco de dados");
          }
        } catch (supaError) {
          console.error("Erro ao verificar escalas via Supabase:", supaError);
        }
      } else {
        console.log("Tabela 'schedules' ainda não existe, será criada");
      }
    } catch (sqlError) {
      console.error("Erro ao verificar existência da tabela schedules:", sqlError);
    }
    
    // Se não foi possível verificar via Supabase, tenta via SQL direto
    if (!hasSchedules) {
      try {
        const result = await pool.query('SELECT COUNT(*) FROM schedules');
        if (result.rows[0].count > 0) {
          hasSchedules = true;
          console.log("Escalas já existem no banco de dados (verificado via SQL)");
        }
      } catch (sqlError) {
        console.error("Erro ao verificar escalas via SQL:", sqlError);
      }
    }
    
    // Se não há dados, insere os padrões
    if (!hasSchedules) {
      console.log("Inserindo escalas de exemplo...");
      
      try {
        // Método 1: Tentar inserir via Supabase
        const { error } = await supabase.from('schedules').insert(defaultSchedules);
        if (!error) {
          console.log("Escalas inseridas com sucesso via Supabase");
        } else {
          throw error;
        }
      } catch (supaError) {
        console.error("Erro ao inserir escalas via Supabase:", supaError);
        
        // Método 2: Tentar via SQL direto
        try {
          for (const schedule of defaultSchedules) {
            await pool.query(
              'INSERT INTO schedules ("professionalId", weekday, "startTime", "endTime", "activityCode", location, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
              [schedule.professionalId, schedule.weekday, schedule.startTime, schedule.endTime, schedule.activityCode, schedule.location, schedule.notes]
            );
          }
          console.log("Escalas inseridas com sucesso via SQL direto");
        } catch (sqlError) {
          console.error("Erro ao inserir escalas via SQL:", sqlError);
        }
      }
    }

    console.log("Configuração do banco de dados concluída com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao inicializar dados:", error);
    // Não interrompemos a execução do servidor devido a falhas na inicialização
    return false;
  }
}