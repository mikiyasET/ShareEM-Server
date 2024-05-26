import prisma from "../utils/client";
import {Prisma, user} from "@prisma/client";
import {USERDATA} from "../types/model.types";

const userSelectData = {
    id: true,
    fName: true,
    lName: true,
    username: true,
    email: true,
    gender: true,
    feeling: true,
    birthDate: true,
    image: true,
    identity: true,
    status: true,
    createdAt: true,
    updatedAt: true,
};
export const userPublicSelectData = {
    id: true,
    fName: true,
    lName: true,
    image: true,
    username: true,
    hiddenName: true,
    identity: true,
    tracker: true,
};
export const createUser = async (data: Prisma.userUncheckedCreateInput): Promise<USERDATA> => {
    return prisma.user.create({
        select: userSelectData,
        data: data
    });
}
export const updateUser = async (id: string, data: Prisma.userUncheckedUpdateInput): Promise<USERDATA> => {
    return prisma.user.update({
        select: userSelectData,
        where: {
            id: id
        },
        data: data
    })
}
export const getUserByEmail = async (email: string): Promise<USERDATA | null> => {
    return prisma.user.findUnique({
        select: userSelectData,
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
        select: userSelectData,
        where: {
            username: username
        }
    });
}
export const getUser = async (id: string): Promise<USERDATA | null> => {
    return prisma.user.findUnique({
        select: userSelectData,
        where: {
            id: id
        }
    });
}
export const getUserProtected = async (id: string): Promise<user | null> => {
    return prisma.user.findUnique({
        where: {
            id: id
        }
    });
}
export const getUserByIDUsername = async (id: string, username: string): Promise<USERDATA | null> => {
    return prisma.user.findUnique({
        select: userSelectData,
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

export const getUserProfile = async (userId: string) => {
    const user: any = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            fName: true,
            lName: true,
            username: true,
            image: true,
            tracker: true
        }
    })
    if (user && user.tracker != null) {
        const check1 = user.tracker!.isOnline;
        const check2 = (user.tracker!.updatedAt.getTime()) < (new Date().getTime() - 300000);
        if (check1 && check2) {
            user.tracker.isOnline = true;
        } else {
            user.tracker.isOnline = false;
        }
        delete user.tracker;
    }

    return user;
}