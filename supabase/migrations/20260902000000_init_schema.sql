-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. PROFILES / USERS
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nickname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'Professor',
    permissions TEXT[] DEFAULT '{}',
    dob TEXT,
    phone TEXT,
    cellphone TEXT,
    is_provider BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. CLASSES (TURMAS)
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    teacher_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    teacher TEXT,
    modality TEXT,
    schedule TEXT,
    student_ids TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'Ativa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_classes_updated_at ON classes;
CREATE TRIGGER set_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. STUDENTS (ALUNOS)
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    avatar_url TEXT,
    dob TEXT,
    guardian_name TEXT NOT NULL,
    guardian_cpf TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cep TEXT,
    address TEXT,
    address_number TEXT,
    address_complement TEXT,
    medical_info TEXT,
    student_condition TEXT DEFAULT 'Integral',
    class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    class_name TEXT,
    payment_history JSONB DEFAULT '[]'::jsonb,
    grades JSONB DEFAULT '[]'::jsonb,
    attendance JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Ativo',
    monthly_fee NUMERIC(10,2) DEFAULT 0,
    due_date INTEGER DEFAULT 5,
    payment_status TEXT DEFAULT 'nao_pago',
    partial_amount NUMERIC(10,2),
    partial_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_students_updated_at ON students;
CREATE TRIGGER set_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. TRANSACTIONS (FINANCEIRO)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    receipt_url TEXT,
    payment_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. FIXED EXPENSES (DESPESAS FIXAS)
CREATE TABLE IF NOT EXISTS fixed_expenses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    description TEXT NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente',
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    due_date INTEGER NOT NULL,
    receipt_url TEXT,
    payment_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. INVENTORY ITEMS (ESTOQUE)
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    max_stock INTEGER NOT NULL DEFAULT 100,
    image_url TEXT,
    recent_movements INTEGER DEFAULT 0,
    movements JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER set_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. EVENTS (AGENDA / COMPROMISSOS)
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    time TEXT,
    details TEXT,
    type TEXT NOT NULL DEFAULT 'task',
    owners TEXT[] DEFAULT '{}',
    recurrent BOOLEAN DEFAULT false,
    recurrence_days TEXT[],
    completed BOOLEAN DEFAULT false,
    class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_events_updated_at ON events;
CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. COMMUNICATION TEMPLATES
CREATE TABLE IF NOT EXISTS communication_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    label TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;

-- Permissive policies for initial integration
DO $$
BEGIN
    DROP POLICY IF EXISTS "profiles_open_access" ON profiles;
    CREATE POLICY "profiles_open_access" ON profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "classes_open_access" ON classes;
    CREATE POLICY "classes_open_access" ON classes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "students_open_access" ON students;
    CREATE POLICY "students_open_access" ON students FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "transactions_open_access" ON transactions;
    CREATE POLICY "transactions_open_access" ON transactions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "fixed_expenses_open_access" ON fixed_expenses;
    CREATE POLICY "fixed_expenses_open_access" ON fixed_expenses FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "inventory_items_open_access" ON inventory_items;
    CREATE POLICY "inventory_items_open_access" ON inventory_items FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "events_open_access" ON events;
    CREATE POLICY "events_open_access" ON events FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "communication_templates_open_access" ON communication_templates;
    CREATE POLICY "communication_templates_open_access" ON communication_templates FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 12. INITIAL SEED DATA (MOCK POPULATION)

