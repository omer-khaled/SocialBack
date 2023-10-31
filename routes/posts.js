import { Router } from "express";
import postController from '../controllers/post.js';
import uploader from '../utils/uploader.js';
import { body,param, query } from "express-validator";
import verifyToken from "../utils/verfiyToken.js";
import dotenv from 'dotenv';
dotenv.config();
const postRouter = Router();

postRouter.get('/getPosts',verifyToken,[
    query('page').isNumeric().matches(/^\d+$/).withMessage('page should be numric'),
    query('sokcet').isNumeric().matches(/^\d+$/).withMessage('page should be numric'),
],postController.getPosts)
postRouter.get('/getExtraPosts',verifyToken,[
    query('page').isNumeric().matches(/^\d+$/).withMessage('page should be numric'),
    query('sokcet').isNumeric().matches(/^\d+$/).withMessage('page should be numric'),
],postController.getExtraPosts)

postRouter.post('/createPost',verifyToken,uploader.single('image'),[
    body('content').isString().isLength({min:3}).withMessage('content should at leaste 3 characters')
],postController.createPost);

postRouter.post('/createPostInGroup/:groupid',verifyToken,uploader.single('image'),[
    body('content').isString().isLength({min:3}).withMessage('content should at leaste 3 characters'),
    param('groupid').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],postController.createPostinGroup);

postRouter.put('/updatePost/:id',verifyToken,uploader.single('image'),[
    body('content').isString().isLength({min:3}).withMessage('content should at leaste 3 characters'),
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],postController.updatePost);

postRouter.delete('/deletePost/:id',verifyToken,[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],postController.deletePost);

postRouter.get('/getSinglePost/:id',verifyToken,[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],postController.getSinglePost);


export default postRouter;