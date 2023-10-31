import fs from 'fs';
import path from 'path';
import dirname from './path.js';
const clearImage = async(fileName)=>{
    try{
        const filePath = path.join(dirname,'images',fileName);
        await fs.promises.unlink(filePath);
    }catch(e){
        throw e.message;
    }
}

export default clearImage;