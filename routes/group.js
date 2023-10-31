import { Router } from "express";
import groupController from '../controllers/group.js';
import verifyToken from "../utils/verfiyToken.js";
import uploader from "../utils/uploader.js";
import { body, query,param } from "express-validator";
const groupRouter = Router();

groupRouter.get('/getGroups',verifyToken,[
    query('page').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
],groupController.getGroups);

groupRouter.post('/createGroup',uploader.single('image'),[
    body('name').isAlphanumeric('en-US',{ignore:'\s'}).isLength({min:3}).withMessage('name should be at least 3 characters(caracters and numbers)')
],verifyToken,groupController.createGroup);

groupRouter.put('/updateGroup/:id',uploader.single('image'),[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
    body('name').isAlphanumeric('en-US',{ignore:'\s'}).isLength({min:3}).withMessage('name should be at least 3 characters(caracters and numbers)')
],verifyToken,groupController.updateGroup);


groupRouter.delete('/deleteGroup',[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric'),
],verifyToken,groupController.deleteGroup)

export default groupRouter;