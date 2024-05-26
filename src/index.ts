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
import {getUser, getUserProfile} from "./controller/user.controller";
import {
    createChatRoom, getChatRoom,
    getChatRoomByUser,
    getChatRoomByUsers,
    getChatRoomUserNotID
} from "./controller/chatRoom.controller";
import {chatMessage, user} from "@prisma/client";
import {USERDATA} from "./types/model.types";
import {createChatMessage, getChatMessages} from "./controller/chatMessage.controller";

const app = express();

app.use('/img', express.static('public'));
app.use(express.json());
// app.use(morgan('dev'));
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
    // console.log("WEbsocket")
    // console.log(socket.handshake.auth)
    if (socket.handshake.auth && socket.handshake.auth.access_token && socket.handshake.auth.refresh_token) {
        const user = await authenticateSocketToken(socket.handshake.auth.access_token);
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

    console.log('a user connected');
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
    socket.on('getChatRooms', async (data: { page: number, limit: number }) => {
        const getChatRooms = await getChatRoomByUser(user.id, data.page ?? 0, data.limit ?? 10);
        io.to(socket.id).emit('chatRooms', {
            success: true,
            data: getChatRooms,
            message: "IO_CHAT_DATA"
        });
    })
    socket.on('joinRoom', async (id: string) => {
        try {
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
    socket.on('getChatMessages', async ({id, page, limit}: {
        id: string,
        page?: number,
        limit?: number,
    }, callback) => {
        try {
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
        const chat = await createChatMessage({
            chatRoomId: data.id,
            message: data.message,
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
                socket.broadcast.emit(getReceiverId, {
                    success: true,
                    data: {
                        key: data.key,
                        chat: chat,
                    },
                    message: "IO_CHAT_NEW_MESSAGE"
                });
                const r_index = users.findIndex((u) => u.userId == getReceiverId);
                if (r_index != -1) {
                    const updatedChatRoom = await getChatRoom(data.id, getReceiverId);
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
    socket.on('getProfile', async (id: string) => {
        const user = await getUserProfile(id);
        if (user) {
            io.to(socket.id).emit('profile', {
                success: true,
                data: user,
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
    socket.on('disconnect', () => {
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
