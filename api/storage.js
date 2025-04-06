import { NeonStorage } from '../server/neonStorage';

// Cria uma única instância do storage para ser reutilizada
const storage = new NeonStorage();

export { storage }; 