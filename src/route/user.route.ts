import express from "express";
import {
    checkUserUsername, createUser,
    getUser, getUserByEmail, getUserByUsername, getUserProtected,
    updateUser
} from "../controller/user.controller";
import {emailConfirmation, GENDER, SOLVESTATUS, STATUS} from "@prisma/client";
import multer from "multer";
import {generate6DigitCode, strToInt} from "../helper/helper";
import {getUserComments} from "../controller/comment.controller";
import sharp, {bool} from "sharp";
import {customAlphabet, nanoid} from "nanoid";
import fs from "fs";
import {comparePassword, generateAccessToken, generateRefreshToken, hashPassword} from "../utils/auth";
import {createEmailConf, getEmailConfByEmail, updateEmailConf} from "../controller/emailConfirmation.controller";
import {sendCode} from "../utils/nodemailer";
import {ventIds} from "../helper/auth.helper";
import {USERDATA} from "../types/model.types";
import {isBoolean} from "node:util";

const userRoute = express.Router();

userRoute.put('/complete-reg', multer().none(), async (req: any, res) => {
    if (req.user.status == STATUS.incomplete) {
        const {username, fName, lName, gender} = req.body;
        if (!username || !fName || !gender) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "REQUIRED_FIELDS_MISSING"
            });
        }
        if (username.length > 4 && username.length < 20) {
            if (!(await checkUserUsername(username, req.user.id))) {
                if (fName.length > 2 && fName.length < 20) {
                        if (gender.length === 1 && ['m', 'f', 'n'].includes(gender)) {
                            const newGender = gender === 'm' ? GENDER.male : gender === 'f' ? GENDER.female : GENDER.none;
                            return updateUser(req.user.id, {
                                fName: fName,
                                lName: lName,
                                username: username,
                                gender: newGender,
                                status: STATUS.active
                            }).then((user) => {
                                return res.status(200).json({
                                    success: true,
                                    data: user,
                                    message: "REGISTRATION_COMPLETED"
                                });
                            }).catch((err) => {
                                return res.status(400).json({
                                    success: false,
                                    data: null,
                                    message: "REGISTRATION_COMPLETION_FAILED"
                                });
                            });
                        } else {
                            return res.status(400).json({
                                success: false,
                                data: null,
                                message: "INVALID_GENDER"
                            });
                        }
                } else {
                    return res.status(400).json({
                        success: false,
                        data: null,
                        message: "FIRST_NAME_LENGTH_ERROR"
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    data: null,
                    message: "USERNAME_ALREADY_EXISTS"
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                data: null,
                message: "USERNAME_LENGTH_ERROR"
            });
        }
    } else {
        return res.status(400).json({
            success: false,
            data: null,
            message: "REGISTRATION_ALREADY_COMPLETED"
        });
    }
});
userRoute.get('/me', multer().none(), async (req: any, res) => {
    return res.status(200).json({
        success: true,
        data: req.user,
        message: "USER_DATA",
    });
});
userRoute.put('/update/:type', multer().none(), async (req: any, res) => {
    try {
        const {type} = req.params;
        const {email, fName, lName, username, gender, code, identity} = req.body;
        switch (type) {
            case 'name':
                if (fName.length > 2 && fName.length < 20) {
                    const nameRes = await updateUser(req.user.id, {fName: fName, lName: lName});
                    return res.status(200).json({
                        success: true,
                        data: nameRes,
                        message: "UPDATE_EMAIL_SUCCESS"
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        data: null,
                        message: "NAME_LENGTH_ERROR"
                    });
                }
            case 'username':
                const user = await getUserByUsername(username);
                if (user === null) {
                    const usernameRes = await updateUser(req.user.id, {username: username});
                    return res.status(200).json({
                        success: true,
                        data: usernameRes,
                        message: "UPDATE_EMAIL_SUCCESS"
                    });
                } else {
                    if (user.id == req.user.id) {
                        return res.status(400).json({
                            success: false,
                            data: null,
                            message: "USERNAME_NO_CHANGE"
                        });
                    } else {
                        return res.status(400).json({
                            success: false,
                            data: null,
                            message: "USERNAME_ALREADY_EXISTS"
                        });
                    }
                }
            case 'checkEmail':
                const emailRes = await getUserByEmail(email);
                if (emailRes === null) {
                    const code = generate6DigitCode();
                    const hashCode = await hashPassword(code.toString());
                    createEmailConf({
                        email: email,
                        token: hashCode
                    }).then((_) => {
                        sendCode(email, code).then((info) => {
                            return res.status(200).send({
                                success: true,
                                data: null,
                                message: "EMAIL_VERIFY_SUCCESS",
                            });
                        }).catch((err) => {
                            return res.status(400).send({
                                success: false,
                                data: null,
                                message: "EMAIL_VERIFY_FAILED",
                            });
                        })
                    }).catch((err) => {
                        return res.status(400).send({
                            success: false,
                            data: null,
                            message: "EMAIL_VERIFY_FAILED",
                        });
                    })
                } else if (emailRes.id == req.user.id) {
                    return res.status(400).json({
                        success: false,
                        data: null,
                        message: "EMAIL_NO_CHANGE"
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        data: null,
                        message: "EMAIL_ALREADY_EXISTS"
                    });
                }
                break;
            case 'email':
                return getEmailConfByEmail(email).then(async (emailConf: emailConfirmation | null) => {
                    if (emailConf) {
                        if (await comparePassword(code, emailConf.token)) {
                            updateEmailConf(emailConf.id, {
                                status: SOLVESTATUS.solved
                            }).then(async (fPass) => {
                                const emailRes = await updateUser(req.user.id, {email: emailConf.email});
                                return res.status(200).json({
                                    success: true,
                                    data: emailRes,
                                    message: "UPDATE_EMAIL_SUCCESS"
                                });
                            }).catch((err) => {
                                return res.status(400).send({
                                    success: false,
                                    data: null,
                                    message: "EMAIL_CONFIRM_FAILED",
                                });
                            });
                        } else {
                            return res.status(400).send({
                                success: false,
                                data: null,
                                message: "EMAIL_CONFIRM_FAILED",
                            });
                        }
                    } else {
                        return res.status(400).send({
                            success: false,
                            data: null,
                            message: "EMAIL_CONFIRM_FAILED",
                        });
                    }
                }).catch((err) => {
                    return res.status(400).send({
                        success: false,
                        data: null,
                        message: "EMAIL_CONFIRM_FAILED",
                    });
                });
            case 'gender':
                const gen = gender == 'm' ? GENDER.male : gender == 'f' ? GENDER.female : GENDER.none;
                const genderRes = await updateUser(req.user.id, {gender: gen});
                return res.status(200).json({
                    success: true,
                    data: genderRes,
                    message: "UPDATE_GENDER_SUCCESS"
                });
            case 'resend':
                const cc = generate6DigitCode();
                const hashCode = await hashPassword(cc.toString());
                createEmailConf({
                    email: email,
                    token: hashCode
                }).then((_) => {
                    sendCode(email, cc).then((info) => {
                        return res.status(200).send({
                            success: true,
                            data: null,
                            message: "EMAIL_VERIFY_SUCCESS",
                        });
                    }).catch((err) => {
                        return res.status(400).send({
                            success: false,
                            data: null,
                            message: "EMAIL_VERIFY_FAILED",
                        });
                    })
                }).catch((err) => {
                    return res.status(400).send({
                        success: false,
                        data: null,
                        message: "EMAIL_VERIFY_FAILED",
                    });
                })
                break;
            case 'identity':
                if (typeof identity === 'boolean') {
                    if (req.user.identity !== identity) {
                        const identityRes = await updateUser(req.user.id, {identity: identity});
                        return res.status(200).json({
                            success: true,
                            data: identityRes,
                            message: "UPDATE_IDENTITY_SUCCESS"
                        });
                    } else {
                        return res.status(400).json({
                            success: false,
                            data: null,
                            message: "UPDATE_IDENTITY_NO_CHANGE"
                        });
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        data: null,
                        message: "UPDATE_INVALID_IDENTITY"
                    });
                }
            default:
                return res.status(400).json({
                    success: false,
                    data: null,
                    message: "INVALID_UPDATE_TYPE"
                });
        }
    } catch (e) {
        console.log(e)
        return res.status(400).json({
            success: false,
            data: null,
            message: "UPDATE_FAILED"
        });
    }
});
userRoute.put('/update-password', multer().none(), async (req: any, res) => {
    const {oldPass, newPass} = req.body
    const user = await getUserProtected(req.user.id);
    if (user) {
        if (await comparePassword(oldPass, user.password)) {
            if (oldPass !== newPass) {
                if (newPass.length >= 8 && newPass.length <= 256) {
                    const hashedPass = await hashPassword(newPass);
                    const newUser = await updateUser(req.user.id, {password: hashedPass});
                    return res.status(200).json({
                        success: true,
                        data: newUser,
                        message: "UPDATE_PASSWORD_SUCCESS"
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        data: null,
                        message: "UPDATE_PASSWORD_LENGTH_ERROR"
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    data: null,
                    message: "UPDATE_PASSWORD_SAME"
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                data: null,
                message: "UPDATE_PASSWORD_FAILED"
            });
        }
    } else {
        return res.status(400).json({
            success: false,
            data: null,
            message: "UPDATE_PASSWORD_FAILED"
        });

    }
});
userRoute.put('/update-image', multer().single('photo'), async (req: any, res) => {
    try {
        const img = req.file;
        if (img) {

            const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-', 36);
            const imageName = `${nanoid()}_${Date.now()}.jpg`;
            const image = await sharp(img.buffer).resize(200, 200)
                .jpeg({quality: 50}).toFile(process.cwd() + `/public/up_image/${imageName}`);
            if (req.user.image) {
                try {
                    fs.unlinkSync(process.cwd() + `/public/up_image/${req.user.image}`);
                } catch (e) {

                }
            }
            const user = await updateUser(req.user.id, {image: imageName});
            return res.status(200).json({
                success: true,
                data: user,
                message: "UPDATE_IMAGE_SUCCESS"
            });
        } else {
            return res.status(400).json({
                success: false,
                data: null,
                message: "IMAGE_REQUIRED"
            });
        }
    } catch (e) {
        return res.status(400).json({
            success: false,
            data: null,
            message: "UPDATE_IMAGE_FAILED"
        });
    }
});
userRoute.delete('/:type', async (req: any, res)=> {
    try {
        const {type} = req.params;
        switch (type) {
            case 'delete':

                break;
            case 'deactivate':
                break;
        }
    }  catch (e) {
        return res.status(400).json({
            success: false,
            data: null,
            message: "USER_DELETE_FAILED"
        });
    }
})
export default userRoute;