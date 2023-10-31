import db from "./dbConnection.js";
import handleErorr from "./handleError.js";

const getPostsPPagination = async(request,response,next,show)=>{
    try{
        const page = +request.query.page||1;
        const numbeOfsokcet = +request.query.sokcet||0;
        const numberOfPosts = 3;
        const numberofRows = (await db.execute(`select count(id) from posts`))[0][0]['count(id)'];
        const numberoFPages = Math.ceil(numberofRows / numberOfPosts);
        const userId = request.userId;
        let skipedPosts;
        if(show===1){
          skipedPosts=(((page - 1)*numberOfPosts) + numbeOfsokcet) - 1;  
        }else{
            skipedPosts=(((page - 1)*numberOfPosts) + numbeOfsokcet);
        }
        const posts = (await db.execute(`select postData.id, postData.name, postData.userId, postData.content, postData.postImage, postData.userImage, postData.createdAt,postData.numberOfLikes,postData.userLiked,count(comments.id) as numberOfcomments,LikesTypes.type as LikeType from (select postDetails.id, postDetails.name, postDetails.userId, postDetails.content, postDetails.postImage, postDetails.userImage, postDetails.createdAt,count(likes.id) as numberOfLikes,Exists(select 1 from likes where likes.userId=${userId} and likes.postId=postDetails.id) as userLiked from (select posts.id,users.name,posts.userId,posts.content,posts.image as postImage,users.image as userImage,posts.createdAt from posts join users on posts.userId = users.id order by posts.createdAt desc limit ${show} offset ${skipedPosts}) as postDetails left outer join likes on likes.postId=postDetails.id group by postDetails.id) as postData left outer join comments on comments.postId=postData.id left outer join likes as LikesTypes on LikesTypes.postId=postData.id and LikesTypes.userId=${userId} group by postData.id`) )[0]
        // const posts = (await db.execute(`select postData.id, postData.name, postData.userId, postData.content, postData.postImage, postData.userImage, postData.createdAt,postData.numberOfLikes,postData.userLiked,count(comments.id) as numberOfcomments from (select postDetails.id, postDetails.name, postDetails.userId, postDetails.content, postDetails.postImage, postDetails.userImage, postDetails.createdAt,count(likes.id) as numberOfLikes,Exists(select 1 from likes where likes.userId=${userId} and likes.postId=postDetails.id) as userLiked from (select posts.id,users.name,posts.userId,posts.content,posts.image as postImage,users.image as userImage,posts.createdAt from posts join users on posts.userId = users.id order by posts.createdAt desc limit ${show} offset ${skipedPosts}) as postDetails left outer join likes on likes.postId=postDetails.id group by postDetails.id) as postData left outer join comments on comments.postId=postData.id group by postData.id`) )[0]
        response.status(200).json({
            status:true,
            posts:posts,
            totalPages:numberoFPages
        })
    }catch(e){
        return handleErorr(e.message,500,next,null);
    }
}

export default getPostsPPagination;