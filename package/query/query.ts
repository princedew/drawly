import { prisma } from "../db/lib/prisma.js";

export async function userExist(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    return user !== null;
}

export async function getUser(email: string) {
    return prisma.user.findUnique({
        where: { email },
    });
}

export async function createUser(email: string, password: string) {
    return prisma.user.create({
        data: { email, password },
    });
}