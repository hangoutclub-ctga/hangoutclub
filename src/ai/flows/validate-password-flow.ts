
'use server';
/**
 * @fileOverview Flow to validate a user's password securely on the server.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import bcrypt from 'bcryptjs';
import { User } from '@/types';

const ValidatePasswordInputSchema = z.object({
  userId: z.string(),
  passwordAttempt: z.string(),
});
export type ValidatePasswordInput = z.infer<typeof ValidatePasswordInputSchema>;

// We need to define a Zod schema for the User type, but without the password for security.
const UserSchemaForOutput = z.object({
  id: z.string(),
  nickname: z.string(),
  email: z.string(),
  avatar: z.string(),
  role: z.string(),
  permissions: z.array(z.string()).optional(),
  dob: z.string().optional(),
});


const ValidatePasswordOutputSchema = z.object({
  success: z.boolean(),
  user: UserSchemaForOutput.optional(),
});
export type ValidatePasswordOutput = z.infer<typeof ValidatePasswordOutputSchema>;


export async function validatePassword(input: ValidatePasswordInput): Promise<ValidatePasswordOutput> {
  return validatePasswordFlow(input);
}


const validatePasswordFlow = ai.defineFlow(
  {
    name: 'validatePasswordFlow',
    inputSchema: ValidatePasswordInputSchema,
    outputSchema: ValidatePasswordOutputSchema,
  },
  async ({ userId, passwordAttempt }) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const foundUser = userDocSnap.data() as User;
        if (foundUser.password) {
          const isMatch = await bcrypt.compare(passwordAttempt, foundUser.password);
          if (isMatch) {
            // Omit password from the returned user object
            const { password, ...userToReturn } = foundUser;
            return { success: true, user: userToReturn };
          }
        }
      }
      return { success: false };
    } catch (error) {
      console.error('Password validation error:', error);
      return { success: false };
    }
  }
);
