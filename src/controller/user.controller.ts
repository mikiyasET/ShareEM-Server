import prisma from "../utils/client";
import {Prisma, user} from "@prisma/client";
import {USERDATA} from "../types/model.types";


export const createUser = async (data: Prisma.userUncheckedCreateInput): Promise<USERDATA> => {
    return prisma.user.create({
        select: {
            id: true,
            fName: true,
            lName: true,
            username: true,
            email: true,
            birthDate: true,
            gender: true,
            status: true,
            feeling: true,
            image: true,
            createdAt: true,
            updatedAt: true,
        },
        data: data
    });
}
export const updateUser = async (id: string, data: Prisma.userUncheckedUpdateInput): Promise<USERDATA> => {
    return prisma.user.update({
        select: {
            id: true,
            fName: true,
            lName: true,
            username: true,
            email: true,
            birthDate: true,
            gender: true,
            status: true,
            feeling: true,
            image: true,
            createdAt: true,
            updatedAt: true,
        },
        where: {
            id: id
        },
        data: data
    })
}

export const getUserByEmail = async (email: string): Promise<USERDATA | null> => {
    return prisma.user.findUnique({
        select: {
            id: true,
            fName: true,
            lName: true,
            username: true,
            email: true,
            birthDate: true,
            gender: true,
            status: true,
            feeling: true,
            image: true,
            createdAt: true,
            updatedAt: true,
        },
        where: {
            email: email
        }
    });
}
export const getUserByEmailP = async (email: string): Promise<user | null> => {
    return prisma.user.findUnique({
        where: {
            email: email
        }
    });
}
export const getUserByUsername = async (username: string): Promise<USERDATA | null> => {
    return prisma.user.findUnique({
        select: {
            id: true,
            fName: true,
            lName: true,
            username: true,
            email: true,
            birthDate: true,
            gender: true,
            status: true,
            feeling: true,
            image: true,
            createdAt: true,
            updatedAt: true,
        },
        where: {
            username: username
        }
    });
}
export const getUser = async (id: string): Promise<USERDATA | null> => {
    return prisma.user.findUnique({
        select: {
            id: true,
            fName: true,
            lName: true,
            username: true,
            email: true,
            birthDate: true,
            gender: true,
            status: true,
            feeling: true,
            image: true,
            createdAt: true,
            updatedAt: true,
        },
        where: {
            id: id
        }
    });
}
export const getUserByIDUsername = async (id: string, username: string): Promise<USERDATA | null> => {
    return prisma.user.findUnique({
        select: {
            id: true,
            fName: true,
            lName: true,
            username: true,
            email: true,
            birthDate: true,
            gender: true,
            status: true,
            feeling: true,
            image: true,
            createdAt: true,
            updatedAt: true,
        },
        where: {
            id: id,
            username: username
        }
    });
}


export const checkUserEmail = async (email: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    });
    return !!user;
}
export const checkUserUsername = async (username: string, self: string | null = null): Promise<boolean> => {
    if (self == null) {
        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        });
        return !!user;
    } else {
        const user = await prisma.user.findUnique({
            where: {
                username: username,
                NOT: {
                    id: self
                }
            }
        });
        return !!user;
    }
}
