import handleErorr from "./handleError.js";
import jwt from 'jsonwebtoken';
const verifyToken = (request,response,next)=>{
    try{
        let token =  request.headers['Authorization']||request.headers['authorization'];
        if(!token){
            return handleErorr('un authrized',401,next,null);
        }
        token = token.split(' ')[1];
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        request.userId = decodedToken.userId;
        next();
    }catch(e){
        return handleErorr(e.message,401,next,null);
    }
}
export default verifyToken;
