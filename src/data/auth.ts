import { prisma } from  "@/data/connectDb";

export const findUserByEmail = async (email: string) => {
	try {
		const user = await prisma.user.findFirst({
			where: {
				email
			}
		})
		return user;
	}catch(err) {
		console.error(err)
		throw err;
	}
}