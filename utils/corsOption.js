const corsOption = {
    origin:'http://localhost:5173',
    methods:'OPTIONS,GET,PUT,POST,PATHCH,DELETE',
    allowedHeaders:'Content-Type,Authorization',
    credentials:true,
}
export default corsOption;