// Este é um arquivo de coletor que importa todas as rotas da API
// Ele é usado pela Vercel para identificar os endpoints da API

// Exportando as funções serverless para a Vercel
export { default as professionals } from './professionals';
export { default as activityTypes } from './activity-types';
export { default as timeSlots } from './time-slots';
export { default as schedules } from './schedules';