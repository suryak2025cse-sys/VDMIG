/**
 * Cloudinary Media Storage Service
 * Handles uploading, deleting, and URL generation for images, audio, and documents
 * with strict security (No API Secret on frontend).
 */

// Supported folders
export const CLOUDINARY_FOLDERS = {
  songs: 'community/songs',
  gallery: 'community/gallery',
  'payment-proofs': 'community/payment-screenshots',
  avatars: 'community/profiles',
  logos: 'community/logos',
};

// File validation constraints
export const FILE_VALIDATION = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    errorMsg: 'Please upload a valid image file (JPG, PNG, WEBP) under 10MB.',
  },
  video: {
    maxSize: 50 * 1024 * 1024, // 50MB (Songs/Audio handled as video resource in Cloudinary)
    allowedExtensions: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'mp4', 'webm'],
    allowedMimes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/m4a',
      'audio/x-m4a',
      'audio/aac',
      'audio/ogg',
      'video/mp4',
      'video/webm',
    ],
    errorMsg: 'Please upload a valid audio song file (MP3, WAV, M4A) under 50MB.',
  },
};

/**
 * Validates a file before upload
 */
export function validateMediaFile(file, type = 'image') {
  if (!file) throw new Error('No file provided for upload.');

  const config = FILE_VALIDATION[type] || FILE_VALIDATION.image;

  if (file.size > config.maxSize) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum limit of ${(config.maxSize / (1024 * 1024)).toFixed(0)}MB.`);
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  const isExtensionValid = ext && config.allowedExtensions.includes(ext);
  const isMimeValid = !file.type || config.allowedMimes.includes(file.type.toLowerCase()) || file.type.startsWith(type === 'video' ? 'audio/' : 'image/');

  if (!isExtensionValid && !isMimeValid) {
    throw new Error(config.errorMsg);
  }

  return true;
}

/**
 * Uploads a file to Cloudinary.
 * Prioritizes secure backend API (/api/cloudinary-upload or /api/cloudinary-sign),
 * with unsigned preset fallback if configured.
 */
export async function cloudinaryUpload({ file, bucket = 'gallery', customName = '', onProgress = null }) {
  const folder = CLOUDINARY_FOLDERS[bucket] || `community/${bucket}`;
  const isAudioOrVideo = bucket === 'songs' || file.type.startsWith('audio/') || file.type.startsWith('video/');
  const resourceType = isAudioOrVideo ? 'video' : 'image';

  // 1. Validate file
  validateMediaFile(file, resourceType);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

  // 2. Try Serverless Upload Endpoint first (Vercel / Node backend)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('resource_type', resourceType);
    if (customName) formData.append('custom_name', customName);

    const apiResponse = await fetch('/api/cloudinary-upload', {
      method: 'POST',
      body: formData,
    });

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      if (data && (data.secure_url || data.url)) {
        return {
          url: data.secure_url || data.url,
          publicId: data.public_id,
          resourceType: data.resource_type || resourceType,
          format: data.format,
          bytes: data.bytes,
        };
      }
    }
  } catch (err) {
    // If /api endpoint is not available (e.g. running in pure Vite dev without serverless runtime), fall through to signed or preset upload
  }

  // 3. Try Server-side Signed Direct Upload if sign endpoint is available
  try {
    const signResponse = await fetch('/api/cloudinary-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, resource_type: resourceType }),
    });

    if (signResponse.ok) {
      const { signature, timestamp, apiKey, cloudName: signedCloudName } = await signResponse.json();
      if (signature && timestamp && apiKey && signedCloudName) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signedCloudName}/${resourceType}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const result = await uploadRes.json();
          return {
            url: result.secure_url || result.url,
            publicId: result.public_id,
            resourceType: result.resource_type || resourceType,
            format: result.format,
            bytes: result.bytes,
          };
        }
      }
    }
  } catch (err) {
    // Fall through to unsigned preset
  }

  // 4. Try Direct Cloudinary Upload via Unsigned Preset (if client env variables configured)
  if (cloudName && uploadPreset) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const directRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (directRes.ok) {
      const result = await directRes.json();
      return {
        url: result.secure_url || result.url,
        publicId: result.public_id,
        resourceType: result.resource_type || resourceType,
        format: result.format,
        bytes: result.bytes,
      };
    } else {
      const errJson = await directRes.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || 'Cloudinary upload failed.');
    }
  }

  // 5. Local Fallback (for offline demo mode if no cloud credentials provided)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: reader.result,
        publicId: `local-${Date.now()}`,
        resourceType,
        format: file.name.split('.').pop(),
        bytes: file.size,
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts the public_id from a Cloudinary URL
 */
export function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    let pathAfterUpload = url.substring(uploadIndex + 8);
    // Remove version like v123456789/ if present
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return pathAfterUpload.substring(0, lastDotIndex);
    }
    return pathAfterUpload;
  } catch (e) {
    return null;
  }
}

/**
 * Deletes a file from Cloudinary via serverless endpoint.
 */
export async function cloudinaryDelete(publicIdOrUrl, resourceType = 'image') {
  if (!publicIdOrUrl) return true;
  const publicId = publicIdOrUrl.includes('http') ? extractCloudinaryPublicId(publicIdOrUrl) : publicIdOrUrl;
  if (!publicId || publicId.startsWith('local-')) return true;

  try {
    const response = await fetch('/api/cloudinary-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId, resource_type: resourceType }),
    });
    return response.ok;
  } catch (err) {
    console.warn('Cloudinary delete request failed:', err);
    return false;
  }
}

/**
 * Generates an optimized Cloudinary delivery URL with transformations.
 */
export function cloudinaryGetUrl(publicIdOrUrl, options = {}) {
  if (!publicIdOrUrl) return '';
  if (publicIdOrUrl.startsWith('data:') || publicIdOrUrl.startsWith('blob:')) return publicIdOrUrl;

  // If already a full Cloudinary URL and transformations requested
  if (publicIdOrUrl.includes('cloudinary.com') && options.width) {
    return publicIdOrUrl.replace('/upload/', `/upload/w_${options.width},q_auto,f_auto/`);
  }

  return publicIdOrUrl;
}
