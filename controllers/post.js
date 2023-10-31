import { validationResult } from "express-validator";
import clearImage from "../utils/clearImage.js";
import handleErorr from "../utils/handleError.js";
import db from "../utils/dbConnection.js";
import socket from "../utils/socket.js";
import getPostsPPagination from "../utils/getPostsPagination.js";

const getPosts = async (request,response,next)=>{
    getPostsPPagination(request,response,next,3);
}
const getExtraPosts = async (request,response,next)=>{
    getPostsPPagination(request,response,next,1);
}

const createPost = async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        const image = request.file;
        if(!errors.isEmpty()){
            if(image){
                await clearImage(image.filename);
            }
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {content} = request.body;
        const {insertId} =(await db.execute(`insert into posts(content,userId${(image)?",image":""}) values('${content}','${userId}'${(image)?`,'${image.filename}'`:''})`))[0];
        const post  =  (await db.execute(`select  posts.id,users.name,posts.userId,posts.content,posts.image as postImage,users.image as userImage,posts.createdAt from posts join users on posts.id = '${insertId}' and posts.userId = users.id `))[0][0]
        socket.getIO().emit('posts',{
            action:'create',
            post:post
        });
        socket.getIO().emit(`posts/${userId}`,{
            action:'create',
            post:post
        });
        response.status(201).json({
            status:true,
            post:post
        });
    }catch(e){
        if(request.file){
            await clearImage(request.file.filename);
        }
        return handleErorr(e.message,500,next,null);
    }
}

const createPostinGroup = async (request,response,next)=>{
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
        const userId = request.userId;
        const {content} = request.body;
        const {groupid} =  request.params;
        const {insertId} =(await db.execute(`insert into posts(content,userId,image) values('${content}','${userId}','${image.filename}')`))[0];
        await db.execute(`insert into postsincommunities(postId,communityId) values('${insertId}','${groupid}')`);
        const post  =  (await db.execute(`select * from posts where id = '${insertId}'`))[0][0];
        socket.getIO().emit(`posts/${groupid}`,{
            action:'create',
            post:post
        });
        response.status(201).json({
            status:true,
            post:post
        });
    }catch(e){
        if(request.file){
            await clearImage(request.file.filename);
        }
        return handleErorr(e.message,500,next,null);
    }
}

const updatePost = async (request,response,next)=>{
    try{
        const {id} = request.params;
        const errors = validationResult(request);
        const image = request.file;
        if(!errors.isEmpty()){
            await clearImage(image.filename);
            return handleErorr('invalid data',422,next,errors.array());
        }
        const {content} = request.body;
        const post  =  (await db.execute(`select * from posts where id = '${id}'`))[0][0];
        const userId = request.userId;
        if(!post){
            return handleErorr('post not exists',401,next,null);
        }
        if(post.userId!==userId){
            return handleErorr('un authorized this post not for you',401,next,null);
        }
        if(image){
            if(post.image){
                await clearImage(post.image);
            }
            await db.execute(`update posts set content='${content}',image='${image.filename}' where id = ${id}`);
        }else{
            await db.execute(`update posts set content='${content}' where id = ${id}`)
        }
        const updayedpost = (await db.execute(`select  posts.id,users.name,posts.userId,posts.content,posts.image as postImage,users.image as userImage,posts.createdAt from posts join users on posts.id = '${id}' and posts.userId = users.id `))[0][0]
        socket.getIO().emit('posts',{
            action:'update',
            post:updayedpost
        });
        socket.getIO().emit(`posts/${userId}`,{
            action:'update',
            post:updayedpost
        });
        response.status(201).json({
            status:true,
            post:updayedpost
        });
    }catch(e){
        console.log(e);
        if(request.file){
            await clearImage(request.file.filename);
        }
        return handleErorr(e.message,500,next,null);
    }
}

const deletePost = async (request,response,next)=>{
    try{
        const {id} = request.params;
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            await clearImage(image.filename);
            return handleErorr('invalid data',422,next,errors.array());
        }
        const post  =  (await db.execute(`select * from posts where id = '${id}'`))[0][0];
        const userId = request.userId;
        if(!post){
            return handleErorr('post not exists',401,next,null);
        }
        if(post.userId.toString()!==userId.toString()){
            return handleErorr('un authorized this post not for you',401,next,null);
        }
        if(post.image){
            await clearImage(post.image);
        }
        await db.execute(`delete from posts where id = ${id}`);
        socket.getIO().emit('posts',{
            action:'delete',
            post:id
        });
        socket.getIO().emit(`posts/${userId}`,{
            action:'delete',
            post:id
        });
        response.status(201).json({
            status:true,
        });
    }catch(e){
        if(request.file){
            await clearImage(request.file.filename);
        }
        const message = e.message||e.toString();
        return handleErorr(message,500,next,null);
    }
}

const getSinglePost = async (request,response,next)=>{
    try{
        const {id} = request.params;
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            await clearImage(image.filename);
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const post = (await db.execute(`select postData.id, postData.name, postData.userId, postData.content, postData.postImage, postData.userImage, postData.createdAt,postData.numberOfLikes,postData.userLiked,count(comments.id) as numberOfcomments from (select postDetails.id, postDetails.name, postDetails.userId, postDetails.content, postDetails.postImage, postDetails.userImage, postDetails.createdAt,count(likes.id) as numberOfLikes,Exists(select 1 from likes where likes.userId=${userId} and likes.postId=postDetails.id) as userLiked from (select posts.id,users.name,posts.userId,posts.content,posts.image as postImage,users.image as userImage,posts.createdAt from posts join users on posts.userId = users.id where posts.id=${id}) as postDetails left outer join likes on likes.postId=postDetails.id group by postDetails.id) as postData left outer join comments on comments.postId=postData.id group by postData.id`) )[0][0];
        response.status(201).json({
            status:true,
            post:post
        });
    }catch(e){
        const message = e.message||e.toString();
        return handleErorr(message,500,next,null);
    }
}

export default {getPosts,getSinglePost,createPost,createPostinGroup,updatePost,deletePost,getExtraPosts};