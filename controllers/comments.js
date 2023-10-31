import { validationResult } from "express-validator";
import db from "../utils/dbConnection.js";
import handleErorr from "../utils/handleError.js"
import socket from '../utils/socket.js';

const getComments =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const postId = request.params.postId;
        const comments = (await db.execute(`select comments.id,comments.userId,comments.postId,comments.content,users.name,users.image as userImage,comments.createdAt from comments join users on comments.userId=users.id and comments.postId = ${postId} order by comments.createdAt desc`))[0];
        response.status(200).json({
            status:true,
            comments:comments
        })
    }catch(e){
        return handleErorr(e.message||'server error',500,next);
    }
}

const createComment =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const {postId} = request.query;
        const {content} = request.body;
        const userId = request.userId;
        const {insertId} = (await db.execute(`insert into comments(userId,postId,content) values('${userId}','${postId}','${content}')`))[0]
        const comment = (await db.execute(`select comments.id,comments.userId,comments.postId,comments.content,users.name,users.image as userImage,comments.createdAt,posts.content as postContent,posts.image as postImage from comments join users on comments.id=${insertId} and users.id=comments.userId join posts on posts.id=comments.postId and posts.id=${postId}`))[0][0];
        const ownerOfPost = (await db.execute(`select userId from posts where id=${postId}`))[0][0];
        socket.getIO().emit(`comments/${postId}`,{
            action:'create',
            comment:comment
        });
        socket.getIO().emit(`notifications/${ownerOfPost.userId}`,{
            action:'create',
            notification:comment
        });
        response.status(201).json({
            status:true,
            comment:comment
        })
    }catch(e){
        return handleErorr(e.message||'server error',500,next);
    }
}

const updateComment =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const {id} = request.params;
        const {content} = request.body;
        await db.execute(`update comments set content='${content}' where id = ${id}`);
        const updayedcomment  =  (await db.execute(`select * from comments where id = ${id}`))[0][0];
        socket.getIO().emit(`comments/${updayedcomment.postId}`,{
            action:'update',
            comment:updayedcomment
        });
        response.status(201).json({
            status:true,
            comment:updayedcomment
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next);
    }
}

const deleteComment =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const {id} = request.params;
        const deletedcomment = (await db.execute(`select * from comments where id = ${id}`))[0][0];
        await db.execute(`delete from comments where id = ${id}`);
        socket.getIO().emit(`comments/${deletedcomment.postId}`,{
            action:'deleted',
            comment:deletedcomment
        })
        response.status(201).json({
            status:true,
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next);
    }
}

export default {getComments,createComment,updateComment,deleteComment}