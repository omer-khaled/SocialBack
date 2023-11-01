import { validationResult } from "express-validator";
import db from "../utils/dbConnection.js";
import handleErorr from "../utils/handleError.js";
import socket from "../utils/socket.js";
const getuserProfile = async(request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {id} = request.params;
        const user = (await db.execute(`select name,image from users where id=${id}`))[0][0];
        if(userId.toString()===id.toString()){
            response.status(200).json({
                status:true,
                user:user,
                me:true
            });
        }else{
            const data = (await db.execute(`select status from friends where (userId=${userId} and friendId=${id}) or (userId=${id} and friendId=${userId})`))[0][0];
            let status = null;
            if(data){
                status = data.status;
            }
            response.status(200).json({
                status:true,
                user:user,
                friend:(status===1||status===0)?status:null
            });
        }
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const getPostsOfUser = async(request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const {id} = request.params;
        const userId = request.userId;
        const posts = (await db.execute(`select postData.id, postData.name, postData.userId, postData.content, postData.postImage, postData.userImage, postData.createdAt,postData.numberOfLikes,postData.userLiked,count(comments.id) as numberOfcomments,LikesTypes.type as LikeType from (select postDetails.id, postDetails.name, postDetails.userId, postDetails.content, postDetails.postImage, postDetails.userImage, postDetails.createdAt,count(likes.id) as numberOfLikes,Exists(select 1 from likes where likes.userId=${userId} and likes.postId=postDetails.id) as userLiked from (select posts.id,users.name,posts.userId,posts.content,posts.image as postImage,users.image as userImage,posts.createdAt from posts join users on posts.userId = users.id where posts.userId=${id}) as postDetails left outer join likes on likes.postId=postDetails.id group by postDetails.id) as postData  left outer join comments on comments.postId=postData.id left outer join likes as LikesTypes on LikesTypes.postId=postData.id and LikesTypes.userId=${userId} group by postData.id order by postData.createdAt desc `))[0];
        response.status(200).json({
            status:true,
            posts:posts
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const addFriend = async(request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {friendId} = request.params;
        if(userId==friendId){
            return handleErorr('same user',422,next,null);
        }
        (await db.execute(`insert into friends(userId,friendId) values(${userId},${friendId})`))[0];
        const user = (await db.execute(`select friends.friendId,friends.userId,friends.createdAt,friends.status,users.id,users.name,users.image from friends join users on users.id=friends.userId where friends.userId=${userId} and friends.friendId=${friendId} and friends.status=false`))[0][0];
        socket.getIO().emit(`friendsrequests/${friendId}`,{
            action:'add',
            friend:user
        });
        response.status(201).json({
            status:true,
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const getFriends = async(request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const id = request.params.id|userId;
        const friends = (await db.execute(`select friends.createdAt,friends.status,users.id as friendId,users.name,users.image from friends join users on users.id!=${id} and (users.id=friends.userId or users.id=friends.friendId) and (friends.userId=${id} or friends.friendId=${id}) and friends.status=true`))[0];
        response.status(201).json({
            status:true,
            friends:friends
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const getFriendsRequests = async(request,response,next)=>{
    try{
        const userId = request.userId;
        const friends = (await db.execute(`select friends.friendId,friends.userId,friends.createdAt,friends.status,users.id,users.name,users.image from friends join users on users.id=friends.userId and friends.friendId=${userId} and friends.status=false`))[0];
        response.status(201).json({
            status:true,
            friends:friends
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const cancelFriend = async(request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {friendId} = request.params;
        const frindeRecode = (await db.execute(`select * from friends where (userId=${userId} and friendId=${friendId}) or (userId=${friendId} and friendId=${userId})`))[0][0];
        (await db.execute(`delete from friends where (userId=${userId} and friendId=${friendId}) or (userId=${friendId} and friendId=${userId})`));
        if(frindeRecode){
            socket.getIO().emit(`friends/${friendId}`,{
                action:'delete',
                friend:userId
            });
            socket.getIO().emit(`friends/${userId}`,{
                action:'delete',
                friend:friendId
            });
        }
        response.status(201).json({
            status:true,
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const acceptFriend = async(request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {friendId} = request.params;
        (await db.execute(`update friends set status=true where userId=${friendId} and friendId=${userId}`));
        const user =(await db.execute(`select users.name,users.image,friends.userId as friendId,friends.status,friends.createdAt from users join friends on friends.userId=users.id where users.id=${friendId}`))[0][0];
        const friend =(await db.execute(`select users.name,users.image,friends.friendId,friends.status,friends.createdAt from users join friends on friends.friendId=users.id where users.id=${userId}`))[0][0];
        socket.getIO().emit(`friends/${friendId}`,{
            action:'add',
            friend:{...friend}
        });
        socket.getIO().emit(`friends/${userId}`,{
            action:'add',
            friend:{...user}
        });
        response.status(201).json({
            status:true,
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const joinToGroup = async(request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const {id} = request.params;
        await db.execute(`insert into usersincommunities(userId,communityId) values('${userId}','${id}')`)
        response.status(201).json({
            status:true,
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const getUserInfo = async(request,response,next)=>{
    try{
        const userId = request.userId;
        const user = (await db.execute(`select id,name,image from users where id=${userId}`))[0][0];
        const postsNumber = (await db.execute(`select count(id) from posts where userId=${userId}`))[0][0]['count(id)'];
        const friendNumber = (await db.execute(`select count(*) from friends where (friendId=${userId} or userId=${userId})`))[0][0]['count(*)'];
        const comments = (await db.execute(`select count(comments.id) from comments join posts on posts.id=comments.postId join users on users.id=comments.userId where posts.userId=${userId} and comments.seen=false`))[0][0]['count(comments.id)'];
        const likes = (await db.execute(`select count(likes.id) from likes join posts on posts.id=likes.postId join users on users.id=likes.userId where posts.userId=${userId} and likes.seen=false`))[0][0]['count(likes.id)'];
        const notifcations = (likes+comments);
        const message = (await db.execute(`select messages.senderId from (select DISTINCT senderId from message where reciverId=${userId} and seen=false) as messages`))[0];
        response.status(200).json({
            status:true,
            user:{...user,messages:message,numberOfFriends:friendNumber||0,NumberOfPosts:postsNumber||0,notifications:notifcations},
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const getNotifications = async(request,response,next)=>{
    try{
        const userId = request.userId;
        const comments = (await db.execute(`select comments.id,users.name,posts.image as postImage,posts.content as postContent,users.image as userImage,comments.postId as postId,comments.content,comments.createdAt,comments.userId as commentOwner,posts.userId as postOwner,comments.seen from comments join posts on posts.id=comments.postId join users on users.id=comments.userId where posts.userId=${userId} order by comments.createdAt asc`))[0];
        const likes = (await db.execute(`select likes.id,posts.content as postContent,posts.image as postImage,users.name,users.image as userImage,likes.postId as postId,likes.type,likes.createdAt,likes.userId as commentOwner,posts.userId as postOwner,likes.seen from likes join posts on posts.id=likes.postId join users on users.id=likes.userId where posts.userId=${userId} order by likes.createdAt asc`))[0];
        const notifcations = ([].concat(likes,comments)).sort((a,b)=>{
            if(new Date(a.createdAt) > new Date(b.createdAt)){
                return -1;
            }else{
                return 1;
            }
        });
        response.status(200).json({
            status:true,
            notifcations:notifcations,
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const seeComment = async(request,response,next)=>{
    try{
        const id = request.params.id;
        (await db.execute(`update comments set seen=true where id=${id}`))[0];
        response.status(200).json({
            status:true,
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}

const seeLike = async(request,response,next)=>{
    try{
        const id = request.params.id;
        (await db.execute(`update likes set seen=true where id=${id}`))[0];
        response.status(200).json({
            status:true,
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}


const getFriendsChats = async(request,response,next)=>{
    try{
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return handleErorr('invalid data',422,next,errors.array());
        }
        const userId = request.userId;
        const friends = (await db.execute(`select friendDetails.createdAt,friendDetails.status,friendDetails.friendId,friendDetails.name,friendDetails.image,messageNumbers.messageNumber from (select friends.createdAt,friends.status,users.id as friendId,users.name,users.image from friends join users on users.id!=${userId} and (users.id=friends.userId or users.id=friends.friendId) and (friends.userId=${userId} or friends.friendId=${userId}) and friends.status=true) as friendDetails left outer join (select senderId,count(id) as messageNumber from message where reciverId=${userId} and seen=false group by senderId) as messageNumbers on friendDetails.friendId=messageNumbers.senderId`))[0];
        response.status(201).json({
            status:true,
            friends:friends
        });
    }catch(e){
        return handleErorr(e.message||'server error',500,next,null)
    }
}
export default {seeComment,getFriendsChats,seeLike,getUserInfo,joinToGroup,getNotifications,getuserProfile,getPostsOfUser,addFriend,getFriends,getFriendsRequests,cancelFriend,acceptFriend};