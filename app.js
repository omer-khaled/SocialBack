import express from 'express';
import cors from 'cors';
import corsOption from './utils/corsOption.js';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import errorHandling from './utils/errorHandler.js';
import dotenv from 'dotenv';
dotenv.config();
import authRouter from './routes/auth.js';
import postRouter from './routes/posts.js';
import socket from './utils/socket.js';
import commentRouter from './routes/comment.js';
import groupRouter from './routes/group.js';
import userRouter from './routes/user.js';
import messageRouter from './routes/message.js';
import path from 'path';
import dirname from './utils/path.js';
import likeRouter from './routes/likes.js';
import expressStaticGzip from 'express-static-gzip';
const app = express();

app.use(compression());
app.use(cors(corsOption));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/images',express.static(path.join(dirname,'images')));
app.use(
    '/',
    expressStaticGzip('path/to/your/build/directory', {
      enableBrotli: true,
      orderPreference: ['br', 'gz'],
    })
);

app.use('/auth',authRouter);
app.use('/post',postRouter);
app.use('/comment',commentRouter);
app.use('/like',likeRouter);
app.use('/gruop',groupRouter);
app.use('/user',userRouter);
app.use('/messages',messageRouter);



app.use(errorHandling);
const server = app.listen(3002);
const io = socket.init(server);
io.on('connection',()=>{
    console.log('websocket connected');
});
io.off('connection',()=>{
    console.log('disconected');
});