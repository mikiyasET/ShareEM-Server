import {vent, Prisma, tag} from "@prisma/client";
import prisma from "../utils/client";
import {userPublicSelectData} from "./user.controller";

const ventIncludeData = (id: string) => {
    return {
                user: {
                    select: userPublicSelectData
                },
                tags: {
                    select: {
                        tag_id: true,
                    },
                },
                like: {
                    where: {
                        userId: id,
                    },
                    include: {
                        user: {
                            select: userPublicSelectData
                        }
                    }
                },
                saved: {
                    where: {
                        userId: id,
                    },
                    include: {
                        user: {
                            select: userPublicSelectData
                        }
                    }
                }
            };
}
export const createVent = async (data: Prisma.ventUncheckedCreateInput, tags: any[]): Promise<vent> => {
    return prisma.vent.create({
        data: {
            ...data,
            tags: {
                create: tags.map((tag) => {
                    return {
                        tag_id: tag,
                    }
                })
            }
        },
    })
}
export const updateVent = async (id: string, data: Prisma.ventUncheckedUpdateInput): Promise<vent> => {
    return prisma.vent.update({
        where: {
            id: id
        },
        data: data
    })
}
export const removeVent = async (id: string): Promise<vent> => {
    return prisma.vent.delete({
        where: {
            id: id
        }
    })
}
export const getVent = async (id: string): Promise<vent | null> => {
    return prisma.vent.findUnique({
        where: {
            id: id
        }
    });
}
export const getVents = async (userId: string, page: number = 0, limit: number = 10): Promise<vent[]> => {
    let vents:any = await prisma.vent.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: ventIncludeData(userId),
        take: limit,
        skip: page * limit,
    });
    for (let vent of vents) {
        vent.user.identity = vent.identity;
        if (!vent.identity) {
            delete vent.user.fName;
            delete vent.user.lName;
            delete vent.user.image;
            delete vent.user.username;
        }
    }

    return vents;
}
export const getUserVents = async (userId: string, page: number = 0, limit: number = 10): Promise<vent[]> => {
    const vents:any = await prisma.vent.findMany({
        where: {
            userId: userId,
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: ventIncludeData(userId),
        take: limit,
        skip: page * limit,
    });
    for (let vent of vents) {
        vent.user.identity = vent.identity;
        if (!vent.identity) {
            delete vent.user.fName;
            delete vent.user.lName;
            delete vent.user.image;
            delete vent.user.username;
        }
    }

    return vents;
}