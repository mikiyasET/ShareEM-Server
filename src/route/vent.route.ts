import express from "express";
import {createVent, getUserVents, getVents} from "../controller/vent.controller";
import {changeToFeelings, strToInt} from "../helper/helper";
import {createLike, getLikedVents, getPointsVents} from "../controller/like.controller";
import {LIKETYPE} from "@prisma/client";
import {createSaved, getSavedVents, removeSaved, unSaved} from "../controller/saved.controller";

const ventRoute = express.Router()

ventRoute.get('/', async (req: any, res) => {
    try {
        const {page, limit} = req.query;
        const vents = await getVents(req.user.id, strToInt(page), strToInt(limit));
        res.send({
            success: true,
            data: vents,
            message: "FETCH_VENT_SUCCESS",
        })
    } catch (e) {
        console.log(e)
        return res.status(400).send({
            success: false,
            data: null,
            message: "FETCH_VENT_ERROR",
        });
    }
})
ventRoute.get('/vented', async (req: any, res) => {
    try {
        const {page, limit} = req.query;
        const vents = await getUserVents(req.user.id, strToInt(page), strToInt(limit));
        res.send({
            success: true,
            data: vents,
            message: "FETCH_VENTED_SUCCESS",
        })
    } catch (e) {
        console.log(e)
        return res.status(400).send({
            success: false,
            data: null,
            message: "FETCH_VENTED_ERROR",
        });
    }
})
ventRoute.get('/saved', async (req: any, res) => {
    try {
        const {page, limit} = req.query;
        const vents = await getSavedVents(req.user.id, strToInt(page), strToInt(limit));
        res.send({
            success: true,
            data: vents,
            message: "FETCH_SAVED_SUCCESS",
        })
    } catch (e) {
        console.log(e)
        return res.status(400).send({
            success: false,
            data: null,
            message: "FETCH_SAVED_ERROR",
        });
    }
})
ventRoute.get('/liked', async (req: any, res) => {
    try {
        const {page, limit} = req.query;
        const vents = await getLikedVents(req.user.id, strToInt(page), strToInt(limit));
        res.send({
            success: true,
            data: vents,
            message: "FETCH_LIKED_SUCCESS",
        })
    } catch (e) {
        console.log(e)
        return res.status(400).send({
            success: false,
            data: null,
            message: "FETCH_LIKED_ERROR",
        });
    }
})
ventRoute.get('/points', async (req: any, res) => {
    try {
        const vents = await getPointsVents(req.user.id);
        res.send({
            success: true,
            data: vents,
            message: "FETCH_POINT_SUCCESS",
        })
    } catch (e) {
        console.log(e)
        return res.status(400).send({
            success: false,
            data: null,
            message: "FETCH_POINT_ERROR",
        });
    }
})
ventRoute.post('/', async (req: any, res) => {
    try {
        const {title, content, feeling, tags,identity} = req.body;
        const userID = req.user.id;
        const vent = await createVent({
            userId: userID,
            title: title,
            content: content,
            feeling: changeToFeelings(feeling),
            identity: identity ?? req.user.identity,
        }, tags)
        res.send({
            success: true,
            data: userID,
            message: "CREATE_VENT_SUCCESS",
        })
    } catch (e) {
        console.log(e)
        return res.status(400).send({
            success: false,
            data: null,
            message: "CREATE_VENT_ERROR",
        });
    }
})
ventRoute.post('/like', async (req: any, res) => {
    try {
        const {ventId, type} = req.body;
        const like = await createLike({
            userId: req.user.id,
            ventId: ventId,
            type: type == 'upvote' ? LIKETYPE.upvote : LIKETYPE.downvote
        })
        return res.send({
            success: true,
            data: like,
            message: "CREATE_LIKE_SUCCESS"
        })
    } catch (e) {
        console.log(e);
        return res.status(400).send({
            success: false,
            data: null,
            message: "CREATE_LIKE_FAILED"
        })
    }
});
ventRoute.post('/save', async (req: any, res) => {
    try {
        const {ventId} = req.body;

        const saved = await createSaved({
            userId: req.user.id,
            ventId: ventId,
        })
        return res.send({
            success: true,
            data: saved,
            message: "CREATE_SAVED_SUCCESS"
        })
    } catch (e) {
        console.log(e);
        return res.status(400).send({
            success: false,
            data: null,
            message: "CREATE_SAVED_FAILED"
        })
    }
});

export default ventRoute;