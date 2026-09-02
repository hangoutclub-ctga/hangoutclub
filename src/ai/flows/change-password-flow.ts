'use server';
/**
 * @fileOverview Flow to securely change a user's password.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import bcrypt from 'bcryptjs';
import { User } from '@/types';

const ChangePasswordInputSchema = z.object({
  userId: z.string(),
  currentPassword: z.string(),
  newPassword: z.string(),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;

const ChangePasswordOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ChangePasswordOutput = z.infer<typeof ChangePasswordOutputSchema>;


export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
  return changePasswordFlow(input);
}


const changePasswordFlow = ai.defineFlow(
  {
    name: 'changePasswordFlow',
    inputSchema: ChangePasswordInputSchema,
    outputSchema: ChangePasswordOutputSchema,
  },
  async ({ userId, currentPassword, newPassword }) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        return { success: false, message: 'Usuário não encontrado.' };
      }

      const foundUser = userDocSnap.data() as User;

      if (!foundUser.password) {
         return { success: false, message: 'Usuário não possui uma senha cadastrada para alteração.' };
      }

      const isMatch = await bcrypt.compare(currentPassword, foundUser.password);
      
      if (!isMatch) {
        return { success: false, message: 'Senha atual incorreta.' };
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      
      await updateDoc(userDocRef, {
        password: newHashedPassword,
      });

      return { success: true, message: 'Senha alterada com sucesso.' };

    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, message: 'Ocorreu um erro ao tentar alterar a senha.' };
    }
  }
);
