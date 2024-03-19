import express, {Request, Response} from 'express';
import appRoute from "./route/app.route";
const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(appRoute);

app.listen(3100, () => {
    console.log('Example app listening on port 3100!');
});