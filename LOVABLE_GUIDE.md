# Guia de Implementação e Migração para o Lovable.dev
## Sistema: Hangout Club (Gestão Escolar e de Atividades)

Este documento foi criado especificamente para que o **Lovable** consiga recriar ou importar este sistema sem erros de **404 / Not Found**, conflitos de roteamento ou dependências incompatíveis.

---

### ⚠️ Por que acontecem os erros de "Not Found" no Lovable?

1. **Next.js App Router vs Vite + React Router**:
   - Este projeto original foi estruturado em **Next.js App Router** (`src/app/dashboard/.../page.tsx`).
   - O **Lovable** utiliza **Vite + React SPA com `react-router-dom`**. Quando o Lovable recebe referências a rotas baseadas em diretórios (`src/app/...`) ou `next/navigation` (`useRouter`, `redirect`), ele se perde e gera telas 404 / Not Found.
2. **Dependências exclusivas de servidor Next.js**:
   - Pacotes como `next-auth`, `genkit` e `@ducanh2912/next-pwa` causam falhas no Vite.
   - O Lovable precisa de uma estrutura pura em React (SPA) com `localStorage` ou Supabase para persistência e `lucide-react` para ícones.

---

## 📋 PROMPT PRONTO PARA COPIAR E COLAR NO LOVABLE

Copie todo o bloco abaixo e envie como prompt inicial no Lovable:

