const multer = require('multer');
const path = require('path');
/**
 ** Multer configuration for image upload (Temporary uploads a file to the memory)
 *  @returns Middleware function
 */

const fileUpload = (imagePath, field, maxSize) => {
    try {     
        if(!field){
            console.log("file not uploaded");
            return;
        }
        // if (!maxSize) {
        //     maxSize = process.env.MAX_UPLOAD_FILE_SIZE || 5 * 1024 * 1024 * 1024;
        // }
        const fileStorage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, path.join(__dirname, '../uploads', imagePath));
            },
            filename: (req, file, cb) => {
                // cb(null, new Date().getTime().toString() + "_" + file.originalname.replace(" ", "_"));
                cb(null, Date.now() + path.extname(file.originalname));
            }
        });
    
        // const fileFilter = (req, file, cb) => {
        //     if(MIME_TYPES.images.includes(file.mimetype)){
        //         cb(null, true);
        //     } else {
        //         cb(null, false);
        //     }
        // };
        // const fileStorage = multer.memoryStorage();
        const upload = multer({
            storage: fileStorage,
            // fileFilter: fileFilter,
            // limits: { fileSize: maxSize },
        });
    
        return upload.single(field);
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    fileUpload
};