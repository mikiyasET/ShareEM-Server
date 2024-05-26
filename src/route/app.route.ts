import express from "express";
import authRoute from "./auth.route";
import {authenticateToken} from "../utils/auth";
import userRoute from "./user.route";
import ventRoute from "./vent.route";
import tagRoute from "./tag.route";
import commentRoute from "./comment.route";

const appRoute = express.Router();
appRoute.get('/', (req, res) => {
    res.send('Well done you have found our API');
});
appRoute.use('/auth', authRoute);
appRoute.use('/user', authenticateToken, userRoute);
appRoute.use('/vent', authenticateToken, ventRoute);
appRoute.use('/tags', authenticateToken, tagRoute);
appRoute.use('/comment', authenticateToken, commentRoute);
export default appRoute;