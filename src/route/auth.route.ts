import express from "express";
import {checkBirthYear, checkEmail, ventIds} from "../helper/auth.helper";
import {
    createUser,
    getUserByEmail,
    getUser,
    checkUserEmail,
    getUserByEmailP,
    updateUser
} from "../controller/user.controller";
import {emailConfirmation, forgotPassword, SOLVESTATUS, STATUS, user} from "@prisma/client";
import {
    authenticatePasswordToken,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    hashPassword,
    refreshTheToken
} from "../utils/auth";
import multer from 'multer';
import {USERDATA} from "../types/model.types";
import {generate6DigitCode} from "../helper/helper";
import {sendCode} from "../utils/nodemailer";
import {createFPass, getFPassByEmail, updateFPass} from "../controller/forgotPassword.controller";
import {createEmailConf, getEmailConfByEmail, updateEmailConf} from "../controller/emailConfirmation.controller";
import {customAlphabet} from "nanoid";

const authRoute = express.Router();
authRoute.use(multer().none())
authRoute.post('/signIn', (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).send({
            success: false,
            data: null,
            message: "REQUIRED_FIELDS_MISSING",
        });
    } else {
        if (checkEmail(email)) {
            if (password.length >= 8 && password.length <= 256) {
                getUserByEmailP(email).then(async (user: user | null) => {
                    if (user) {
                        if (await comparePassword(password, user.password)) {
                            const accessToken = generateAccessToken(user.id);
                            const refreshToken = generateRefreshToken(user.id);
                            const newUser: USERDATA = {
                                id: user.id,
                                fName: user.fName,
                                lName: user.lName,
                                username: user.username,
                                email: user.email,
                                birthDate: user.birthDate,
                                gender: user.gender,
                                image: user.image,
                                feeling: user.feeling,
                                status: user.status,
                                identity: user.identity,
                                createdAt: user.createdAt,
                                updatedAt: user.updatedAt,
                            };
                            return res.status(200).send({
                                success: true,
                                data: {
                                    accessToken: accessToken,
                                    refreshToken: refreshToken,
                                    user: newUser,
                                },
                                message: "LOGIN_SUCCESS",
                            })
                        } else {
                            return res.status(400).send({
                                success: false,
                                data: null,
                                message: "LOGIN_FAILED",
                            });
                        }
                    } else {
                        return res.status(400).send({
                            success: false,
                            data: null,
                            message: "LOGIN_FAILED",
                        });
                    }
                }).catch((err) => {
                    return res.status(400).send({
                        success: false,
                        data: null,
                        message: "LOGIN_FAILED",
                    });
                });
            } else {
                return res.status(400).send({
                    success: false,
                    data: null,
                    message: "PASSWORD_LENGTH_ERROR",
                });
            }
        } else {
            return res.status(400).send({
                success: false,
                data: null,
                message: "INVALID_EMAIL",
            });
        }
    }
});
authRoute.post('/signUp', async (req, res) => {
    const {password, email, birthDate, code, anonymous} = req.body;
    if (!password || !email || !birthDate || !code || anonymous == undefined) {
        return res.status(400).send({
            success: false,
            data: null,
            message: "REQUIRED_FIELDS_MISSING",
        });
    } else {
        if (checkEmail(email)) {
            if (!(await checkUserEmail(email))) {
                if (password.length >= 8 && password.length <= 256) {
                    if (checkBirthYear(birthDate)) {
                        return getEmailConfByEmail(email).then(async (emailConf: emailConfirmation | null) => {
                            if (emailConf) {
                                if (await comparePassword(code, emailConf.token)) {
                                    updateEmailConf(emailConf.id, {
                                        status: SOLVESTATUS.solved
                                    }).then(async (fPass) => {
                                        const uid = ventIds();
                                        const pass = await hashPassword(password);
                                        const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-', 20);
                                        const hiddenName = nanoid();
                                        return createUser({
                                            fName: uid,
                                            username: uid,
                                            email: email,
                                            password: pass,
                                            birthDate: birthDate,
                                            hiddenName: hiddenName,
                                            identity: !anonymous,
                                            status: anonymous ? STATUS.active : STATUS.incomplete,
                                        }).then((user: USERDATA) => {
                                            const accessToken = generateAccessToken(user.id);
                                            const refreshToken = generateRefreshToken(user.id);
                                            return res.status(200).send({
                                                success: true,
                                                data: {
                                                    accessToken: accessToken,
                                                    refreshToken: refreshToken,
                                                    user: user,
                                                },
                                                message: "REGISTRATION_SUCCESS",
                                            })
                                        }).catch((err) => {
                                            return res.status(400).send({
                                                success: false,
                                                data: null,
                                                message: "REGISTRATION_FAILED",
                                            });
                                        })
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
                    } else {
                        return res.status(400).send({
                            success: false,
                            data: null,
                            message: "INVALID_BIRTH_YEAR",
                        });
                    }
                } else {
                    return res.status(400).send({
                        success: false,
                        data: null,
                        message: "PASSWORD_LENGTH_ERROR",
                    });
                }
            } else {
                return res.status(400).send({
                    success: false,
                    data: null,
                    message: "EMAIL_ALREADY_EXISTS",
                });
            }
        } else {
            return res.status(400).send({
                success: false,
                data: null,
                message: "INVALID_EMAIL",
            });
        }
    }
});
authRoute.post('/refresh', async (req: any, res) => {
    const refreshToken = req.body['Refresh-Token'];
    if (refreshToken == null) return res.sendStatus(401);
    const token = await refreshTheToken(refreshToken);
    if (token) {
        return res.status(200).send({
            success: true,
            data: token,
            message: "TOKEN_REFRESHED",
        });
    } else {
        return res.status(401).send({
            success: false,
            data: null,
            message: "REFRESHING_TOKEN_FAILED",
        });
    }
});
authRoute.post('/forgot/verify', async (req, res) => {
    const {email, code} = req.body;
    if (!email || !code) {
        return res.status(400).send({
            success: false,
            data: null,
            message: "REQUIRED_FIELDS_MISSING",
        });
    } else {
        if (checkEmail(email)) {
            return getFPassByEmail(email).then(async (fPass: forgotPassword | null) => {
                if (fPass) {
                    if (await comparePassword(code, fPass.token)) {
                        updateFPass(fPass.id, {
                            status: SOLVESTATUS.solved
                        }).then((fPass) => {
                            const token = generateAccessToken(fPass.id)
                            return res.status(200).send({
                                success: true,
                                data: {
                                    token: token
                                },
                                message: "FORGOT_VERIFY_SUCCESS",
                            });
                        }).catch((err) => {
                            return res.status(400).send({
                                success: false,
                                data: null,
                                message: "FORGOT_VERIFY_FAILED",
                            });
                        });
                    } else {
                        return res.status(400).send({
                            success: false,
                            data: null,
                            message: "FORGOT_VERIFY_FAILED",
                        });
                    }
                } else {
                    return res.status(400).send({
                        success: false,
                        data: null,
                        message: "FORGOT_VERIFY_FAILED",
                    });
                }
            }).catch((err) => {
                return res.status(400).send({
                    success: false,
                    data: null,
                    message: "FORGOT_VERIFY_FAILED",
                });
            });
        } else {
            return res.status(400).send({
                success: false,
                data: null,
                message: "INVALID_EMAIL",
            });
        }
    }
});
authRoute.post('/forgot/reset', authenticatePasswordToken, async (req: any, res) => {
    const {password, confirmPassword} = req.body;
    if (!password || !confirmPassword) {
        return res.status(400).send({
            success: false,
            data: null,
            message: "REQUIRED_FIELDS_MISSING",
        });
    } else {
        if (password.length >= 8 && password.length <= 256) {
            if (password === confirmPassword) {
                const pass = await hashPassword(password);
                return updateUser(req.user.id, {
                    password: pass
                }).then((user) => {
                    return res.status(200).send({
                        success: true,
                        data: null,
                        message: "RESET_PASSWORD_SUCCESS",
                    });
                }).catch((err) => {
                    return res.status(400).send({
                        success: false,
                        data: null,
                        message: "RESET_PASSWORD_FAILED",
                    });
                });
            } else {
                return res.status(400).send({
                    success: false,
                    data: null,
                    message: "RESET_PASSWORD_MISMATCH",
                });
            }
        } else {
            return res.status(400).send({
                success: false,
                data: null,
                message: "PASSWORD_LENGTH_ERROR",
            });
        }
    }
})
authRoute.post('/forgot', async (req, res) => {
    const email = req.body.email;
    if (!email) {
        return res.status(400).send({
            success: false,
            data: null,
            message: "REQUIRED_FIELDS_MISSING",
        });
    } else {
        if (checkEmail(email)) {
            getUserByEmail(email).then(async (user: USERDATA | null) => {
                if (user) {
                    if (user.status === STATUS.active) {
                        const code = generate6DigitCode();
                        const hashCode = await hashPassword(code.toString());
                        createFPass({
                            email: email,
                            token: hashCode
                        }).then((fPass) => {
                            sendCode(email, code).then((info) => {
                                return res.status(200).send({
                                    success: true,
                                    data: null,
                                    message: "FORGOT_SUCCESS",
                                });
                            }).catch((err) => {
                                return res.status(400).send({
                                    success: false,
                                    data: null,
                                    message: "FORGOT_EMAILING_FAILED",
                                });
                            })
                        }).catch((err) => {
                            return res.status(400).send({
                                success: false,
                                data: null,
                                message: "FORGOT_FAILED",
                            });
                        })
                    } else {
                        return res.status(400).send({
                            success: false,
                            data: null,
                            message: "ACCOUNT_NOT_READY_FOR_FORGOT",
                        });
                    }
                } else {
                    return res.status(400).send({
                        success: false,
                        data: null,
                        message: "USER_NOT_FOUND",
                    });
                }
            }).catch((err) => {
                return res.status(400).send({
                    success: false,
                    data: null,
                    message: "FORGOT_FAILED",
                });
            });
        } else {
            return res.status(400).send({
                success: false,
                data: null,
                message: "INVALID_EMAIL",
            });
        }
    }
});
authRoute.post('/confirmEmail', async (req, res) => {
    const {password, email, birthDate, code} = req.body;
    if (!password || !email || !birthDate) {
        return res.status(400).send({
            success: false,
            data: null,
            message: "REQUIRED_FIELDS_MISSING",
        });
    } else {
        if (checkEmail(email)) {
            if (!(await checkUserEmail(email))) {
                if (password.length >= 8 && password.length <= 256) {
                    if (checkBirthYear(birthDate)) {
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
                    } else {
                        return res.status(400).send({
                            success: false,
                            data: null,
                            message: "INVALID_BIRTH_YEAR",
                        });
                    }
                } else {
                    return res.status(400).send({
                        success: false,
                        data: null,
                        message: "PASSWORD_LENGTH_ERROR",
                    });
                }
            } else {
                return res.status(400).send({
                    success: false,
                    data: null,
                    message: "EMAIL_ALREADY_EXISTS",
                });
            }
        } else {
            return res.status(400).send({
                success: false,
                data: null,
                message: "INVALID_EMAIL",
            });
        }
    }
});
export default authRoute;