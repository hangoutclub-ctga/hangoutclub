-- 1. Create table for event types
CREATE TABLE IF NOT EXISTS event_types (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Trigger for updated_at
DROP TRIGGER IF EXISTS set_event_types_updated_at ON event_types;
CREATE TRIGGER set_event_types_updated_at
    BEFORE UPDATE ON event_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Enable RLS and create open policy
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_types_open_access" ON event_types;
CREATE POLICY "event_types_open_access" ON event_types FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed default event types
INSERT INTO event_types (id, name, color, description)
VALUES
    ('class', 'Aula', '#3b82f6', 'Aulas regulares ou individuais'),
    ('task', 'Tarefa', '#10b981', 'Tarefas internas e rotinas administrativas'),
    ('meeting', 'Reunião', '#8b5cf6', 'Reuniões com pais, equipe ou fornecedores'),
    ('trial', 'Aula Experimental', '#f59e0b', 'Aulas demonstrativas ou de nivelamento com novos alunos'),
    ('test', 'Prova', '#ef4444', 'Avaliações e testes de proficiência'),
    ('planning', 'Planejamento de Aula', '#6366f1', 'Horário reservado para preparo de aulas e materiais')
ON CONFLICT (id) DO NOTHING;
