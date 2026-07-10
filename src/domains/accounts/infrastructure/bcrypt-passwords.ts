import type { AccountPasswordPort } from "@/domains/accounts/application/account-auth";
import { toHashPassword, validatePassword } from "@/utils/bcrypt";

export const bcryptAccountPasswords: AccountPasswordPort = {
	hashPassword: toHashPassword,
	verifyPassword: validatePassword,
};
