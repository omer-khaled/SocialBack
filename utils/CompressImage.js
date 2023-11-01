import path from 'path';
import dirname from './path.js';
import fs from 'fs';
import sharp from 'sharp';
const CompressImage = async (req, res,next) => {
    const imagePath = path.join(dirname,req.file.path);
    const finalPaths = imagePath.split('.');
    if(imagePath){
        // Create a sharp instance to process the uploaded image
        const image = sharp(imagePath);
    
        // Apply compression and format conversion (WebP)
        await image.toFormat('webp').webp({ quality: 80 }).toFile(finalPaths[0] + '.webp');
        await fs.promises.unlink(imagePath);
        req.file.filename = req.file.filename.split('.')[0]+'.webp';
    }
    next();
};

export default CompressImage;