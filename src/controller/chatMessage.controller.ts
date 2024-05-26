import {chatMessage, CHATSTATUS, Prisma} from "@prisma/client";
import prisma from "../utils/client";
import {userPublicSelectData} from "./user.controller";

export const createChatMessage = async (data: Prisma.chatMessageUncheckedCreateInput): Promise<chatMessage> => {
    return prisma.chatMessage.create({
        data: data,
        include: {
            user: {
                select: userPublicSelectData
            }
        },
    })
}
export const updateChatMessage = async (id: string, data: Prisma.chatMessageUncheckedUpdateInput): Promise<chatMessage> => {
    return prisma.chatMessage.update({
        where: {
            id: id
        },
        data: data
    })
}
export const removeChatMessage = async (id: string): Promise<chatMessage> => {
    return prisma.chatMessage.delete({
        where: {
            id: id
        }
    })
}
export const getChatMessage = async (id: string): Promise<chatMessage | null> => {
    return prisma.chatMessage.findUnique({
        where: {
            id: id
        }
    });
}
export const getChatMessages = async (roomId: string,userId: string, page: number, limit: number): Promise<{
    messages: chatMessage[],
    updateRoom: boolean
}> => {
    let messages = await prisma.chatMessage.findMany({
        where: {
            chatRoomId: roomId,
            status: {
                not: CHATSTATUS.deleted
            }
        },
        include: {
            user: {
                select: userPublicSelectData
            }
        },
        take: limit,
        skip: page * limit,
        orderBy: {
            createdAt: 'desc'
        }
    });
    let updateRoom = false;
    for (const msg of messages) {
        if (msg.status == CHATSTATUS.delivered && msg.userId != userId) {
            messages[messages.indexOf(msg)] = await prisma.chatMessage.update({
                where: {
                    id: msg.id
                },
                data: {
                    status: CHATSTATUS.seen
                },
                include: {
                    user: {
                        select: userPublicSelectData
                    }
                },
            })
            updateRoom = true;
        }
    }

    return {
        messages: messages,
        updateRoom: updateRoom
    };
}