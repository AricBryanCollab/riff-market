import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod'

import { createUser, findUserByEmail, findUserById } from '@/data/auth';
import { toHashPassword, validatePassword } from '@/utils/bcrypt';
import { useAppSession } from '@/utils/session';


// Sign Up
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

    if (existingUser) {
      return { error:  "User already exists"}
    }

    const hashedPassword = await toHashPassword(data.password);

    const user = await createUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        role: "CUSTOMER"
    })

    const session = await useAppSession();
    await session.update({userId: user.id});

    return { success: true, user: { id: user.id, email: user.email }}
  })

// Sign In
const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export const signIn = createServerFn({ method: 'POST' })
  .inputValidator(signInSchema)
  .handler(async ({ data }) => {
    const user = await findUserByEmail(data.email)
    if (!user) {
      return { error: "Invalid email or password" }
    }
    const isValid = await validatePassword(data.password, user.password)
    if (!isValid) {
      return { error: "Invalid email or password" }
    }
    const session = await useAppSession();
    await session.update({ userId: user.id });
    return { success: true, user: { id: user.id, email: user.email } }
  })

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      return null
    }

    return await findUserById(userId)
  },
)

export const signOut = createServerFn({method:"POST"})
  .handler( async () => {
    const session = await useAppSession();
    await session.clear();

    throw redirect({to: "/"})
  })