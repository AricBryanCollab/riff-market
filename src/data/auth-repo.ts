import { prisma } from "@/data/connect-db";
import { logger } from "@/lib/logger";

export const findUserById = async (id: string) => {
	try {
		const user = await prisma.user.findFirst({
			where: {
				id,
			},
		});

		return user;
	} catch (err) {
		logger.error("Error at findUserById", err);
		throw err;
	}
};
