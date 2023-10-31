import multer from "multer";
import { v4 as uuidv4 } from 'uuid';

const diskStorage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'images');
    }
    ,filename:(req,file,cb)=>{
        const filename = uuidv4()+file.originalname;
        cb(null,filename);
    }
});

const fileFilter = (req,file,cb)=>{
    if(file.mimetype === "image/jpeg"|| file.mimetype === "image/webp"  || file.mimetype === "image/jpg" || file.mimetype === "image/png"){
      return cb(null,true);
    }
    cb(null,false);
}

const uploader = multer({
    storage:diskStorage,
    fileFilter:fileFilter
});

export default uploader;