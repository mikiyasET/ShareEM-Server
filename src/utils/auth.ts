import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {ACCESS_TOKEN_EXPIRE, REFRESH_TOKEN_EXPIRE} from "./constant";
import {getUser, getUserByEmail} from "../controller/user.controller";
import {getFPass} from "../controller/forgotPassword.controller";
import {user} from "@prisma/client";
import {USERDATA} from "../types/model.types";

export const authenticateToken = (req: any, res: any, next: any) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]
        if (token == null) return res.sendStatus(403)
        jwt.verify(token, process.env.TOKEN_SECRET as string, async (err: any, user: any) => {
            if (err) return res.sendStatus(401)
            req.user = await getUser(user.id);
            if (!req.user) return res.sendStatus(401);
            next()
        })
    } catch (e) {
        console.log(e);
        return res.status(403).send("UNEXPECTED_ERROR");
    }
}

export const authenticateSocketToken = async (token: string) => {
    try {
        if (token == null) return false;
        return jwt.verify(token, process.env.TOKEN_SECRET as string, async (err: any, user: any) => {
            if (err) return false;
            const usr = await getUser(user.id);
            if (!usr) return false
            return usr;
        })
    } catch (e) {
        return false;
    }
}
export const refreshSocketToken = async (token: string) => {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string, async (err: any, user: any) => {
            const newUser = await getUser(user.id);
            if (!err && (newUser != null)) {
                return {
                    accessToken: generateAccessToken(user.id),
                    refreshToken: generateRefreshToken(user.id),
                    user: newUser
                }
            }
            return false;
        })
    } catch (e) {
        return false;
    }
}
export const authenticatePasswordToken = (req: any, res: any, next: any) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]
        if (token == null) return res.sendStatus(403)

        jwt.verify(token, process.env.TOKEN_SECRET as string, async (err: any, fPass: any) => {
            if (err) return res.sendStatus(401);
            const fPassWord = await getFPass(fPass.id);
            if (fPassWord == null) return res.sendStatus(401);
            req.user = await getUserByEmail(fPassWord.email);
            if (!req.user) return res.sendStatus(401);
            next()
        })
    } catch (e) {
        console.log(e);
        return res.status(403).send("UNEXPECTED_ERROR");
    }
}
export const generateAccessToken = (id: string) => {
    return jwt.sign({id: id}, process.env.TOKEN_SECRET!, {expiresIn: ACCESS_TOKEN_EXPIRE});
}
export const generateRefreshToken = (id: string) => {
    return jwt.sign({id: id}, process.env.REFRESH_TOKEN_SECRET!, {expiresIn: REFRESH_TOKEN_EXPIRE});
}
export const refreshTheToken = async (token: string): Promise<any> => {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string, async (err: any, user: any) => {
            if (!err && (await getUser(user.id)) != null) {
                return {
                    accessToken: generateAccessToken(user.id),
                    refreshToken: generateRefreshToken(user.id),
                }
            }
            return null;
        })
    } catch (e) {
        return null;
    }
}
export const hashPassword = async (password: string): Promise<string> => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compareSync(password, hash);
}