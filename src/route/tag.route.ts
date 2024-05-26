import express from 'express';
import {getTags} from "../controller/tag.controller";

const tagRoute = express.Router();
tagRoute.get('/', async (req, res) => {
    try {
        const vents = await getTags();
        res.send({
            success: true,
            data: vents,
            message: "FETCH_TAG_SUCCESS",
        })
    } catch (e) {
        console.log(e)
        return res.status(400).send({
            success: false,
            data: null,
            message: "FETCH_TAG_ERROR",
        });
    }
})


export default tagRoute;