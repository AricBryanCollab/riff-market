import { Prisma } from "generated/prisma/client";

import { prisma } from "@/data/connectDb";
import { UserProfile } from "@/types/user";

const getUserProfiles = async (
  tx: Prisma.TransactionClient,
  where?: Prisma.UserWhereInput
): Promise<UserProfile[]> => {
  const users = await tx.user.findMany({
    where,
  });

  if (users.length === 0) return [];

  const userIds = users.map(u => u.id);

  const settings = await tx.userSettings.findMany({
    where: {
      userId: { in: userIds },
    },
  });

  const settingsMap = new Map(
    settings.map(s => [s.userId, s])
  );

  return users.map(user => {
    const userSettings = settingsMap.get(user.id);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      theme: userSettings?.theme ?? "light",
      phone: userSettings?.phone ?? null,
      profilePic: userSettings?.profilePic ?? null,
      address: userSettings?.address ?? null,
    };
  });
};

// Get User By ID method
export const getUserById = async (
  id: string
): Promise<UserProfile | null> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const users = await getUserProfiles(tx, { id });
      return users[0] ?? null;
    });
  } catch (err) {
    console.error("Error at getUserById", err);
    throw err;
  }
};

// Get All Users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    return await prisma.$transaction(async (tx) => {
      return getUserProfiles(tx);
    });
  } catch (err) {
    console.error("Error at getAllUsers", err);
    throw err;
  }
};

