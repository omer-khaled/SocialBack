import { validationResult } from "express-validator";
import db from "../utils/dbConnection.js";
import handleErorr from "../utils/handleError.js"
import socket from '../utils/socket.js';

const getLikes =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const postId = request.params.postId;
        const likes = (await db.execute(`select likes.id,likes.userId,likes.postId,likes.type,users.name,users.image as userImage,likes.createdAt from likes join users on likes.userId=users.id and likes.postId = ${postId} order by likes.createdAt desc`))[0];
        const likeTypes = ((await db.execute(`select type from likes where postId = ${postId} group by type`))[0]).map(el=>Object.values(el)[0]);
        response.status(200).json({
            status:true,
            likes:likes,
            likeTypes:likeTypes
        })
    }catch(e){
        return handleErorr(e.message||'server error',500,next);
    }
}

const createLike =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const {postId} = request.query;
        const {type} = request.body;
        const userId = request.userId;
        const {insertId} = (await db.execute(`insert into likes(userId,postId,type) values('${userId}','${postId}','${type}')`))[0]
        const like = (await db.execute(`select likes.id,likes.userId,likes.postId,likes.type,users.name,users.image as userImage,likes.createdAt,posts.content as postContent,posts.image as postImage from likes join users on likes.id=${insertId} and users.id=likes.userId join posts on posts.id=likes.postId and posts.id=${postId}`))[0][0];
        const ownerOfPost = (await db.execute(`select userId from posts where id=${postId}`))[0][0];
        socket.getIO().emit(`likes/${postId}`,{
            action:'create',
            like:like
        });
        socket.getIO().emit(`notifications/${ownerOfPost.userId}`,{
            action:'create',
            notification:like
        });
        response.status(201).json({
            status:true,
            like:like
        })
    }catch(e){
        return handleErorr(e.message||'server error',500,next);
    }
}

const deleteLike =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const {id} = request.params;
        const deletedlike = (await db.execute(`select * from likes where id = ${id}`))[0][0];
        await db.execute(`delete from likes where id = ${id}`);
        socket.getIO().emit(`likes/${deletedlike.postId}`,{
            action:'deleted',
            like:id
        })
        response.status(201).json({
            status:true,
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next);
    }
}

export default {getLikes,createLike,deleteLike}