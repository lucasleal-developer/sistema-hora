import { createClient } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';

// Essas variáveis de ambiente precisarão ser configuradas na Vercel
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Verificação para garantir que as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY devem ser configuradas.');
  // Em produção, isso poderia causar uma falha de inicialização
}

// Criando o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Função para verificar a conexão com o Supabase
export async function testSupabaseConnection() {
  try {
    // Apenas verifica se pode conectar ao Supabase sem depender de tabelas
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao conectar com o Supabase:', error.message);
      return false;
    }
    
    console.log('Conexão com o Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('Exceção ao testar conexão com o Supabase:', err);
    return false;
  }
}

// Importa os tipos e valores padrão para inicialização
import { defaultActivityTypes, weekdays } from '@shared/schema';
// Não precisa mais importar o initializeDatabase

// Função para criar uma tabela diretamente no Supabase
async function createTable(tableName: string, fields: { [key: string]: any }) {
  try {
    console.log(`Criando tabela ${tableName} no Supabase...`);
    
    // Tentamos primeiro verificar se a tabela existe
    const { error } = await supabase
      .from(tableName)
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      // Se houve erro, assumimos que a tabela não existe
      // Tentamos criar uma entrada com os campos mínimos para triggerar a criação automática
      const tempRecord = { ...fields };
      
      // Para cada campo, atribuímos um valor padrão baseado no tipo/nome
      Object.keys(tempRecord).forEach(key => {
        if (key === 'id') {
          // Não inserimos ID, será gerado automaticamente 
          delete tempRecord[key];
        } else if (key.toLowerCase().includes('name') || key.includes('code') || key.includes('color')) {
          tempRecord[key] = `temp_${key}_${Date.now()}`;
        } else if (key.includes('active') || key.includes('isBaseSlot')) {
          tempRecord[key] = 1;
        } else if (key.includes('interval')) {
          tempRecord[key] = 30;
        } else if (key.includes('Time')) {
          tempRecord[key] = '00:00';
        } else if (key.includes('weekday')) {
          tempRecord[key] = 'segunda';
        } else if (key.includes('professionalId')) {
          tempRecord[key] = 1;
        } else {
          tempRecord[key] = '';
        }
      });
      
      console.log(`Tentando criar tabela ${tableName} inserindo registro temporário:`, tempRecord);
      
      try {
        // Tentativa de inserção para criar a tabela
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(tempRecord);
        
        if (insertError) {
          console.error(`Erro ao criar tabela ${tableName}:`, insertError);
          return false;
        }
        
        // Depois de criar, limpar registros temporários
        try {
          // Identificar qual campo usar para localizar o registro temporário
          let identifyField = '';
          if (tempRecord.code) identifyField = 'code';
          else if (tempRecord.name) identifyField = 'name';
          else if (tempRecord.startTime) identifyField = 'startTime';
          
          // Se tiver um campo de identificação, tenta remover o registro temporário
          if (identifyField) {
            const identifyValue = tempRecord[identifyField];
            await supabase.from(tableName).delete().eq(identifyField, identifyValue);
            console.log(`Registro temporário removido de ${tableName}`);
          }
        } catch (cleanupError) {
          console.error(`Erro ao limpar registro temporário de ${tableName}:`, cleanupError);
          // Continua mesmo com erro na limpeza
        }
        
        console.log(`Tabela ${tableName} criada com sucesso`);
        return true;
      } catch (createError) {
        console.error(`Erro ao criar tabela ${tableName}:`, createError);
        return false;
      }
    } else {
      console.log(`Tabela ${tableName} já existe`);
      return true;
    }
  } catch (error) {
    console.error(`Erro ao verificar/criar tabela ${tableName}:`, error);
    return false;
  }
}

