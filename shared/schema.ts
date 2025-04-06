import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define os dias da semana
export const weekdays = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
] as const;

export type WeekDay = typeof weekdays[number];

// Tipos de atividades padrão para inicialização
export const defaultActivityTypes = [
  { code: "aula", name: "Aula", color: "#3b82f6" },
  { code: "reuniao", name: "Reunião", color: "#8b5cf6" },
  { code: "plantao", name: "Plantão", color: "#22c55e" },
  { code: "estudo", name: "Estudo", color: "#eab308" },
  { code: "evento", name: "Evento", color: "#ef4444" },
  { code: "ferias", name: "Férias", color: "#06b6d4" },
  { code: "licenca", name: "Licença", color: "#64748b" },
  { code: "disponivel_horario", name: "Indisponível", color: "#6b7280" },
];

// Lista de códigos de atividades para uso nos componentes
export const activityTypes = ["aula", "reuniao", "plantao", "estudo", "evento", "ferias", "licenca", "disponivel_horario"];

// Tabela de tipos de atividades (customizável)
export const activityTypeTable = pgTable("activity_types", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const insertActivityTypeSchema = createInsertSchema(activityTypeTable).pick({
  code: true,
  name: true,
  color: true,
});

export type InsertActivityType = z.infer<typeof insertActivityTypeSchema>;
export type ActivityType = typeof activityTypeTable.$inferSelect;

// Tabela de profissionais
export const professionals = pgTable("professionals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  active: integer("active").notNull().default(1),
});

export const insertProfessionalSchema = createInsertSchema(professionals).pick({
  name: true,
  initials: true,
  active: true,
});

export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type Professional = typeof professionals.$inferSelect;

// Tabela de horários
export const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  interval: integer("interval").notNull().default(30), // Intervalo em minutos (padrão: 30 min)
  isBaseSlot: integer("is_base_slot").notNull().default(1), // 1 = slots base para a grade, 0 = slots personalizados
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).pick({
  startTime: true,
  endTime: true,
  interval: true,
  isBaseSlot: true,
});

export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;

// Tabela de atividades
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull(),
  weekday: text("weekday").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  activityCode: text("activity_code").notNull(), // código do tipo de atividade (relacionado à tabela activity_types)
  location: text("location"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  professionalId: true,
  weekday: true,
  startTime: true,
  endTime: true,
  activityCode: true,
  location: true,
  notes: true,
});

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

// Esquema de validação para o frontend
export const scheduleFormSchema = z.object({
  professionalId: z.number(),
  weekday: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  activityCode: z.string(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

// Definição para o componente de tabela de horários
export const timeSlotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(), 
  interval: z.number().default(30),
  isBaseSlot: z.number().default(1)
});

export type TimeSlotFormValues = z.infer<typeof timeSlotSchema>;

// Definição para atividades no frontend
export const activityTypeSchema = z.object({
  code: z.string().min(1, "Código da atividade é obrigatório"),
  name: z.string().min(1, "Nome da atividade é obrigatório"),
  color: z.string().regex(/^#([0-9A-F]{6})$/i, "Cor deve estar no formato hexadecimal (#RRGGBB)")
});

export type ActivityTypeFormValues = z.infer<typeof activityTypeSchema>;

// Interfaces para a exibição de dados na tabela de horários (frontend)
export interface ScheduleTimeSlot {
  startTime: string;
  endTime: string;
}

export interface ScheduleActivity {
  id: number;
  hora: string;
  horaFim: string;
  atividade: string; // Código da atividade
  local: string;
  observacoes: string;
}

export interface ScheduleProfessional {
  id: number;
  nome: string;
  iniciais: string;
  horarios: ScheduleActivity[];
}

export interface ScheduleTableData {
  dia: string;
  profissionais: ScheduleProfessional[];
}
