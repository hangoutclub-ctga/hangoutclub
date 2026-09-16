-- 1. Create table for system categories (student conditions, class modalities, inventory categories)
CREATE TABLE IF NOT EXISTS system_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL, -- 'student_condition' | 'class_modality' | 'inventory_category'
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Trigger for updated_at
DROP TRIGGER IF EXISTS set_system_categories_updated_at ON system_categories;
CREATE TRIGGER set_system_categories_updated_at
    BEFORE UPDATE ON system_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Enable RLS and create open policy
ALTER TABLE system_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_categories_open_access" ON system_categories;
CREATE POLICY "system_categories_open_access" ON system_categories FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed initial default categories
INSERT INTO system_categories (id, type, name, color, description)
VALUES
    ('cond_integral', 'student_condition', 'Integral', '#3b82f6', 'Aluno com plano de período integral'),
    ('cond_bolsa', 'student_condition', 'Bolsa', '#10b981', 'Aluno bolsista com desconto institucional'),
    ('cond_desconto', 'student_condition', 'Desconto', '#f59e0b', 'Aluno com percentual de desconto comercial'),
    ('mod_regular', 'class_modality', 'Regular', '#3b82f6', 'Turma padrão com múltiplos alunos'),
    ('mod_vip', 'class_modality', 'VIP', '#8b5cf6', 'Turma individual ou atendimento exclusivo'),
    ('mod_acompanhamento', 'class_modality', 'Acompanhamento', '#10b981', 'Aulas de suporte pedagógico e reforço'),
    ('inv_didatico', 'inventory_category', 'Material Didático', '#3b82f6', 'Apostilas, livros, cadernos e materiais pedagógicos'),
    ('inv_escritorio', 'inventory_category', 'Material de Escritório', '#6366f1', 'Papelaria, impressos e suprimentos administrativos'),
    ('inv_limpeza', 'inventory_category', 'Limpeza', '#14b8a6', 'Produtos e materiais de limpeza e higiene')
ON CONFLICT (id) DO NOTHING;
