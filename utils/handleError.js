const handleErorr = (message,statusCode,next,errorsArray)=>{
    const error = new Error(message);
    error.statusCode = statusCode;
    if(errorsArray){
        error.details = errorsArray;
    }
    next(error);
}

export default handleErorr;