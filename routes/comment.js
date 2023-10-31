import { Router } from "express";
import commentController from '../controllers/comments.js';
import { body,param,query } from "express-validator";
import verifyToken from "../utils/verfiyToken.js";
import dotenv from 'dotenv';
dotenv.config();
const commentRouter = Router();

commentRouter.get('/getComments/:postId',verifyToken,[
    param('postId').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
],commentController.getComments)

commentRouter.post('/createComment',verifyToken,[
    query('postId').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
    body('content').isString().isLength({min:3}).withMessage('content should at leaste 3 characters'),
],commentController.createComment);

commentRouter.put('/updateComment/:id',verifyToken,[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
    body('content').isString().isLength({min:3}).withMessage('content should at leaste 3 characters'),
],commentController.updateComment);

commentRouter.delete('/deleteComment/:id',verifyToken,[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],commentController.deleteComment);


export default commentRouter;