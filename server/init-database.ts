import { pool } from './db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  try {
    console.log('Iniciando a criação do banco de dados...');
    
    // Lê o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'init-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Divide o conteúdo em comandos SQL individuais e remove comentários
    const commands = sqlContent
      .split(';')
      .map(cmd => {
        // Remove comentários e linhas vazias
        return cmd
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
      })
      .filter(cmd => cmd.length > 0);
    
    console.log(`Encontrados ${commands.length} comandos SQL para executar`);
    
    // Executa cada comando SQL
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      try {
        console.log(`\nExecutando comando ${i + 1}/${commands.length}:`);
        console.log(command);
        await pool.query(command);
        console.log(`✅ Comando ${i + 1}/${commands.length} executado com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao executar comando ${i + 1}/${commands.length}:`);
        console.error(error);
        throw error; // Interrompe a execução se houver erro
      }
    }
    
    console.log('\nInicialização do banco de dados concluída!');
    return true;
  } catch (error) {
    console.error(`\nErro ao inicializar o banco de dados: ${error}`);
    return false;
  } finally {
    // Fecha a conexão com o banco de dados
    await pool.end();
  }
}

// Executa a função se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then(success => {
      if (success) {
        console.log('✅ Banco de dados inicializado com sucesso!');
        process.exit(0);
      } else {
        console.log('❌ Falha ao inicializar o banco de dados.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Erro ao inicializar o banco de dados:', error);
      process.exit(1);
    });
}

export { initDatabase }; 