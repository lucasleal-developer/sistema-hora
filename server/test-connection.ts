import { testConnection } from './db';

async function main() {
  console.log('Testando conexão com o banco de dados...');
  const success = await testConnection();
  
  if (success) {
    console.log('✅ Teste de conexão concluído com sucesso!');
    process.exit(0);
  } else {
    console.error('❌ Teste de conexão falhou!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Erro inesperado:', error);
  process.exit(1);
}); 