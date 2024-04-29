import prisma from "../utils/client";
import {Prisma, forgotPassword, SOLVESTATUS} from "@prisma/client";


export const createFPass = async (data: Prisma.forgotPasswordUncheckedCreateInput): Promise<forgotPassword> => {
    return prisma.forgotPassword.upsert({
        where: {
            email: data.email
        },
        update: {
            ...data,
            status: SOLVESTATUS.unsolved
        },
        create: {
            ...data,
            status: SOLVESTATUS.unsolved
        }
    });
}
export const updateFPass = async (id: string, data: Prisma.forgotPasswordUncheckedUpdateInput): Promise<forgotPassword> => {
    return prisma.forgotPassword.update({
        where: {
            id: id
        },
        data: data
    })
}
export const getFPassByEmail = async (email: string): Promise<forgotPassword | null> => {
    return prisma.forgotPassword.findUnique({
        where: {
            email: email
        }
    });
}
export const getFPass = async (id: string): Promise<forgotPassword | null> => {
    return prisma.forgotPassword.findUnique({
        where: {
            id: id
        }
    });
}