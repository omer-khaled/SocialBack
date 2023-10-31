import { Server } from "socket.io"
let io;
const init = (server)=>{
    io = new Server(server,{
        cors:{
            origin:'*'
        }
    });
    return io;
}

const getIO = ()=>{
    if(!io){
        throw new Error('Socket.io not init');
    }
    return io;
}

export default {init,getIO};