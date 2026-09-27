export interface PermissionDefinition {
  id: string;
  label: string;
  description?: string;
  category: 'navigation' | 'academic' | 'management' | 'system';
}

export const PERMISSION_CATEGORIES: { id: PermissionDefinition['category']; label: string }[] = [
  { id: 'navigation', label: 'Navegação e Telas' },
  { id: 'academic', label: 'Alunos e Turmas' },
  { id: 'management', label: 'Financeiro e Inventário' },
  { id: 'system', label: 'Sistema e Segurança' },
];

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Navegação
  { id: 'nav:dashboard', label: 'Ver Início (Dashboard)', category: 'navigation' },
  { id: 'nav:agenda', label: 'Ver Agenda', category: 'navigation' },
  { id: 'nav:students', label: 'Ver Alunos', category: 'navigation' },
  { id: 'nav:classes', label: 'Ver Turmas', category: 'navigation' },
  { id: 'nav:grades', label: 'Ver Notas', category: 'navigation' },
  { id: 'nav:finance', label: 'Ver Financeiro', category: 'navigation' },
  { id: 'nav:inventory', label: 'Ver Inventário', category: 'navigation' },
  { id: 'nav:communication', label: 'Ver Comunicação', category: 'navigation' },
  { id: 'nav:trash', label: 'Ver Lixeira', category: 'navigation' },

  // Alunos e Turmas
  { id: 'students:create', label: 'Cadastrar Novos Alunos', category: 'academic' },
  { id: 'students:edit', label: 'Editar Alunos Cadastrados', category: 'academic' },
  { id: 'classes:create', label: 'Cadastrar Novas Turmas', category: 'academic' },
  { id: 'classes:edit', label: 'Editar Turmas Cadastradas', category: 'academic' },

  // Gestão / Finanças / Estoque
  { id: 'finance:view', label: 'Visualizar Financeiro nos Alunos', category: 'management' },
  { id: 'finance:edit', label: 'Lançar e Editar Transações/Despesas', category: 'management' },
  { id: 'inventory:edit', label: 'Cadastrar Itens e Movimentar Estoque', category: 'management' },

  // Sistema
  { id: 'permissions:edit', label: 'Gerenciar Permissões de Usuários', category: 'system' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: ALL_PERMISSIONS.map(p => p.id),
  Secretaria: [
    'nav:dashboard',
    'nav:agenda',
    'nav:students',
    'nav:classes',
    'nav:grades',
    'nav:finance',
    'nav:inventory',
    'nav:communication',
    'students:create',
    'students:edit',
    'classes:create',
    'classes:edit',
    'finance:view',
    'finance:edit',
    'inventory:edit',
  ],
  Professor: [
    'nav:dashboard',
    'nav:agenda',
    'nav:students',
    'nav:classes',
    'nav:grades',
  ],
  'Auxiliar Administrativo': [
    'nav:dashboard',
    'nav:agenda',
    'nav:students',
    'nav:classes',
    'nav:grades',
    'nav:inventory',
    'students:create',
    'classes:create',
  ],
};

export function getDefaultPermissionsForRole(role: string): string[] {
  if (role === 'Admin') return ALL_PERMISSIONS.map(p => p.id);
  if (DEFAULT_ROLE_PERMISSIONS[role]) return [...DEFAULT_ROLE_PERMISSIONS[role]];
  return [
    'nav:dashboard',
    'nav:agenda',
    'nav:students',
    'nav:classes',
    'nav:grades',
  ];
}