```markdown
Crie uma aplicação completa em React + Vite + Tailwind CSS + Lucide React para o sistema "Hangout Club" (sistema de gestão escolar e de clubes).

### 1. ESTRUTURA DE ROTAS (React Router DOM)
Configure no `src/App.tsx` com `BrowserRouter`, `Routes` e `Route`:
- `/` -> Redireciona automaticamente para `/login`
- `/login` -> Tela de Login com seleção de perfil (Avatar, Nome, Cargo) e campo de senha (com botão de ver senha).
- `/dashboard` -> Dashboard principal (com resumo de agenda do dia, estatísticas e atalhos rápidos).
- `/dashboard/agenda` -> Visão semanal de compromissos com filtro por professor/staff e modal de novo evento.
- `/dashboard/students` -> Listagem e cadastro de alunos, busca, filtros por turma e modal de ficha completa do aluno.
- `/dashboard/classes` -> Gestão de turmas (nome, professor responsável, modalidade, dias/horário e alunos vinculados).
- `/dashboard/grades` -> Lançamento e histórico de notas dos alunos por semestre (1º e 2º semestre, avaliações escritas e orais).
- `/dashboard/finance` -> Fluxo financeiro (Entradas, Saídas, Despesas Fixas, cálculo de saldo e emissão/visualização de comprovantes).
- `/dashboard/inventory` -> Controle de estoque e inventário (materiais escolares, escritório, alerta de estoque baixo).
- `/dashboard/communication` -> Gerador de comunicados por turma/alunos com modelos pré-definidos e cópia de e-mails.
- `/dashboard/settings` -> Configurações de perfil do colaborador, troca de senha e gestão de permissões de acesso por perfil.
- `/dashboard/trash` -> Lixeira do sistema com visualização de itens deletados e opção de restauração.
- `*` -> Rota 404 amigável com botão para voltar ao Dashboard.

### 2. LAYOUT E NAVEGAÇÃO
- Crie um layout compartilhado para todas as rotas `/dashboard/*` contendo:
  - **Sidebar responsiva**: colapsável no mobile, com logotipo "Hangout Club", navegação para todas as seções, menu do usuário com avatar e botão de Sair (Logout).
  - **Header**: barra de busca global (atalho Cmd+K), botão de alternar tema (Dark/Light mode) e avatar do perfil conectado.
  - **Alerta de Estoque Baixo**: modal automático quando itens do inventário atingem nível crítico.

### 3. AUTENTICAÇÃO E ESTADO (Context API + localStorage)
- Implemente um `AuthContext` (`useAuth`) com persistência em `localStorage`:
  - Perfis mockados pré-configurados:
    - **Admin** (Acesso total a todas as abas e finanças)
    - **Secretaria** (Acesso a alunos, turmas, agenda e comunicação)
    - **Professor(a)** (Acesso a suas próprias turmas, alunos e notas)
  - Funções: `login(userId, password)`, `logout()`, `user`, `hasPermission(permissionName)`.
  - Senha padrão de teste para todos os perfis: `1234` ou qualquer senha preenchida.

### 4. DADOS INICIAIS MOCKADOS
Inclua um arquivo `src/lib/mock-data.ts` com dados ricos para:
- Usuários (Admin, Professores, Secretaria) com avatares.
- Alunos cadastrados com status 'Ativo', foto, turma vinculada, mensalidade e histórico de notas.
- Turmas ativas com dias da semana e horários.
- Eventos da agenda (aulas, reuniões, aniversários).
- Transações financeiras (mensalidades, contas de consumo, material) e despesas fixas.
- Itens de inventário com estoque atual e estoque mínimo.

### 5. DESIGN E ESTILO
- Tema moderno, profissional e limpo.
- Cores primárias: Azul marinho sofisticado (`#2D4562` / `slate-800`), acentos em azul vibrante / índigo (`#3B82F6`), fundo em tons neutros claros com suporte a Dark Mode.
- Componentes UI consistentes (Cards, Tables, Badges, Modals/Dialogs, Dropdowns, Tabs, Inputs, Selects).
- Totalmente responsivo para Desktop e Mobile.
```

---

## 🛠️ Mapeamento de Arquivos: Como converter Next.js para Lovable (Vite + React Router)

Se você estiver importando os arquivos manualmente ou pedindo para o Lovable ajustar arquivos específicos, siga este mapeamento:

| Arquivo Original (Next.js) | Equivalente no Lovable (Vite + React Router) |
|---|---|
| `src/app/page.tsx` | `src/pages/Index.tsx` ou redirecionamento em `src/App.tsx` para `/login` |
| `src/app/login/page.tsx` | `src/pages/Login.tsx` |
| `src/app/dashboard/layout.tsx` | `src/components/DashboardLayout.tsx` (usando `<Outlet />` do react-router-dom) |
| `src/app/dashboard/page.tsx` | `src/pages/Dashboard.tsx` |
| `src/app/dashboard/agenda/page.tsx` | `src/pages/Agenda.tsx` |
| `src/app/dashboard/students/page.tsx` | `src/pages/Students.tsx` |
| `src/app/dashboard/classes/page.tsx` | `src/pages/Classes.tsx` |
| `src/app/dashboard/grades/page.tsx` | `src/pages/Grades.tsx` |
| `src/app/dashboard/finance/page.tsx` | `src/pages/Finance.tsx` |
| `src/app/dashboard/inventory/page.tsx` | `src/pages/Inventory.tsx` |
| `src/app/dashboard/communication/page.tsx` | `src/pages/Communication.tsx` |
| `src/app/dashboard/settings/page.tsx` | `src/pages/Settings.tsx` |
| `src/app/dashboard/trash/page.tsx` | `src/pages/Trash.tsx` |

---

## 🔄 Substituições de Imports para o Lovable

Substitua estes imports do Next.js pelos equivalentes do React Router:

```typescript
// ❌ NÃO USAR NO LOVABLE (Next.js):
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// ✅ USAR NO LOVABLE (React Router):
import { useNavigate, useLocation, Link, Navigate, Outlet } from "react-router-dom";
// Para imagens: usar a tag padrão <img src="..." alt="..." className="..." />
```

---

## 📦 Configuração do `App.tsx` ideal no Lovable

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import DashboardLayout from "@/components/DashboardLayout";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import AgendaPage from "@/pages/Agenda";
import StudentsPage from "@/pages/Students";
import ClassesPage from "@/pages/Classes";
import GradesPage from "@/pages/Grades";
import FinancePage from "@/pages/Finance";
import InventoryPage from "@/pages/Inventory";
import CommunicationPage from "@/pages/Communication";
import SettingsPage from "@/pages/Settings";
import TrashPage from "@/pages/Trash";
import NotFoundPage from "@/pages/NotFound";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="hangout-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="classes" element={<ClassesPage />} />
              <Route path="grades" element={<GradesPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="communication" element={<CommunicationPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="trash" element={<TrashPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
```

---

## ✅ Checklist de Sucesso no Lovable

1. **Roteamento SPA**: Todas as rotas usam `react-router-dom` com `Navigate`, `useNavigate` e `<Outlet />`.
2. **Sem Erros 404**: A rota raiz `/` redireciona para `/login` e a rota `*` captura qualquer página desconhecida.
3. **Persistência**: `useAuth` e dados do sistema utilizam `localStorage` e o arquivo `mock-data.ts`, garantindo que o app abra imediatamente sem depender de conexões externas de banco no primeiro carregamento.
4. **Ícones e Estilos**: Todos os ícones vêm de `lucide-react` e as classes usam Tailwind CSS nativo.
