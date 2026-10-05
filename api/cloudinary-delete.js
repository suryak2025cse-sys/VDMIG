/**
 * Vercel / Node Serverless Function for Secure Cloudinary Deletion.
 */
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { public_id, resource_type = 'image' } = req.body || {};
    if (!public_id) {
      return res.status(400).json({ error: 'Missing public_id' });
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type,
    });

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    return res.status(500).json({ error: error.message || 'Delete failed' });
  }
}
