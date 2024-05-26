import {saved, Prisma} from "@prisma/client";
import prisma from "../utils/client";
import {userPublicSelectData} from "./user.controller";

const savedIncludeData = (id: string) => {
    return {
        vent: {
            include: {
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
            }
        }
    }
}
export const createSaved = async (data: Prisma.savedUncheckedCreateInput): Promise<saved> => {
    return prisma.$transaction(async (tx) => {
        let saved: any = null;
        const check = await tx.saved.findFirst({
            include: savedIncludeData(data.userId),
            where: {
                ventId: data.ventId,
                userId: data.userId,
            }
        })
        if (check == null) {
            saved = await tx.saved.create({
                include: savedIncludeData(data.userId),
                data: data
            })
        } else {
            saved = await tx.saved.delete({
                include: savedIncludeData(data.userId),
                where: {
                    id: check.id
                }
            })
        }

        if (saved) {
            saved.vent.user.identity = saved.vent.identity;
            if (!saved.vent.identity) {
                delete saved.vent.user.fName;
                delete saved.vent.user.lName;
                delete saved.vent.user.image;
                delete saved.vent.user.username;
            }
        }
        return saved;
    })
}
export const updateSaved = async (id: string, data: Prisma.savedUncheckedUpdateInput): Promise<saved> => {
    return prisma.saved.update({
        where: {
            id: id
        },
        data: data
    })
}
export const removeSaved = async (id: string): Promise<saved> => {
    return prisma.saved.delete({
        where: {
            id: id
        }
    })
}
export const getSaved = async (id: string): Promise<saved | null> => {
    return prisma.saved.findUnique({
        where: {
            id: id
        }
    });
}
export const getSavedVents = async (userId: string, page: number, limit: number): Promise<saved[]> => {
    const saved:any = await  prisma.saved.findMany({
        where: {
            userId: userId,
        },
        include: savedIncludeData(userId),
        orderBy: {
            createdAt: 'desc',
        },
        skip: page * limit,
        take: limit,
    });

    for (let save of saved) {
        save.vent.user.identity = save.vent.identity;
        if (!save.vent.identity) {
            delete save.vent.user.fName;
            delete save.vent.user.lName;
            delete save.vent.user.image;
            delete save.vent.user.username;
        }
    }

    return saved;
}
export const unSaved = async (userId: string, ventId: string): Promise<saved> => {
    const saved:any = await prisma.saved.findFirst({
        include: savedIncludeData(userId),
        where: {
            userId: userId,
            ventId: ventId
        }
    });
    if (saved) {
        saved.vent.user.identity = saved.vent.identity;
        if (!saved.vent.identity) {
            delete saved.vent.user.fName;
            delete saved.vent.user.lName;
            delete saved.vent.user.image;
            delete saved.vent.user.username;
        }
        return prisma.saved.delete({
            include: savedIncludeData(userId),
            where: {
                id: saved.id
            }
        });
    }
    throw new Error("NOT_FOUND");
}