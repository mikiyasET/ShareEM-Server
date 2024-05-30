import {chatRoom, CHATSTATUS, Prisma} from "@prisma/client";
import prisma from "../utils/client";

export const chatSelectData = {
    id: true,
    fName: true,
    lName: true,
    image: true,
    username: true,
    tracker: true,
};
const chatRoomInclude = {
    user1: {
        select: chatSelectData,
    },
    user2: {
        select: chatSelectData,
    },
};
export const createChatRoom = async (data: Prisma.chatRoomUncheckedCreateInput): Promise<chatRoom | null> => {
    try {
        if (data.user1Id !== data.user2Id) {
            return prisma.$transaction(async (tx) => {
                const checkUser = await prisma.chatRoom.findFirst({
                    where: {
                        OR: [
                            {
                                user1Id: data.user1Id,
                                user2Id: data.user2Id
                            },
                            {
                                user1Id: data.user2Id,
                                user2Id: data.user1Id
                            }
                        ]
                    }
                })
                if (checkUser == null) {
                    return tx.chatRoom.create({
                        data: data,
                        include: chatRoomInclude,
                    })
                } else {
                    throw Error("Room Exists")
                }
            })
        } else {
            throw Error("You can have chat with yourself")
        }
    } catch (e) {
        console.log(e)
        return null;
    }
}
export const getChatRoom = async (id: string, userId: string): Promise<chatRoom | null> => {
    const room: any = await prisma.chatRoom.findFirst({
        where: {
            id: id
        },
        include: {
            ...chatRoomInclude,
            chatMessage: {
                select: {
                    id: true,
                    chatRoomId: true,
                    message: true,
                    userId: true,
                    user: {
                        select: chatSelectData
                    },
                    type: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1,
            }
        }
    })

    const unseen = await prisma.chatMessage.count({
        where: {
            chatRoomId: room.id,
            status: CHATSTATUS.delivered,
            userId: {
                not: userId
            }
        },
    });
    let u1 = room.user1;
    let u2 = room.user2;
    if (room.user1.id !== userId) {
        room.user1 = u2;
        room.user2 = u1;
    }
    if (room.user2.tracker !== null) {
        const check1 = room.user2.tracker!.isOnline;
        const check2 = (room.user2.tracker!.updatedAt.getTime()) > (new Date().getTime() - 300000);
        if (check1 && check2) {
            room.user2.isOnline = true;
        } else {
            room.user2.isOnline = false;
        }
    } else {
        room.user2.isOnline = false;
    }
    if (room.chatMessage.length > 0) {
        room.lastMessage = room.chatMessage[0];
    }
    delete room.user1.tracker;
    delete room.user2.tracker;
    room.unseen = unseen;

    return room;
}
export const getChatRoomByUsers = async (user1Id: string, user2Id: string): Promise<chatRoom | null> => {
    return prisma.chatRoom.findFirst({
        where: {
            OR: [
                {
                    user1Id: user1Id,
                    user2Id: user2Id
                },
                {
                    user1Id: user2Id,
                    user2Id: user1Id
                }
            ]
        },
        include: chatRoomInclude,
    })
}
export const getChatRoomByUser = async (id: string, page: number, limit: number): Promise<chatRoom[]> => {
    const rooms: any = await prisma.chatRoom.findMany({
        where: {
            OR: [
                {
                    user1Id: id
                },
                {
                    user2Id: id
                }
            ]
        },
        include: {
            ...chatRoomInclude,
            chatMessage: {
                select: {
                    id: true,
                    chatRoomId: true,
                    message: true,
                    userId: true,
                    user: {
                        select: chatSelectData
                    },
                    type: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1,
            }
        },
        skip: page * limit,
        take: limit,
        orderBy: {
            updatedAt: 'desc'
        }
    })
    let response: any[] = [];
    for (let room of rooms) {
        const unseen = await prisma.chatMessage.count({
            where: {
                chatRoomId: room.id,
                status: CHATSTATUS.delivered,
                userId: {
                    not: id
                }
            },
        });
        let u1 = room.user1;
        let u2 = room.user2;
        if (room.user1.id !== id) {
            room.user1 = u2;
            room.user2 = u1;
        }
        if (room.user2.tracker !== null) {
            const check1 = room.user2.tracker!.isOnline;
            const check2 = (room.user2.tracker!.updatedAt.getTime()) > (new Date().getTime() - 300000);
            if (check1 && check2) {
                room.user2.isOnline = true;
            } else {
                room.user2.isOnline = false;
            }
        } else {
            room.user2.isOnline = false;
        }
        if (room.chatMessage.length > 0) {
            room.lastMessage = room.chatMessage[0];
        }
        delete room.user1.tracker;
        delete room.user2.tracker;
        room.unseen = unseen;
        response.push(room);
    }
    return response;
}
export const getChatRoomUserNotID = async (roomId: string, notID: string): Promise<string | null> => {
    const room = await prisma.chatRoom.findFirst({
        where: {
            id: roomId,
        }
    })
    if (room) {
        if (room.user1Id == notID) {
            return room.user2Id;
        } else {
            return room.user1Id;
        }
    }
    return null;
}