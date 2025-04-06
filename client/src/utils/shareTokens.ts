/**
 * Utilitário para criar e verificar tokens de compartilhamento de escalas
 * 
 * Este módulo implementa funções para gerar tokens seguros para links de compartilhamento
 * e também para verificar esses tokens.
 */

// Chave secreta para codificação. Em ambiente real deveria estar em variáveis de ambiente
const SECRET_KEY = "sistemas-escalas-escolares-2024";

/**
 * Gera um token codificado para um ID de professor
 * 
 * @param professorId O ID do professor para codificar no token
 * @returns Token codificado
 */
export function generateShareToken(professorId: number): string {
  // Timestamp atual para que os tokens sejam diferentes mesmo para o mesmo professor
  const timestamp = Date.now();
  
  // Dados a serem codificados no token
  const data = {
    id: professorId,
    ts: timestamp
  };
  
  // Converter para string JSON e depois para Base64
  const jsonData = JSON.stringify(data);
  
  // Criptografia simples usando XOR com a chave secreta
  const encryptedData = encryptData(jsonData, SECRET_KEY);
  
  // Codificar para Base64 para uso em URLs
  return btoa(encryptedData);
}

/**
 * Extrai o ID do professor de um token de compartilhamento
 * 
 * @param token O token de compartilhamento
 * @returns O ID do professor, ou null se o token for inválido
 */
export function getProfessorIdFromToken(token: string): number | null {
  try {
    // Decodificar da Base64
    const encryptedData = atob(token);
    
    // Descriptografar usando a chave secreta
    const jsonData = decryptData(encryptedData, SECRET_KEY);
    
    // Converter de volta para objeto
    const data = JSON.parse(jsonData);
    
    // Verificar se o token tem a estrutura esperada
    if (typeof data !== 'object' || data === null || typeof data.id !== 'number') {
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Erro ao decodificar token de compartilhamento:", error);
    return null;
  }
}

/**
 * Função utilitária para criptografar dados usando XOR
 */
function encryptData(data: string, key: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    // XOR do caractere de dados com o caractere da chave
    const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

/**
 * Função utilitária para descriptografar dados usando XOR
 */
function decryptData(encryptedData: string, key: string): string {
  // XOR é simétrico, então a mesma função pode ser usada para criptografar e descriptografar
  return encryptData(encryptedData, key);
}