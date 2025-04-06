import { testNeonConnection } from './neondb';

async function testConnection() {
  console.log('Testando conexão com o banco de dados Neon...');
  const isConnected = await testNeonConnection();
  
  if (isConnected) {
    console.log('✅ Conexão estabelecida com sucesso!');
  } else {
    console.log('❌ Falha ao conectar com o banco de dados.');
  }
  
  process.exit(isConnected ? 0 : 1);
}

testConnection(); 