import { findUserByEmail } from '@/data/auth';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod'

const signUpSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const signUp = createServerFn({ method: 'POST' })
  .inputValidator(signUpSchema)
  .handler(async ({ data }) => {
		const existingUser = await findUserByEmail(data.email);

    console.log(existingUser);
  })