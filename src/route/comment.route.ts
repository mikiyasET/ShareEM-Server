import express from "express";
import {createComment, getUserComments, getVentComment} from "../controller/comment.controller";
import {strToInt} from "../helper/helper";

const commentRoute = express.Router();

commentRoute.get('/', async (req: any, res) => {
    try {
        const {ventId} = req.query;
        const comments = await getVentComment(req.user.id, ventId);
        return res.send({
            success: true,
            data: comments,
            message: "FETCH_COMMENTS_SUCCESS",
        })
    } catch (e) {
        return res.status(400).send({
            success: false,
            data: null,
            message: "FETCH_COMMENTS_FAILED",
        })
    }
})
commentRoute.post('/', async (req: any, res) => {
    try {
        const {ventId, content,identity} = req.body;
        const comment = await createComment({
            userId: req.user.id,
            ventId: ventId,
            content: content,
            identity: identity ?? req.user.identity,
        })
        return res.send({
            success: true,
            data: comment,
            message: "CREATE_COMMENT_SUCCESS",
        });
    } catch (e) {
        return res.status(400).send({
            success: false,
            data: null,
            message: "CREATE_COMMENT_FAILED",
        })
    }
})
commentRoute.get('/me', async (req: any, res) => {
    try {
        const {page, limit} = req.query;
        const comments = await getUserComments(req.user.id, strToInt(page), strToInt(limit));
        res.send({
            success: true,
            data: comments,
            message: "FETCH_USER_COMMENTS_SUCCESS",
        })
    } catch (e) {
        console.log(e)
        return res.status(400).send({
            success: false,
            data: null,
            message: "FETCH_USER_COMMENTS_ERROR",
        });
    }
})

export default commentRoute;