import { Router } from "express";
import likeController from '../controllers/likes.js';
import { body,param,query } from "express-validator";
import verifyToken from "../utils/verfiyToken.js";
import dotenv from 'dotenv';
dotenv.config();
const likeRouter = Router();

likeRouter.get('/getLikes/:postId',verifyToken,[
    param('postId').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
],likeController.getLikes)

likeRouter.post('/createLike',verifyToken,[
    query('postId').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
    body('type').isString().isLength({min:3}).withMessage('type should at leaste 3 characters'),
],likeController.createLike);

likeRouter.delete('/deleteLike/:id',verifyToken,[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],likeController.deleteLike);


export default likeRouter;