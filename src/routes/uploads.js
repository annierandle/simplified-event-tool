const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
    'public/images/events',
    'public/images/team'
];

uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created upload directory: ${dir}`);
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'public/images/';
        
        // Determine upload path based on upload type
        if (req.params.type === 'events') {
            uploadPath += 'events/';
        } else if (req.params.type === 'team') {
            uploadPath += 'team/';
        } else {
            uploadPath += 'general/';
        }
        
        const fullPath = path.join(__dirname, '../../', uploadPath);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        
        cb(null, fullPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExtension)
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();
        
        cb(null, baseName + '-' + uniqueSuffix + fileExtension);
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Upload image endpoint
router.post('/:type', upload.single('image'), (req, res) => {
    const uploadType = req.params.type;
    
    console.log(`📸 Uploading ${uploadType} image:`, req.file?.filename);
    
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No file uploaded'
        });
    }
    
    // Construct the public URL path
    const imagePath = `/images/${uploadType}/${req.file.filename}`;
    
    console.log(`✅ Image uploaded successfully: ${imagePath}`);
    
    res.json({
        success: true,
        data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: imagePath,
            size: req.file.size,
            mimetype: req.file.mimetype
        },
        message: 'Image uploaded successfully'
    });
});

// Delete image endpoint
router.delete('/:type/:filename', (req, res) => {
    const { type, filename } = req.params;
    
    console.log(`🗑️ Deleting ${type} image: ${filename}`);
    
    const filePath = path.join(__dirname, '../../public/images', type, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            error: 'File not found'
        });
    }
    
    try {
        fs.unlinkSync(filePath);
        console.log(`✅ Image deleted successfully: ${filename}`);
        
        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting image:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete image'
        });
    }
});

// Get image info endpoint
router.get('/:type/:filename/info', (req, res) => {
    const { type, filename } = req.params;
    
    const filePath = path.join(__dirname, '../../public/images', type, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            error: 'File not found'
        });
    }
    
    try {
        const stats = fs.statSync(filePath);
        
        res.json({
            success: true,
            data: {
                filename,
                path: `/images/${type}/${filename}`,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            }
        });
    } catch (error) {
        console.error('❌ Error getting image info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get image info'
        });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 5MB.'
            });
        }
    }
    
    res.status(400).json({
        success: false,
        error: error.message || 'Upload failed'
    });
});

module.exports = router;