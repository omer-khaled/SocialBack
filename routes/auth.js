import { Router } from "express";
import authController from '../controllers/auth.js';
import uploader from '../utils/uploader.js';
import { body } from "express-validator";
import bcrypt from 'bcrypt';
import db from "../utils/dbConnection.js";
import CompressImage from "../utils/CompressImage.js";
const authRouter = Router();

authRouter.post('/signup',uploader.single('image'),CompressImage,[
    body('name').isString().trim().isLength({min:3}).withMessage('name should be at leaste 3 character'),
    body('email').normalizeEmail().isEmail().withMessage('invalid email').custom(async(value,{req})=>{
        try{
            const user = (await db.execute(`select * from users where email = '${value}'`))[0];
            if(user.length){
                return Promise.reject('email is already exists');
            }
        }catch(e){
            return Promise.reject(e.message);
        }
    }),
    body('password').isString().trim().matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)[\w\W]{8,}$/).withMessage('password has at least one small character and one capital and one digit and one special character')
],authController.signUp);

authRouter.post('/login',[
    body('email').normalizeEmail().isEmail().withMessage('invalid email').custom(async(value,{req})=>{
        try{
            const user =(await db.execute(`select * from users where email = '${value}'`))[0][0];
            if(!user){
                return Promise.reject('email is not exists');
            }
            if(!await bcrypt.compare(req.body.password,user.password)){
                return Promise.reject('wrong password');
            }
            req.foundedUser = user;
        }catch(e){
            return Promise.reject(e.message);
        }
    }),
    body('password').isString().trim().matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)[\w\W]{8,}/).withMessage('password has at least one small character and one capital and one digit and one special character')
],authController.logIn);

authRouter.get('/refresh',authController.refresh);

authRouter.get('/refreshGetUseInfo',authController.refreshGetUseInfo);

export default authRouter;