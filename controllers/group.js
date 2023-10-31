import { validationResult } from "express-validator";
import handleErorr from "../utils/handleError.js"
import db from "../utils/dbConnection.js";
import clearImage from "../utils/clearImage.js";

const getGroups =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const page = request.query.page||1;
        const numberOfPosts = 6;
        const numberofRows = (await db.execute(`select count(id) from posts`))[0][0]['count(id)'];
        const numberoFPages = Math.ceil(numberofRows / numberOfPosts);
        const groups = (await db.execute(`select * from communities limit ${numberOfPosts} offset ${(page - 1)*numberOfPosts}`))[0];
        response.status(200).json({
            status:true,
            groups:groups,
            numberoFPages:numberoFPages
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null);
    }
}


const createGroup =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        const image = request.file;
        if(!errors.isEmpty()){
            await clearImage(image.filename);
            return handleErorr('invalid data',422,next,errors.array());
        }
        if(!image){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {name} = request.body;
        const {insertId} = (await db.execute(`insert into communities(name,ownerId,image) values('${name}','${userId}','${image.filename}')`))[0]
        const group = (await db.execute(`select * from communities where id = ${insertId}`))[0][0];
        response.status(201).json({
            status:true,
            group:group
        })
    }catch(e){
        if(request.file){
            await clearImage(request.file.filename);
        }
        return handleErorr(e.message||'server error',500,next,null);
    }
}


const updateGroup =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        const image = request.file;
        if(!errors.isEmpty()){
            await clearImage(image.filename);
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {name} = request.body;
        const {id} = request.params;
        const group = (await db.execute(`select * from communities where id = ${id}`))[0][0];
        if(userId!==group.ownerId){
            return handleErorr('un authorized you not admin',401,next,null);
        }
        if(image){
            await clearImage(group.image);
            await db.execute(`update communities set name='${name}' , image='${image.filename}' where id = ${id}`);
        }else{
            await db.execute(`update communities set name='${name}' where id = ${id}`);
        }
        const updatedgroup = (await db.execute(`select * from communities where id = ${id}`))[0][0];
        response.status(201).json({
            status:true,
            group:updatedgroup
        });
    }catch(e){
        if(request.file){
            await clearImage(request.file.filename);
        }
        return handleErorr(e.message||'server error',500,next,null);
    }
}


const deleteGroup =async (request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {id} = request.params;
        const group = (await db.execute(`select * from communities where id = ${id}`))[0][0];
        if(userId!==group.ownerId){
            return handleErorr('un authorized you not admin',401,next,null);
        }
        await db.execute(`delete from communities where id=${id}`);
        response.status(201).json({
            status:true,
        });
    }catch(e){
        if(request.file){
            await clearImage(request.file.filename);
        }
        return handleErorr(e.message||'server error',500,next,null);
    }
}

export default {getGroups,createGroup,updateGroup,deleteGroup};