import { pool } from './db';

async function testQuery() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM activity_types');
    console.log('Número de tipos de atividades:', result.rows[0].count);
    return true;
  } catch (error) {
    console.error('Erro:', error);
    return false;
  } finally {
    await pool.end();
  }
}

testQuery(); 