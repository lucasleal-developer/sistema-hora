import { pool } from './db';

async function testTables() {
  try {
    console.log('Verificando as tabelas criadas...');
    
    // Testa a tabela activity_types
    const activityTypes = await pool.query('SELECT * FROM activity_types');
    console.log(`\nTipos de atividades (${activityTypes.rows.length} registros):`);
    console.table(activityTypes.rows);
    
    // Testa a tabela professionals
    const professionals = await pool.query('SELECT * FROM professionals');
    console.log(`\nProfissionais (${professionals.rows.length} registros):`);
    console.table(professionals.rows);
    
    // Testa a tabela time_slots
    const timeSlots = await pool.query('SELECT * FROM time_slots');
    console.log(`\nHorários (${timeSlots.rows.length} registros):`);
    console.table(timeSlots.rows);
    
    // Testa a tabela schedules
    const schedules = await pool.query('SELECT * FROM schedules');
    console.log(`\nAgendamentos (${schedules.rows.length} registros):`);
    console.table(schedules.rows);
    
    console.log('\n✅ Todas as tabelas foram verificadas com sucesso!');
    return true;
  } catch (error) {
    console.error(`\n❌ Erro ao verificar as tabelas: ${error}`);
    return false;
  } finally {
    await pool.end();
  }
}

// Executa o teste
testTables(); 