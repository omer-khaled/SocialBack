import { Router } from "express";
import messageController from '../controllers/message.js'
import verifyToken from "../utils/verfiyToken.js";
import {param,body} from 'express-validator';
import uploader from "../utils/uploader.js";
const messageRouter = Router();

messageRouter.get('/getMessage/:friendId',verifyToken,[
    param('friendId').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],messageController.getMessage);

messageRouter.post('/createMessage/:friendId',verifyToken,uploader.single('image'),[
    param('friendId').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
    body('content').isString().isLength({min:1}).withMessage('content should at leaste 3 characters'),
],messageController.createMessage);

messageRouter.put('/updateMessage/:id',verifyToken,uploader.single('image'),[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
    body('content').isString().isLength({min:1}).withMessage('content should at leaste 3 characters'),
],messageController.updateMessage);

messageRouter.get('/seeMessage/:id',verifyToken,[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
],messageController.seeMessage);

messageRouter.delete('/deleteMessage/:id',verifyToken,[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
],messageController.deleteMessage);

export default messageRouter;