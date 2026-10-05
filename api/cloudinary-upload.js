/**
 * Vercel / Node Serverless Function for Secure Cloudinary Uploads.
 * Keeps CLOUDINARY_API_SECRET strictly on the server side.
 */
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side using non-VITE environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        error: 'Cloudinary server credentials missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      });
    }

    let fileData;
    let folder = 'community/gallery';
    let resourceType = 'auto';
    let customName = '';

    // Handle multipart or JSON base64 / data URI payload
    if (req.body && typeof req.body === 'object') {
      fileData = req.body.file || req.body.data;
      folder = req.body.folder || folder;
      resourceType = req.body.resource_type || resourceType;
      customName = req.body.custom_name || '';
    }

    if (!fileData) {
      return res.status(400).json({ error: 'No file data received.' });
    }

    // Perform Cloudinary upload
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      public_id: customName ? `${customName}-${Date.now()}` : undefined,
    };

    const uploadResult = await cloudinary.uploader.upload(fileData, uploadOptions);

    return res.status(200).json({
      url: uploadResult.secure_url || uploadResult.url,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      resource_type: uploadResult.resource_type,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      original_filename: uploadResult.original_filename,
    });
  } catch (error) {
    console.error('Cloudinary Serverless Upload Error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
