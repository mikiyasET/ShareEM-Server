import {like, LIKETYPE, Prisma, saved, vent} from "@prisma/client";
import prisma from "../utils/client";
import {userPublicSelectData} from "./user.controller";

const likedIncludeData = (id: string) => {
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

export const createLike = async (data: Prisma.likeUncheckedCreateInput): Promise<like | null> => {
    let like = null;
    await prisma.$transaction(async (tx) => {
        const check = await tx.like.findFirst({
            where: {
                ventId: data.ventId,
                userId: data.userId,
            }
        })
        if (check == null) {
            like = await tx.like.create({
                data: data,
                include: likedIncludeData(data.userId),
            })
        } else {
            if (check.type != data.type) {
                like = await tx.like.update({
                    where: {
                        id: check.id
                    },
                    data: {
                        type: data.type,
                    },
                    include: likedIncludeData(data.userId)
                })
            } else {
                like = await tx.like.delete({
                    where: {
                        id: check.id
                    },
                    include: likedIncludeData(data.userId)
                })
            }
        }
        if (like) {
            if (check == null) {
                if (like.type == LIKETYPE.upvote) {
                    await tx.vent.update({
                        where: {
                            id: like.ventId,
                        },
                        data: {
                            likes: {
                                increment: 1
                            }
                        }
                    })
                } else {
                    await tx.vent.update({
                        where: {
                            id: like.ventId,
                        },
                        data: {
                            dislikes: {
                                increment: 1
                            }
                        }
                    })
                }
            } else {
                if (check.type != data.type) {
                    if (check.type == LIKETYPE.upvote)
                        await tx.vent.update({
                            where: {
                                id: like.ventId,
                            },
                            data: {
                                likes: {
                                    decrement: 1
                                },
                                dislikes: {
                                    increment: 1
                                }
                            }
                        })
                    else
                        await tx.vent.update({
                            where: {
                                id: like.ventId,
                            },
                            data: {
                                likes: {
                                    increment: 1
                                },
                                dislikes: {
                                    decrement: 1
                                }
                            }
                        })
                } else {
                    if (check.type == LIKETYPE.upvote) {
                        await tx.vent.update({
                            where: {
                                id: data.ventId,
                            },
                            data: {
                                likes: {
                                    decrement: 1
                                }
                            }
                        })
                    } else {
                        await tx.vent.update({
                            where: {
                                id: data.ventId,
                            },
                            data: {
                                dislikes: {
                                    decrement: 1
                                }
                            }
                        })
                    }
                }
            }
        } else {
            throw Error("CREATE_COMMENT_FAILED")
        }
    })
    return like;
}
export const updateLike = async (id: string, data: Prisma.likeUncheckedUpdateInput): Promise<like> => {
    return prisma.like.update({
        where: {
            id: id
        },
        data: data
    })
}
export const removeLike = async (id: string): Promise<like> => {
    return prisma.like.delete({
        where: {
            id: id
        }
    })
}
export const getLike = async (id: string): Promise<like | null> => {
    return prisma.like.findUnique({
        where: {
            id: id
        }
    });
}
export const getLikes = async (): Promise<like[]> => {
    return prisma.like.findMany();
}

export const getLikedVents = async (userId: string, page: number, limit: number): Promise<like[]> => {
    return prisma.like.findMany({
        where: {
            userId: userId,
        },
        include: likedIncludeData(userId),
        orderBy: {
            createdAt: 'desc',
        },
        skip: page * limit,
        take: limit,
    });
}
function datediff(first: any, second:any) {
    return Math.round((second - first) / (1000 * 60 * 60 * 24));
}
export const getPointsVents = async (userId: string) => {
    const ventCount = await prisma.vent.count({
        where: {
            userId: userId,
        }
    });
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            createdAt: true,
        }
    });
    const userStayDate = datediff(user!.createdAt, new Date());
    return {
        vent: ventCount,
        joined: userStayDate,
    }
}
