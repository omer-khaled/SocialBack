const corsOption = {
    origin:'https://social-front-six.vercel.app',
    methods:'OPTIONS,GET,PUT,POST,PATHCH,DELETE',
    allowedHeaders:'Content-Type,Authorization',
    credentials:true,
}
export default corsOption;