import prisma from "../utils/client";
import {Prisma, emailConfirmation, SOLVESTATUS} from "@prisma/client";


export const createEmailConf = async (data: Prisma.emailConfirmationUncheckedCreateInput): Promise<emailConfirmation> => {
    return prisma.emailConfirmation.upsert({
        where: {
            email: data.email,
        },
        update: {
            ...data,
            token: data.token,
            status: SOLVESTATUS.unsolved
        },
        create: {
            ...data,
            token: data.token,
            status: SOLVESTATUS.unsolved
        }
    });
}
export const updateEmailConf = async (id: string, data: Prisma.emailConfirmationUncheckedUpdateInput): Promise<emailConfirmation> => {
    return prisma.emailConfirmation.update({
        where: {
            id: id
        },
        data: data
    })
}
export const getEmailConfByEmail = async (email: string): Promise<emailConfirmation | null> => {
    return prisma.emailConfirmation.findUnique({
        where: {
            email: email
        }
    });
}
export const getEmailConf = async (id: string): Promise<emailConfirmation | null> => {
    return prisma.emailConfirmation.findUnique({
        where: {
            id: id
        }
    });
}