import express from "express";
import {
    checkUserUsername,
    getUser,
    updateUser
} from "../controller/user.controller";
import {GENDER, STATUS} from "@prisma/client";
import multer from "multer";

const userRoute = express.Router();

userRoute.put('/complete-reg', multer().none(), async (req: any, res) => {
    if (req.user.status == STATUS.incomplete) {
        console.log(req.body)
        const {username, fName, lName, gender} = req.body;
        if (!username || !fName || !lName || !gender) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "REQUIRED_FIELDS_MISSING"
            });
        }
        if (username.length > 4 && username.length < 20) {
            if (!(await checkUserUsername(username, req.user.id))) {
                if (fName.length > 2 && fName.length < 20) {
                    if (lName.length > 2 && lName.length < 20) {
                        if (gender.length === 1 && ['m', 'f', 'n'].includes(gender)) {
                            const newGender = gender === 'm' ? GENDER.male : gender === 'f' ? GENDER.female : GENDER.none;
                            return updateUser(req.user.id, {
                                fName: fName,
                                lName: lName,
                                username: username,
                                gender: newGender,
                                status: STATUS.active
                            }).then((user) => {
                                console.log(user)
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
                            message: "LAST_NAME_LENGTH_ERROR"
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


export default userRoute;