import { validationResult } from "express-validator";
import handleErorr from "../utils/handleError.js";
import bcrypt from 'bcrypt';
import clearImage from "../utils/clearImage.js";
import db from "../utils/dbConnection.js";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const signUp = async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        const image = request.file;
        if(!errors.isEmpty()){
            await clearImage(image.filename);
            return handleErorr('invalid data',422,next,errors.array());
        }
        if(!image){
            return handleErorr('invalid image',422,next);
        }
        const {name,email} = request.body;
        const hashedPassword = await bcrypt.hash(request.body.password,12);
        await db.execute(`insert into users(name,email,password,image) values('${name}','${email}','${hashedPassword}','${image.filename}')`);
        response.status(201).json({
            status:true,
        })
    }catch(e){
        if(request.file){
            await clearImage(request.file.filename);
        }
        return handleErorr(e.message,500,next,null);
    }
}

const logIn = async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }

        const user = request.foundedUser;

        const accessToken = jwt.sign({
            userId:user.id
        },process.env.ACCESS_TOKEN_SECRET,{expiresIn:'15m'});

        const refreshToken = jwt.sign({
            userId:user.id
        },process.env.REFRESH_TOKEN_SECRET,{expiresIn:'7d'});
        response.cookie('refreshjwt',refreshToken,{
            path:'/',
            httpOnly: true,
            sameSite:'none',
            secure:true,
            maxAge:7 * 24 * 60 * 60 * 1000,
        });

        response.status(200).json({
            status:true,
            accessToken:accessToken,
        });
    }catch(e){
        return handleErorr(e.message,500,next,null);
    }
}

const refresh = async (request,response,next)=>{
    try{
        const token = request.cookies.refreshjwt;
        if(!token){
            return handleErorr('un authrized',401,next,null);
        }
        const decodedToken = jwt.verify(token,process.env.REFRESH_TOKEN_SECRET);
        if(!decodedToken){
            return handleErorr('un authrized',401,next,null);
        }
        const accessToken = jwt.sign({
            userId:decodedToken.userId
        },process.env.ACCESS_TOKEN_SECRET,{expiresIn:'15m'});
        response.status(200).json({
            status:true,
            accessToken:accessToken
        });
    }catch(e){
        return handleErorr(e.message,500,next,null);
    }
}

const refreshGetUseInfo = async (request,response,next)=>{
    try{
        const token = request.cookies.refreshjwt;
        if(!token){
            return handleErorr('un authrized',401,next,null);
        }
        const decodedToken = jwt.verify(token,process.env.REFRESH_TOKEN_SECRET);
        if(!decodedToken){
            return handleErorr('un authrized',401,next,null);
        }
        const accessToken = jwt.sign({
            userId:decodedToken.userId
        },process.env.ACCESS_TOKEN_SECRET,{expiresIn:'15m'});
        const userId = decodedToken.userId;
        // const user = (await db.execute(`select id,name,image from users where id=${userId}`))[0][0];
        // const postsNumber = (await db.execute(`select count(id) from posts where userId=${userId}`))[0][0]['count(id)'];
        // const friendNumber = (await db.execute(`select count(*) from friends where (friendId=${userId} or userId=${userId})`))[0][0]['count(*)'];
        // const comments = (await db.execute(`select count(comments.id) from comments join posts on posts.id=comments.postId join users on users.id=comments.userId where posts.userId=${userId} and comments.seen=false`))[0][0]['count(comments.id)'];
        // const likes = (await db.execute(`select count(likes.id) from likes join posts on posts.id=likes.postId join users on users.id=likes.userId where posts.userId=${userId} and likes.seen=false`))[0][0]['count(likes.id)'];
        // const notifcations = (likes+comments);
        const user = (await db.execute(`SELECT
                u.id,
                u.name,
                u.image,
                p.posts_count as NumberOfPosts,
                f.friends_count as numberOfFriends,
                (c.comments_count + l.likes_count) as notifications
            FROM
                (SELECT id, name, image FROM users WHERE id = ${userId}) AS u
            LEFT JOIN
                (SELECT COUNT(id) AS posts_count FROM posts WHERE userId = ${userId}) AS p
            ON 1=1
            LEFT JOIN
                (SELECT COUNT(*) AS friends_count FROM friends WHERE friendId = ${userId} OR userId = ${userId}) AS f
            ON 1=1
            LEFT JOIN
                (SELECT COUNT(comments.id) AS comments_count
                FROM comments
                JOIN posts ON posts.id = comments.postId
                WHERE posts.userId = ${userId} AND comments.seen = false) AS c
            ON 1=1
            LEFT JOIN
                (SELECT COUNT(likes.id) AS likes_count
                FROM likes
                JOIN posts ON posts.id = likes.postId
                WHERE posts.userId = ${userId} AND likes.seen = false) AS l
            ON 1=1
        `))[0][0];
        const message = (await db.execute(`select messages.senderId from (select DISTINCT senderId from message where reciverId=${userId} and seen=false) as messages`))[0];
        response.status(200).json({
            status:true,
            accessToken:accessToken,
            user:{...user,messages:message},
        });
    }catch(e){
        return handleErorr(e.message,500,next,null);
    }
}
export default {signUp,logIn,refresh,refreshGetUseInfo};