// Função para criar tabelas diretamente no Supabase
async function createTablesDirectly() {
  try {
    console.log("Criando tabelas diretamente no Supabase...");
    
    // Definir as tabelas e seus campos
    const tables = {
      users: {
        id: 'serial',
        username: 'text',
        password: 'text'
      },
      activity_types: {
        id: 'serial',
        code: 'text',
        name: 'text',
        color: 'text'
      },
      professionals: {
        id: 'serial',
        name: 'text',
        initials: 'text',
        active: 'integer'
      },
      time_slots: {
        id: 'serial',
        startTime: 'text',
        endTime: 'text',
        interval: 'integer',
        isBaseSlot: 'integer'
      },
      schedules: {
        id: 'serial',
        professionalId: 'integer',
        weekday: 'text',
        startTime: 'text',
        endTime: 'text',
        activityCode: 'text',
        location: 'text',
        notes: 'text'
      }
    };
    
    // Criar cada tabela
    for (const [tableName, fields] of Object.entries(tables)) {
      await createTable(tableName, fields);
    }
    
    console.log("Tentativa de criação de tabelas no Supabase concluída");
    return true;
  } catch (error) {
    console.error("Erro ao criar tabelas no Supabase:", error);
    return false;
  }
}

// Função para inserir dados padrão nas tabelas
async function insertDefaultData() {
  try {
    console.log("Inserindo dados padrão nas tabelas...");
    
    // Insere tipos de atividade padrão
    for (const actType of defaultActivityTypes) {
      try {
        const { error } = await supabase
          .from('activity_types')
          .upsert({ 
            code: actType.code,
            name: actType.name,
            color: actType.color
          }, { 
            onConflict: 'code',
            ignoreDuplicates: false
          });
          
        if (error) {
          console.error(`Erro ao inserir tipo de atividade ${actType.code}:`, error);
        }
      } catch (error) {
        console.error(`Erro ao inserir tipo de atividade ${actType.code}:`, error);
      }
    }
    
    // Insere slots de tempo padrão, de 30 em 30 minutos
    const slots = [
      { startTime: '08:00', endTime: '08:30', interval: 30, isBaseSlot: 1 },
      { startTime: '08:30', endTime: '09:00', interval: 30, isBaseSlot: 1 },
      { startTime: '09:00', endTime: '09:30', interval: 30, isBaseSlot: 1 },
      { startTime: '09:30', endTime: '10:00', interval: 30, isBaseSlot: 1 },
      { startTime: '10:00', endTime: '10:30', interval: 30, isBaseSlot: 1 },
      { startTime: '10:30', endTime: '11:00', interval: 30, isBaseSlot: 1 },
      { startTime: '11:00', endTime: '11:30', interval: 30, isBaseSlot: 1 },
      { startTime: '11:30', endTime: '12:00', interval: 30, isBaseSlot: 1 },
      { startTime: '13:00', endTime: '13:30', interval: 30, isBaseSlot: 1 },
      { startTime: '13:30', endTime: '14:00', interval: 30, isBaseSlot: 1 },
      { startTime: '14:00', endTime: '14:30', interval: 30, isBaseSlot: 1 },
      { startTime: '14:30', endTime: '15:00', interval: 30, isBaseSlot: 1 },
      { startTime: '15:00', endTime: '15:30', interval: 30, isBaseSlot: 1 },
      { startTime: '15:30', endTime: '16:00', interval: 30, isBaseSlot: 1 },
      { startTime: '16:00', endTime: '16:30', interval: 30, isBaseSlot: 1 },
      { startTime: '16:30', endTime: '17:00', interval: 30, isBaseSlot: 1 },
      { startTime: '17:00', endTime: '17:30', interval: 30, isBaseSlot: 1 },
      { startTime: '17:30', endTime: '18:00', interval: 30, isBaseSlot: 1 },
      { startTime: '18:00', endTime: '18:30', interval: 30, isBaseSlot: 1 },
      { startTime: '18:30', endTime: '19:00', interval: 30, isBaseSlot: 1 }
    ];
    
    for (const slot of slots) {
      try {
        const { error } = await supabase
          .from('time_slots')
          .upsert(slot, { 
            onConflict: 'startTime,endTime',
            ignoreDuplicates: true 
          });
          
        if (error) {
          console.error(`Erro ao inserir slot de tempo ${slot.startTime}-${slot.endTime}:`, error);
        }
      } catch (error) {
        console.error(`Erro ao inserir slot de tempo ${slot.startTime}-${slot.endTime}:`, error);
      }
    }
    
    console.log("Dados padrão inseridos com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao inserir dados padrão:", error);
    return false;
  }
}

