'use server';
/**
 * @fileOverview Flow to improve communication messages.
 *
 * - improveMessage - A function that takes a draft message and returns a formalized version.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImproveMessageInputSchema = z.string().describe('The draft message to be improved.');
const ImproveMessageOutputSchema = z.string().describe('The improved, formalized message.');

export async function improveMessage(draft: string): Promise<string> {
  return improveMessageFlow(draft);
}

const promptTemplate = `
Você é uma secretária escolar especialista, habilidosa na comunicação com pais e responsáveis.
Sua tarefa é reescrever o rascunho de mensagem a seguir em um tom formal, claro e amigável, adequado para enviar ao responsável de um aluno.

- Mantenha a informação central da mensagem original.
- Corrija quaisquer erros gramaticais ou de digitação.
- Garanta que o tom seja profissional, mas acessível.
- Não adicione nenhuma informação nova.
- Mantenha placeholders como "[Nome do Evento]" ou "{student_name}" exatamente como estão.
- A saída deve ser apenas o texto final da mensagem reescrita, sem nenhuma explicação ou introdução adicional sua.
- A resposta final deve ser em português do Brasil.

Rascunho para melhorar:
"{{prompt}}"
`;


const improveMessagePrompt = ai.definePrompt({
  name: 'improveMessagePrompt',
  inputSchema: z.object({ prompt: ImproveMessageInputSchema }),
  prompt: promptTemplate,
  config: {
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

const improveMessageFlow = ai.defineFlow(
  {
    name: 'improveMessageFlow',
    inputSchema: ImproveMessageInputSchema,
    outputSchema: ImproveMessageOutputSchema,
  },
  async (prompt) => {
    try {
      const llmResponse = await improveMessagePrompt({ prompt });
      return llmResponse.text;
    } catch (error) {
      console.error('AI Error in improveMessageFlow:', error);
      // Fallback for demonstration if API key is invalid
      return prompt;
    }
  }
);
