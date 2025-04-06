import { z } from 'zod';

// Schema para validação de profissionais
export const insertProfessionalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  initials: z.string().min(1, 'Iniciais são obrigatórias'),
  active: z.boolean().optional().default(true)
});

// Schema para validação de tipos de atividade
export const insertActivityTypeSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().min(1, 'Cor é obrigatória')
});

// Schema para validação de slots de tempo
export const insertTimeSlotSchema = z.object({
  start_time: z.string().min(1, 'Horário inicial é obrigatório'),
  end_time: z.string().min(1, 'Horário final é obrigatório'),
  is_base: z.boolean().optional().default(false)
});

// Schema para validação de agendamentos
export const insertScheduleSchema = z.object({
  professional_id: z.number().int().positive('ID do profissional é obrigatório'),
  activity_type_id: z.number().int().positive('ID do tipo de atividade é obrigatório'),
  time_slot_id: z.number().int().positive('ID do horário é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  client_name: z.string().min(1, 'Nome do cliente é obrigatório'),
  client_phone: z.string().optional(),
  notes: z.string().optional()
}); 