'use server';
/**
 * @fileOverview Flow to answer questions based on the system manual.
 *
 * - answerQuestionFromManual - A function that takes a user's question and returns an answer based on the manual.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { manualContent } from './manual-content';

const AnswerQuestionInputSchema = z.object({
  question: z.string().describe("The user's question about the system."),
  userRole: z.enum(['Admin', 'Administrador', 'Professor', 'Secretaria']).describe("The role of the user asking the question."),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

const AnswerQuestionOutputSchema = z.string().describe("The AI-generated answer based on the manual.");

export async function answerQuestionFromManual(input: AnswerQuestionInput): Promise<string> {
  return answerQuestionFlow(input);
}

const promptTemplate = `
Você é um assistente especialista no sistema de gestão Hangout Club. Sua única fonte de conhecimento é o manual do sistema fornecido abaixo.
Sua tarefa é responder à pergunta do usuário baseando-se **exclusivamente** no conteúdo do manual e no cargo (role) do usuário que está perguntando.

**Cargo do Usuário:**
{{userRole}}

**Instruções Críticas de Permissão:**
O manual indica funcionalidades restritas usando marcações como "(Admin/Secretaria)". O cargo "Admin" e "Administrador" têm acesso a tudo.
1.  **VERIFIQUE A PERMISSÃO PRIMEIRO:** Antes de responder, verifique se a funcionalidade sobre a qual o usuário pergunta está disponível para o cargo dele.
2.  **SE NÃO TIVER PERMISSÃO:** Se a funcionalidade for restrita (ex: um 'Professor' perguntando sobre o módulo 'Financeiro' ou 'Inventário'), sua resposta DEVE ser apenas para informar educadamente que ele não tem permissão para acessar essa área. NÃO explique a funcionalidade.
3.  **SE TIVER PERMISSÃO:** Se a funcionalidade estiver disponível para o cargo do usuário, encontre a resposta no manual e responda diretamente.
4.  **SE A RESPOSTA NÃO EXISTIR:** Se a informação não estiver no manual, informe educadamente que você não encontrou a informação. No entanto, se for algo simples sobre o sistema que faça sentido mas não esteja explícito, você pode ser prestativo sem inventar.
5.  **SEJA DIRETO:** Não use saudações ou despedidas, a menos que seja para negar o acesso ou a informação. A resposta deve ser em português do Brasil.

**Manual do Sistema:**
---
{{manual}}
---

**Pergunta do Usuário:**
"{{question}}"

**Sua Resposta:**
`;

const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  inputSchema: z.object({
    question: z.string(),
    userRole: z.string(),
    manual: z.string() 
  }),
  prompt: promptTemplate,
  config: {
    temperature: 0.1, // Be more factual and stick to the instructions
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
       {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const answerQuestionFlow = ai.defineFlow(
  {
    name: 'answerQuestionFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async ({ question, userRole }) => {
    try {
      const llmResponse = await answerQuestionPrompt({ 
          question: question,
          userRole: userRole,
          manual: manualContent 
      });
      return llmResponse.text;
    } catch (error) {
      console.error('AI Error in answerQuestionFlow:', error);
      // Fallback for demonstration
      return "Desculpe, o assistente de IA está temporariamente indisponível para esta demonstração. Por favor, consulte o manual do sistema ou tente novamente mais tarde.";
    }
  }
);
