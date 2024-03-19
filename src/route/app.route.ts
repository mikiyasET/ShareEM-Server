import express from "express";
import authRoute from "./auth.route";
import {authenticateToken} from "../utils/auth";
import userRoute from "./user.route";

const appRoute = express.Router();

appRoute.use('/auth', authRoute);
appRoute.use('/user', authenticateToken, userRoute);
export default appRoute;