// Esta função será chamada quando o módulo for importado
export async function initSupabase() {
  console.log("Iniciando configuração do Supabase...");
  const connected = await testSupabaseConnection();
  
  if (connected) {
    try {
      // Verifica tabelas existentes no Supabase
      console.log("Verificando se as tabelas existem no Supabase...");
      
      // Verifica a tabela activity_types no Supabase
      const { data: activityTypesData, error: activityTypesError } = await supabase
        .from('activity_types')
        .select('id')
        .limit(1);
        
      if (activityTypesError) {
        console.log("Tabela 'activity_types' não encontrada, criando tabelas...");
        // Criar tabelas diretamente no Supabase
        await createTablesDirectly();
        
        // Inserir dados padrão
        console.log("Inserindo dados padrão nas tabelas...");
        await insertDefaultData();
      } else {
        console.log("Tabelas já existem no Supabase");
        
        // Verifica se há dados nos tipos de atividade
        if (!activityTypesData || activityTypesData.length === 0) {
          console.log("Tabela activity_types está vazia, inserindo dados padrão...");
          await insertDefaultData();
        } else {
          console.log(`Tabela activity_types já contém dados`);
        }
      }
      
      // Verifica time_slots
      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from('time_slots')
        .select('id')
        .limit(1);
        
      if (timeSlotsError || !timeSlotsData || timeSlotsData.length === 0) {
        console.log("Inserindo slots de tempo padrão...");
        // Insere slots de tempo padrão
        const slots = [
          { startTime: '08:00', endTime: '08:30', interval: 30, isBaseSlot: 1 },
          { startTime: '08:30', endTime: '09:00', interval: 30, isBaseSlot: 1 },
          { startTime: '09:00', endTime: '09:30', interval: 30, isBaseSlot: 1 },
          { startTime: '09:30', endTime: '10:00', interval: 30, isBaseSlot: 1 },
          { startTime: '10:00', endTime: '10:30', interval: 30, isBaseSlot: 1 },
          { startTime: '10:30', endTime: '11:00', interval: 30, isBaseSlot: 1 },
          { startTime: '11:00', endTime: '11:30', interval: 30, isBaseSlot: 1 },
          { startTime: '11:30', endTime: '12:00', interval: 30, isBaseSlot: 1 },
          { startTime: '13:00', endTime: '13:30', interval: 30, isBaseSlot: 1 },
          { startTime: '13:30', endTime: '14:00', interval: 30, isBaseSlot: 1 },
          { startTime: '14:00', endTime: '14:30', interval: 30, isBaseSlot: 1 },
          { startTime: '14:30', endTime: '15:00', interval: 30, isBaseSlot: 1 },
          { startTime: '15:00', endTime: '15:30', interval: 30, isBaseSlot: 1 },
          { startTime: '15:30', endTime: '16:00', interval: 30, isBaseSlot: 1 },
          { startTime: '16:00', endTime: '16:30', interval: 30, isBaseSlot: 1 },
          { startTime: '16:30', endTime: '17:00', interval: 30, isBaseSlot: 1 },
          { startTime: '17:00', endTime: '17:30', interval: 30, isBaseSlot: 1 },
          { startTime: '17:30', endTime: '18:00', interval: 30, isBaseSlot: 1 },
          { startTime: '18:00', endTime: '18:30', interval: 30, isBaseSlot: 1 },
          { startTime: '18:30', endTime: '19:00', interval: 30, isBaseSlot: 1 }
        ];
        
        for (const slot of slots) {
          await supabase.from('time_slots').upsert(slot, { 
            onConflict: 'startTime,endTime' 
          });
        }
      }
      
      console.log("Configuração do banco de dados Supabase concluída com sucesso");
      return true;
    } catch (err) {
      console.error("Falha na inicialização do banco de dados Supabase:", err);
      return false;
    }
  } else {
    console.error("Não foi possível inicializar o banco de dados porque a conexão com o Supabase falhou");
    return false;
  }
}