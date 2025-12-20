import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { createUser, findUserByEmail, findUserById } from '@/data/auth.repo';
import { toHashPassword, validatePassword } from '@/utils/bcrypt';
import { useAppSession } from '@/utils/session';

import { signUpSchema, SignUpInput, signInSchema, SignInInput } from '@/lib/zod/auth.validation';
import { SignInRequest, SignUpRequest } from '@/types/auth';


export async function signUpService(rawData: SignUpRequest) {
  const parsed = signUpSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: "Invalid sign up data",
      details: parsed.error,
    };
  }

  const data: SignUpInput = parsed.data;


  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    return { error: "User already exists" };
  }

  const hashedPassword = await toHashPassword(data.password);

  const user = await createUser({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: hashedPassword,
    role: "CUSTOMER",
  });


  const session = await useAppSession();
  await session.update({ userId: user.id });

  return {
    success: true,
    user: { id: user.id, email: user.email },
  };
}



// Sign In

export async function signInService(rawData: SignInRequest) {
    const parsed = signInSchema.safeParse(rawData);

    if(!parsed.success) {
      return {
        error: "Invalid sign in data",
        details: parsed.error
      }
    }

    const data: SignInInput = parsed.data;

    const user = await findUserByEmail(data.email)
    if(!user) {
      return { error: "Invalid email or password"}
    }

    const isValid = await validatePassword(data.password, user.password);
    if (!isValid) {
      return { error: "Invalid email or password"}  
    }

    const session = await useAppSession();
    await session.update({userId: user.id});

    return { success: true , user: { id: user.id, email: user.email}}
}

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