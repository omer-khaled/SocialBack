const errorHandling = (err,request,response,next)=>{
    response.status(err.statusCode||500).json({
        status:false,
        error:err.details||err.message,
    })
}
export default errorHandling;