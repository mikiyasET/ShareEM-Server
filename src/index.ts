import express, {Request, Response} from 'express';
import appRoute from "./route/app.route";
import morgan from 'morgan';

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/v1', appRoute);

app.listen(3100, () => {
    console.log('Example app listening on port 3100!');
});