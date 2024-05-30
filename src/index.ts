import express, {Request, Response} from 'express';
import appRoute from "./route/app.route";
import morgan from 'morgan';
import setup from "./utils/setup";
import {Server} from "socket.io";
import {createServer} from "http";
import dotenv from 'dotenv';
import cors from 'cors';
import {authenticateSocketToken, authenticateToken, refreshSocketToken} from "./utils/auth";
import jwt from "jsonwebtoken";
import {getUserProfile} from "./controller/user.controller";
import {
    createChatRoom, getChatRoom,
    getChatRoomByUser,
    getChatRoomByUsers,
    getChatRoomUserNotID
} from "./controller/chatRoom.controller";
import {chatMessage, user} from "@prisma/client";
import {USERDATA} from "./types/model.types";
import {createChatMessage, getChatMessages, readChatMessage} from "./controller/chatMessage.controller";
import {trackMe} from "./controller/tracker.controller";
import {getUserPublicVents, getUserVents} from "./controller/vent.controller";

const app = express();

app.use('/img', express.static('public'));
app.use(express.json());
app.use(morgan('dev'));
dotenv.config({override: true});
app.use(cors());
const server = createServer(app);
export const io = new Server(server, {
    cors: {
        origin: '*',
        // credentials: true
    },
});
app.use('/api/v1', appRoute);
const users: { userId: string, socketId: string }[] = [];
io.of('/').use(async function (socket, next) {
    if (socket.handshake.auth && socket.handshake.auth.access_token && socket.handshake.auth.refresh_token) {
        const user: any = await authenticateSocketToken(socket.handshake.auth.access_token);
        if (user !== false) {
            socket.data = user;
            next();
        } else {
            const newToken: any = await refreshSocketToken(socket.handshake.auth.refresh_token);
            if (newToken !== false) {
                socket.data = newToken.user;
                next();
            } else {
                next(new Error('AUTHERR: NO_AUTH'));
            }
        }
    } else {
        next(new Error('AUTHERR: NO_AUTH'));
    }
}).on('connection', async (socket) => {
    const user: USERDATA = socket.data;
    if (users.findIndex((u) => u.userId == user.id) == -1) {
        users.push({userId: user.id, socketId: socket.id});
    }
    const getChatRooms = await getChatRoomByUser(user.id, 0, 10);
    io.to(socket.id).emit('chatRooms', {
        success: true,
        data: getChatRooms,
        message: "IO_CHAT_DATA"
    });
    await trackMe(user.id, 'connect');
    const profile = await getUserProfile(user.id);
    socket.broadcast.emit('userStatus', {
        success: true,
        data: profile,
        message: "IO_USER_PROFILE"
    })
    socket.on('getChatRooms', async (data: { page: number, limit: number }) => {
        await trackMe(user.id, 'fetch');
        const getChatRooms = await getChatRoomByUser(user.id, data.page ?? 0, data.limit ?? 10);
        io.to(socket.id).emit('chatRooms', {
            success: true,
            data: getChatRooms,
            message: "IO_CHAT_DATA"
        });
    })
    socket.on('joinRoom', async (id: string) => {
        try {
            await trackMe(user.id, 'upsert');
            const room = await getChatRoomByUsers(user.id, id);
            if (room) {
                io.to(socket.id).emit('chatRoom', {
                    success: true,
                    data: room,
                    message: "IO_CHAT_ROOM"
                });
            } else {
                const room = await createChatRoom({
                    user1Id: user.id,
                    user2Id: id
                });
                if (room) {
                    io.to(socket.id).emit('chatRoom', {
                        success: true,
                        data: room,
                        message: "IO_NEW_CHAT_ROOM"
                    });
                } else {
                    io.to(socket.id).emit('chatRoom', {
                        success: false,
                        data: null,
                        message: "IO_NEW_CHAT_ROOM_FAILED"
                    });
                }
            }
        } catch (e) {
            console.log(e)
            io.to(socket.id).emit('chatRoom', {
                success: false,
                data: null,
                message: "IO_CHAT_ROOM_FAILED"
            });
        }
    });
    socket.on('getChatMessages', async ({id, page, limit}: { id: string, page?: number, limit?: number}, callback) => {
        try {
            await trackMe(user.id, 'fetch');
            const msg: {
                messages: chatMessage[],
                updateRoom: boolean
            } = await getChatMessages(id, user.id, page ?? 0, limit ?? 20);
            if (callback) {
                callback(msg.messages);
            }
            io.to(socket.id).emit('chatMessages', {
                success: true,
                data: msg.messages,
                message: "IO_CHAT_MESSAGES"
            });
            if (msg.updateRoom) {
                const updatedChatRoom = await getChatRoom(id, user.id);
                if (updatedChatRoom != null) {
                    io.to(socket.id).emit('updateChatRoom', {
                        success: true,
                        data: updatedChatRoom,
                        message: "IO_UPDATED_CHAT_ROOM"
                    });
                    const r_id = await getChatRoomUserNotID(id, user.id);
                    if (r_id) {
                        const r_index = users.findIndex((u) => u.userId == r_id);
                        if (r_index != -1) {
                            const updatedChatRoom = await getChatRoom(id, r_id);
                            io.to(users[r_index].socketId).emit('updateChat', {
                                success: true,
                                data: msg.messages,
                                message: "IO_UPDATED_CHAT"
                            });
                            io.to(users[r_index].socketId).emit('updateChatRoom', {
                                success: true,
                                data: updatedChatRoom,
                                message: "IO_UPDATED_CHAT_ROOM"
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.log(e)
            io.to(socket.id).emit('chatMessages', {
                success: false,
                data: null,
                message: "IO_CHAT_MESSAGES_FAILED"
            });
        }
    })
    socket.on('sendMessage', async (data: { key: string, id: string, message: string }) => {
        await trackMe(user.id, 'create');
        const chat = await createChatMessage({
            chatRoomId: data.id,
            message: data.message.trim(),
            userId: user.id
        })
        if (chat) {
            io.to(socket.id).emit('chatMessage', {
                success: true,
                data: {
                    key: data.key,
                    chat: chat,
                },
                message: "IO_CREATED_CHAT_MESSAGE"
            });
            const getReceiverId = await getChatRoomUserNotID(data.id, user.id);
            if (getReceiverId != null) {
                const r_index = users.findIndex((u) => u.userId == getReceiverId);
                if (r_index != -1) {
                    const updatedChatRoom = await getChatRoom(data.id, getReceiverId);
                    io.to(users[r_index].socketId).emit(getReceiverId, {
                        success: true,
                        data: {
                            key: data.key,
                            chat: chat,
                        },
                        message: "IO_CHAT_NEW_MESSAGE"
                    });
                    io.to(users[r_index].socketId).emit('updateChatRoom', {
                        success: true,
                        data: updatedChatRoom,
                        message: "IO_UPDATED_CHAT_ROOM"
                    });
                }
            }
        } else {
            io.to(socket.id).emit('chatMessage', {
                success: false,
                data: null,
                message: "IO_CHAT_MESSAGE_FAILED"
            });
        }
    });
    socket.on('readChat', async (chatId: string) => {
        await trackMe(user.id, 'update');
        const chat = await readChatMessage(chatId);
        if (chat) {
            const r_id = await getChatRoomUserNotID(chat.chatRoomId, user.id);
            if (r_id) {
                const r_index = users.findIndex((u) => u.userId == r_id);
                if (r_index != -1) {
                    const updatedChatRoom = await getChatRoom(chat.chatRoomId, r_id);
                    io.to(users[r_index].socketId).emit('updateChatRoom', {
                        success: true,
                        data: updatedChatRoom,
                        message: "IO_UPDATED_CHAT_ROOM"
                    });
                    const updatedChatRoom2 = await getChatRoom(chat.chatRoomId, user.id);
                    io.to(socket.id).emit('updateChatRoom', {
                        success: true,
                        data: updatedChatRoom2,
                        message: "IO_UPDATED_CHAT_ROOM"
                    });
                    io.to(users[r_index].socketId).emit('updateChat', {
                        success: true,
                        data: [chat],
                        message: "IO_UPDATED_CHAT"
                    });
                }
            }
        }
    });
    socket.on('getProfile', async (id: string) => {
        await trackMe(user.id, 'fetch');
        const us = await getUserProfile(id);
        if (us) {
            io.to(socket.id).emit('profile', {
                success: true,
                data: us,
                message: "IO_PROFILE_DATA"
            });
        } else {
            io.to(socket.id).emit('profile', {
                success: false,
                data: null,
                message: "IO_PROFILE_FAILED"
            });
        }
    })
    socket.on('getUserVents', async ({id, page} : {id: string, page?: number}) => {
        await trackMe(user.id, 'fetch');
        const vents = await getUserPublicVents(id, page ?? 0, 5);
        if (vents) {
            io.to(socket.id).emit('userVents', {
                success: true,
                data: vents,
                message: "IO_USER_VENTS"
            });
        } else {
            io.to(socket.id).emit('userVents', {
                success: false,
                data: null,
                message: "IO_USER_VENTS_FAILED"
            });
        }
    })
    socket.on('disconnect', async () => {
        await trackMe(user.id, 'disconnect');
        const profile = await getUserProfile(user.id);
        socket.broadcast.emit('userStatus', {
            success: true,
            data: profile,
            message: "IO_USER_PROFILE"
        })
        const index = users.findIndex((u) => u.userId == user.id);
        if (index != -1) {
            users.splice(index, 1);
        }
        console.log('user disconnected');
    });
});

server.listen(process.env.PORT, () => {
    setup();
    console.log(`App server listening on port ${process.env.PORT} [Version 1.0]`);
});
