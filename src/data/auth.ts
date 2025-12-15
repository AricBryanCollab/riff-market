import { prisma } from  "@/data/connectDb";
import { User } from "generated/prisma/client";

export const findUserByEmail = async (email: string) => {
	try {
		const user = await prisma.user.findFirst({
			where: {
				email
			}
		})
		return user;
	}catch(err) {
		console.error("Error at findUserByEmail",err)
		throw err;
	}
};

export const findUserById = async (id: string) => {
	try{
		const user = await prisma.user.findFirst({
			where: {
					id
			}
		});

		return user;
	} catch(err) {
		console.error("Error at findUserById", err)
		throw err;
	}
}

export const createUser = async (user: User) => {
	try{
		const newUser = await prisma.user.create({
			data: {
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				password: user.password,
				role: user.role
			}
		});

		return newUser;
	}catch(err) {
		console.error("Error at createUser", err);
		throw err;
	}
};