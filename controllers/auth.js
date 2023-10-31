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

export default {signUp,logIn,refresh};