-- Seed Profiles
INSERT INTO profiles (id, nickname, email, avatar, role, permissions)
VALUES
    ('USR-001', 'Hangout', 'admin@hangout.com', 'https://picsum.photos/seed/admin/100/100', 'Admin', ARRAY['nav:dashboard', 'nav:agenda', 'nav:students', 'nav:classes', 'nav:grades', 'nav:finance', 'nav:inventory', 'nav:communication', 'nav:trash']),
    ('USR-002', 'Sidney Xisto', 'sidney@hangout.com', 'https://picsum.photos/seed/sidney/100/100', 'Professor', ARRAY[]::text[]),
    ('USR-003', 'Patricia Lara', 'patricia@hangout.com', 'https://picsum.photos/seed/patricia/100/100', 'Professor', ARRAY[]::text[]),
    ('USR-004', 'Maisa Gabriele', 'maisa@hangout.com', 'https://picsum.photos/seed/maisa/100/100', 'Professor', ARRAY[]::text[]),
    ('USR-005', 'Celia Xisto', 'celia@hangout.com', 'https://picsum.photos/seed/celia/100/100', 'Secretaria', ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

-- Seed Classes
INSERT INTO classes (id, name, teacher_id, teacher, modality, schedule, student_ids, status)
VALUES
    ('CLS-001', 'Regular - Tarde', 'USR-002', 'Sidney Xisto', 'Regular', 'seg, qua, sex - 14:00', ARRAY['STU-001', 'STU-003'], 'Ativa'),
    ('CLS-002', 'VIP - Manhã', 'USR-003', 'Patricia Lara', 'VIP', 'ter, qui, sab - 09:00', ARRAY['STU-002'], 'Ativa')
ON CONFLICT (id) DO NOTHING;

-- Seed Students
INSERT INTO students (id, name, dob, guardian_name, guardian_cpf, email, phone, address, address_number, class_name, student_condition, status, monthly_fee, due_date, attendance, grades, payment_history, documents)
VALUES
    (
        'STU-001', 
        'João Pedro Silva', 
        '2015-05-10', 
        'Maria Silva', 
        '123.456.789-00', 
        'joao.pedro.silva@exemplo.com', 
        '(11) 98888-7777', 
        'Rua das Flores', 
        '123', 
        'Regular - Tarde', 
        'Integral', 
        'Ativo', 
        450.00, 
        5, 
        '[{"date": "2023-10-01", "status": "present"}, {"date": "2023-10-03", "status": "present"}, {"date": "2023-10-05", "status": "present"}, {"date": "2023-10-08", "status": "absent"}, {"date": "2023-10-10", "status": "present"}]'::jsonb,
        '[{"subject": "Escrita 1", "periodType": "Semestre", "periodNumber": 1, "grade": 85, "evaluationDate": "2023-10-01"}, {"subject": "Oral", "periodType": "Semestre", "periodNumber": 1, "grade": 92, "evaluationDate": "2023-10-15"}]'::jsonb,
        '[{"date": "2023-08-05", "description": "Mensalidade Agosto", "amount": 450, "status": "Pago"}, {"date": "2023-09-05", "description": "Mensalidade Setembro", "amount": 450, "status": "Pago"}, {"date": "2023-10-05", "description": "Mensalidade Outubro", "amount": 450, "status": "Pago"}]'::jsonb,
        '[{"name": "Certificado de Matrícula", "type": "pdf", "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "category": "Geral"}, {"name": "Foto do RG", "type": "image", "url": "https://picsum.photos/seed/rg/400/300", "category": "Geral"}]'::jsonb
    ),
    (
        'STU-002', 
        'Ana Beatriz Rocha', 
        '2016-08-22', 
        'Carlos Rocha', 
        '234.567.890-11', 
        'ana.be.rocha@exemplo.com', 
        '(11) 97777-6666', 
        'Av. Paulista', 
        '1500', 
        'VIP - Manhã', 
        'Desconto', 
        'Ativo', 
        600.00, 
        10, 
        '[{"date": "2023-10-02", "status": "present"}, {"date": "2023-10-04", "status": "justified"}, {"date": "2023-10-06", "status": "present"}]'::jsonb,
        '[{"subject": "Escrita 1", "periodType": "Semestre", "periodNumber": 1, "grade": 78, "evaluationDate": "2023-10-02"}]'::jsonb,
        '[{"date": "2023-09-10", "description": "Mensalidade Setembro", "amount": 600, "status": "Pago"}, {"date": "2023-10-10", "description": "Mensalidade Outubro", "amount": 600, "status": "Pago"}]'::jsonb,
        '[]'::jsonb
    ),
    (
        'STU-003', 
        'Lucas Mendes', 
        '2014-12-05', 
        'Fernanda Mendes', 
        '345.678.901-22', 
        'lucas.mendes.edu@exemplo.com', 
        '(11) 96666-5555', 
        'Rua do Porto', 
        '45', 
        'Regular - Tarde', 
        'Integral', 
        'Ativo', 
        450.00, 
        5, 
        '[{"date": "2023-10-01", "status": "present"}, {"date": "2023-10-03", "status": "present"}]'::jsonb,
        '[]'::jsonb,
        '[{"date": "2023-10-05", "description": "Mensalidade Outubro", "amount": 450, "status": "Pago"}]'::jsonb,
        '[]'::jsonb
    ),
    (
        'STU-004', 
        'Mariana Costa', 
        '2017-02-14', 
        'Paulo Costa', 
        '456.789.012-33', 
        'mari.costa@exemplo.com', 
        '(11) 95555-4444', 
        'Rua das Palmeiras', 
        '88', 
        '', 
        'Integral', 
        'Ativo', 
        450.00, 
        15, 
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Transactions
INSERT INTO transactions (id, type, category, name, description, value, date)
VALUES
    ('TRX-001', 'Entrada', 'Aluno', 'João Pedro Silva', 'Mensalidade Outubro', 450.00, '2024-10-05 10:00:00+00'),
    ('TRX-002', 'Saída', 'Fornecedor', 'Papelaria ABC', 'Material de Escritório', 120.00, '2024-10-12 14:00:00+00'),
    ('TRX-003', 'Saída', 'Despesa Fixa', 'Imobiliária Regional', 'Aluguel Sede', 1500.00, '2024-10-10 09:00:00+00'),
    ('TRX-004', 'Entrada', 'Aluno', 'Ana Beatriz Rocha', 'Mensalidade Setembro', 600.00, '2024-09-10 10:00:00+00'),
    ('TRX-005', 'Saída', 'Fornecedor', 'Limpeza Total', 'Produtos de Limpeza', 85.00, '2024-09-15 16:00:00+00'),
    ('TRX-006', 'Entrada', 'Outros', 'Venda de Uniforme', 'Camiseta G', 45.00, '2024-08-20 11:00:00+00'),
    ('TRX-007', 'Saída', 'Despesa Fixa', 'CPFL', 'Energia Elétrica', 340.00, '2024-08-15 09:00:00+00'),
    ('TRX-008', 'Entrada', 'Aluno', 'Lucas Mendes', 'Mensalidade Julho', 450.00, '2024-07-05 10:00:00+00'),
    ('TRX-009', 'Entrada', 'Aluno', 'João Pedro Silva', 'Mensalidade Novembro', 450.00, '2024-11-05 10:00:00+00'),
    ('TRX-010', 'Saída', 'Fornecedor', 'Supermercado Extra', 'Copa e Cozinha', 215.00, '2024-11-10 14:00:00+00'),
    ('TRX-011', 'Entrada', 'Outros', 'Venda de Livro', 'Livro Nível 1', 120.00, '2024-12-01 09:00:00+00'),
    ('TRX-012', 'Saída', 'Despesa Fixa', 'Internet Fibra', 'Assinatura Mensal', 120.00, '2024-12-05 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- Seed Inventory Items
INSERT INTO inventory_items (id, name, category, stock, min_stock, max_stock, image_url, recent_movements, movements, status)
VALUES
    (
        'INV-001', 
        'Livro Nível 1', 
        'Material Didático', 
        15, 
        5, 
        50, 
        'https://picsum.photos/seed/book/200/200', 
        2, 
        '[{"date": "2023-10-01", "type": "entrada", "quantity": 20, "user": "Celia Xisto", "notes": "Compra fornecedor"}, {"date": "2023-10-05", "type": "saida", "quantity": 5, "user": "Sidney Xisto", "notes": "Uso Turma Regular"}]'::jsonb, 
        'Ativo'
    ),
    (
        'INV-002', 
        'Folha Sulfite A4', 
        'Material de Escritório', 
        2, 
        10, 
        100, 
        'https://picsum.photos/seed/paper/200/200', 
        0, 
        '[{"date": "2023-09-15", "type": "entrada", "quantity": 50, "user": "Celia Xisto", "notes": "Reposição mensal"}, {"date": "2023-10-10", "type": "saida", "quantity": 48, "user": "Sistema", "notes": "Consumo geral secretaria"}]'::jsonb, 
        'Ativo'
    ),
    (
        'INV-003', 
        'Detergente 500ml', 
        'Limpeza', 
        1, 
        4, 
        20, 
        'https://picsum.photos/seed/soap/200/200', 
        0, 
        '[]'::jsonb, 
        'Ativo'
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Events
INSERT INTO events (id, title, date, time, details, type, owners, recurrent, recurrence_days, completed)
VALUES
    ('EVT-001', 'Reunião de Planejamento', now(), '08:00', 'Alinhamento semanal', 'meeting', ARRAY['Hangout'], true, ARRAY['seg'], false),
    ('EVT-002', 'Aula Experimental - Maria', now(), '15:00', 'Interessada na Turma VIP', 'trial', ARRAY['Sidney Xisto'], false, NULL, false)
ON CONFLICT (id) DO NOTHING;
