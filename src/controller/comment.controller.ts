import {comment, Prisma, saved} from "@prisma/client";
import prisma from "../utils/client";
import {userPublicSelectData} from "./user.controller";
const commentedIncludeData = (id: string) => {
    return {
        user: {
            select: userPublicSelectData
        },
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
export const createComment = async (data: Prisma.commentUncheckedCreateInput): Promise<comment | null> => {
    let comment: any = null;
    await prisma.$transaction(async (tx) => {
        comment = await tx.comment.create({
            data: data,
            include: commentedIncludeData(data.userId),
        })
        if (comment) {
            await tx.vent.update({
                where: {
                    id: comment.ventId,
                },
                data: {
                    comments: {
                        increment: 1
                    }
                }
            })
        } else {
            throw Error("CREATE_COMMENT_FAILED")
        }
    })
    if (comment) {
        comment.user.identity = comment.identity;
        if (!comment.identity) {
            delete comment.user.fName;
            delete comment.user.lName;
            delete comment.user.image;
            delete comment.user.username;
        }
    }
    return comment;
}
export const updateComment = async (id: string, data: Prisma.commentUncheckedUpdateInput): Promise<comment> => {
    return prisma.comment.update({
        where: {
            id: id
        },
        data: data
    })
}
export const removeComment = async (id: string): Promise<comment> => {
    return prisma.comment.delete({
        where: {
            id: id
        }
    })
}
export const getComment = async (id: string): Promise<comment | null> => {
    return prisma.comment.findUnique({
        where: {
            id: id
        }
    });
}
export const getComments = async (): Promise<comment[]> => {
    return prisma.comment.findMany();
}
export const getVentComment = async (userId: string, ventId: string): Promise<comment[]> => {
    const comments: any = await prisma.comment.findMany({
        where: {
            ventId: ventId,
        },
        include: commentedIncludeData(userId),
        orderBy: {
            createdAt: 'asc',
        }
    })

    for (let comment of comments) {
        comment.user.identity = comment.identity;
        if (!comment.identity) {
            delete comment.user.fName;
            delete comment.user.lName;
            delete comment.user.image;
            delete comment.user.username;
        }
    }

    return comments;
}

export const getUserComments = async (userId: string, page: number, limit: number): Promise<comment[]> => {
    const comments: any = await prisma.comment.findMany({
        where: {
            userId: userId,
        },
        include: commentedIncludeData(userId),
        orderBy: {
            createdAt: 'desc',
        },
        skip: page * limit,
        take: limit,
    });
    for (let comment of comments) {
        comment.user.identity = comment.identity;
        if (!comment.identity) {
            delete comment.user.fName;
            delete comment.user.lName;
            delete comment.user.image;
            delete comment.user.username;
        }
    }

    return comments;
}
