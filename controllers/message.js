import { validationResult } from "express-validator";
import handleErorr from "../utils/handleError.js"
import clearImage from "../utils/clearImage.js";
import db from "../utils/dbConnection.js";
import socket from "../utils/socket.js";

const getMessage =async (request,response,next)=>{
    try {
        const errors =validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const {friendId} = request.params;
        const userId = request.userId;
        (await db.execute(`update message set seen=true where reciverId=${userId} and seen=false`))[0];
        const messages = (await db.execute(`select * from message where (senderId=${userId} or senderId=${friendId}) and (reciverId=${userId} or reciverId=${friendId}) order by createdAt asc`))[0];
        response.status(200).json({
            status:true,
            messages:messages
        });
    } catch (e) {
        return handleErorr(e.message||'server error',500,next,null);
    }
}

const createMessage =async (request,response,next)=>{
    try {
        const errors =validationResult(request);
        const image = request.file;
        if(!errors.isEmpty()){
            if(image){
                await clearImage(image.filename);
            }
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {content} = request.body;
        const {friendId} = request.params;
        let insertId;
        if(image){
            const post = (await db.execute(`insert into message(senderId,reciverId,content,image) values(${userId},${friendId},'${content}','${image.filename}')`))[0];
            insertId = post.insertId;
        }else{
            const post = (await db.execute(`insert into message(senderId,reciverId,content) values(${userId},${friendId},'${content}')`))[0];
            insertId = post.insertId;
        }
        const message = (await db.execute(`select * from message where id=${insertId}`))[0][0];
        socket.getIO().emit(`message/${userId}-${friendId}`,{
                action:'create',
                message:message
            }
        )
        const messageCount = (await db.execute(`select count(id) from message where reciverId=${friendId} and senderId=${userId} and seen=false`))[0][0]['count(id)'];
        if(messageCount===1){
            socket.getIO().emit(`messages/${friendId}`,{
                    action:'create',
                    message:message
                }
            )
        }
        response.status(201).json({
            status:true,
            message:message
        })
    } catch (e) {
        if(request.file){
            await clearImage(request.file.filename);
        }
        return handleErorr(e.message||'server error',500,next,null);
    }
}

const updateMessage =async (request,response,next)=>{
    try {
        const errors =validationResult(request);
        const image = request.file;
        if(!errors.isEmpty()){
            if(image){
                await clearImage(image.filename);
            }
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {content} = request.body;
        const {id} = request.params;
        const comment = (await db.execute(`select * from message where id=${id}`))[0][0];
        if(image){
            if(comment.image){
                await clearImage(comment.image);
            }
            (await db.execute(`update message set content='${content}' , image='${image.filename}' where id = ${id}`))[0];
        }else{
            (await db.execute(`update message set content='${content}' where id = ${id}`))[0];
        }
        const updatedcomment = (await db.execute(`select * from message where id=${id}`))[0][0];
        socket.getIO().emit(`message/${userId}-${updatedcomment.reciverId}`,{
                action:'update',
                comment:updatedcomment
            }
        )
        response.status(201).json({
            status:true,
            comment:updatedcomment
        })
    } catch (e) {
        if(request.file){
            await clearImage(request.file.filename);
        }
        return handleErorr(e.message||'server error',500,next,null);
    }
}

const deleteMessage =async (request,response,next)=>{
    try {
        const errors =validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {id} = request.params;
        const comment = (await db.execute(`select * from message where id=${id}`))[0][0];
        if(comment.image){
            await clearImage(comment.image);
        }
        (await db.execute(`delete from message where id = ${id}`));
        socket.getIO().emit(`message/${userId}-${comment.reciverId}`,{
                action:'delete',
                comment:comment
            }
        )
        response.status(201).json({
            status:true,
            comment:comment
        })
    } catch (e) {
        if(request.file){
            await clearImage(request.file.filename);
        }
        return handleErorr(e.message||'server error',500,next,null);
    }
}

const seeMessage =async (request,response,next)=>{
    try {
        const errors =validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {id} = request.params;
        (await db.execute(`update message set seen=true where id=${id}`))[0];
        socket.getIO().emit(`messages/${userId}`,{
                action:'delete'
            }
        )
        response.status(201).json({
            status:true,
        })
    } catch (e) {
        return handleErorr(e.message||'server error',500,next,null);
    }
}
export default  {getMessage,createMessage,updateMessage,seeMessage,deleteMessage};