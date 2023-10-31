import { Router } from "express";
import verifyToken from "../utils/verfiyToken.js";
import userController from '../controllers/user.js';
import { param } from "express-validator";
const userRouter = Router();

userRouter.get('/profile/:id',[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],verifyToken,userController.getuserProfile);

userRouter.get('/getProfilePosts/:id',[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],verifyToken,userController.getPostsOfUser);

userRouter.get('/addFriend/:friendId',[
    param('friendId').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],verifyToken,userController.addFriend);

userRouter.get('/getFriends/:id',[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],verifyToken,userController.getFriends);

userRouter.get('/getFriendsChats',verifyToken,userController.getFriendsChats);

userRouter.get('/getFriendsRequests',verifyToken,userController.getFriendsRequests);

userRouter.get('/cancelFriend/:friendId',[
    param('friendId').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],verifyToken,userController.cancelFriend);

userRouter.get('/acceptFriend/:friendId',[
    param('friendId').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],verifyToken,userController.acceptFriend);

userRouter.get('/joinToGroup/:id',[
    param('id').isNumeric().matches(/^\d+$/).withMessage('id should be numric')
],verifyToken,userController.joinToGroup);

userRouter.get('/getUserInfo',verifyToken,userController.getUserInfo);

userRouter.get('/getNotifications',verifyToken,userController.getNotifications);

userRouter.get('/seeComment/:id',verifyToken,userController.seeComment);

userRouter.get('/seeLike/:id',verifyToken,userController.seeLike);

export default userRouter;