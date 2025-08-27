import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;
        // upload the file on cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto'
        })
        // file has been uploaded successfully
        console.log('File uploaded successfully',result.url);
        return result;
    } catch (error) {
        fs.unlinkSync(filePath); //remove the locally saved temporrary file as the upload operation got failed
        return null;
    }
}

export { uploadToCloudinary }