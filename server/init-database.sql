-- Criação das tabelas
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_types (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS professionals (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS time_slots (
  id SERIAL PRIMARY KEY,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  interval INTEGER NOT NULL DEFAULT 30,
  is_base_slot INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  professional_id INTEGER NOT NULL,
  weekday TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  activity_code TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserção dos tipos de atividades
INSERT INTO activity_types (code, name, color) VALUES ('aula', 'Aula', '#3b82f6');
INSERT INTO activity_types (code, name, color) VALUES ('reuniao', 'Reunião', '#8b5cf6');
INSERT INTO activity_types (code, name, color) VALUES ('plantao', 'Plantão', '#22c55e');
INSERT INTO activity_types (code, name, color) VALUES ('estudo', 'Estudo', '#eab308');
INSERT INTO activity_types (code, name, color) VALUES ('evento', 'Evento', '#ef4444');
INSERT INTO activity_types (code, name, color) VALUES ('ferias', 'Férias', '#06b6d4');
INSERT INTO activity_types (code, name, color) VALUES ('licenca', 'Licença', '#64748b');
INSERT INTO activity_types (code, name, color) VALUES ('disponivel_horario', 'Indisponível', '#6b7280');

-- Inserção dos horários padrão
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('08:00', '08:30', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('08:30', '09:00', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('09:00', '09:30', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('09:30', '10:00', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('10:00', '10:30', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('10:30', '11:00', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('11:00', '11:30', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('11:30', '12:00', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('13:00', '13:30', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('13:30', '14:00', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('14:00', '14:30', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('14:30', '15:00', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('15:00', '15:30', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('15:30', '16:00', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('16:00', '16:30', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('16:30', '17:00', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('17:00', '17:30', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('17:30', '18:00', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('18:00', '18:30', 30, 1);
INSERT INTO time_slots (start_time, end_time, interval, is_base_slot) VALUES ('18:30', '19:00', 30, 1);

-- Inserção dos professores
INSERT INTO professionals (name, initials, active) VALUES ('Prof. Paulo', 'PP', 1);
INSERT INTO professionals (name, initials, active) VALUES ('Profa. Ana Maria', 'AM', 1);
INSERT INTO professionals (name, initials, active) VALUES ('Prof. Carlos', 'CL', 1);
INSERT INTO professionals (name, initials, active) VALUES ('Prof. João', 'JM', 1);
INSERT INTO professionals (name, initials, active) VALUES ('Profa. Maria', 'MM', 1);

-- Inserção de algumas escalas de exemplo
INSERT INTO schedules (professional_id, weekday, start_time, end_time, activity_code, location, notes) 
VALUES (1, 'segunda', '08:00', '09:30', 'aula', 'Sala 101', 'Matemática');

INSERT INTO schedules (professional_id, weekday, start_time, end_time, activity_code, location, notes) 
VALUES (2, 'segunda', '08:00', '09:30', 'aula', 'Sala 203', 'Português');

INSERT INTO schedules (professional_id, weekday, start_time, end_time, activity_code, location, notes) 
VALUES (3, 'segunda', '08:00', '09:30', 'disponivel_horario', '', '');

INSERT INTO schedules (professional_id, weekday, start_time, end_time, activity_code, location, notes) 
VALUES (4, 'segunda', '08:00', '09:30', 'estudo', 'Biblioteca', 'Preparação de aulas');

INSERT INTO schedules (professional_id, weekday, start_time, end_time, activity_code, location, notes) 
VALUES (5, 'segunda', '08:00', '09:30', 'plantao', 'Sala Professores', 'Plantão de dúvidas');

INSERT INTO schedules (professional_id, weekday, start_time, end_time, activity_code, location, notes) 
VALUES (1, 'segunda', '09:45', '11:15', 'reuniao', 'Sala Reuniões', 'Reunião pedagógica'); 