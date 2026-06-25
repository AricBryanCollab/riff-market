import { Prisma, type PrismaClient } from "generated/prisma/client";
import type {
	AccountAuthError,
	AccountCredentials,
	AccountCredentialsReadPort,
	AccountRegistrationData,
	AccountRegistrationPort,
} from "@/domains/accounts/application/account-auth";
import { accountEmailTakenError } from "@/domains/accounts/application/account-auth";
import type { AccountAuthUser } from "@/domains/accounts/dto/account-auth";
import { err, ok, type Result } from "@/domains/shared/domain/result";

export class PrismaAccountAuth
	implements AccountCredentialsReadPort, AccountRegistrationPort
{
	constructor(private readonly db: PrismaClient) {}

	async findCredentialsByEmail(
		email: string,
	): Promise<AccountCredentials | null> {
		const user = await this.db.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
				role: true,
				password: true,
			},
		});

		return user
			? {
					id: user.id,
					email: user.email,
					role: user.role,
					passwordHash: user.password,
				}
			: null;
	}

	async createAccount(
		data: AccountRegistrationData,
	): Promise<Result<AccountAuthUser, AccountAuthError>> {
		try {
			const { user } = await this.db.$transaction(async (tx) => {
				const user = await tx.user.create({
					data: {
						firstName: data.firstName,
						lastName: data.lastName,
						email: data.email,
						password: data.passwordHash,
						role: data.role,
					},
				});

				const settings = await tx.userSettings.create({
					data: {
						userId: user.id,
						theme: "light",
						phone: null,
						address: null,
						profilePic: Prisma.JsonNull,
					},
				});

				return { user, settings };
			});

			return ok({
				id: user.id,
				email: user.email,
				role: user.role,
			});
		} catch (error) {
			if (isUniqueEmailConflict(error)) {
				return err(accountEmailTakenError());
			}

			throw error;
		}
	}
}

function isUniqueEmailConflict(error: unknown) {
	if (
		!(error instanceof Prisma.PrismaClientKnownRequestError) ||
		error.code !== "P2002"
	) {
		return false;
	}

	return (
		hasFieldTarget(error.meta?.target, "email") ||
		hasDriverAdapterConstraintField(error.meta?.driverAdapterError, "email")
	);
}

function hasDriverAdapterConstraintField(value: unknown, field: string) {
	if (!isRecord(value) || !isRecord(value.cause)) {
		return false;
	}

	const constraint = value.cause.constraint;

	return isRecord(constraint) && hasFieldTarget(constraint.fields, field);
}

function hasFieldTarget(value: unknown, field: string) {
	return Array.isArray(value) && value.includes(field);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
