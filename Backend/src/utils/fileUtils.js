import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Delete image file from filesystem
 * @param {string} imagePath - Path to the image file (can be relative or absolute)
 * @returns {Promise<boolean>} - Returns true if file was deleted, false if it didn't exist or wasn't a local file
 */
export const deleteImageFile = async (imagePath) => {
  try {
    // Skip if imagePath is empty or not provided
    if (!imagePath || typeof imagePath !== 'string') {
      return false;
    }

    // Skip external URLs (http:// or https://)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log(`Skipping external URL: ${imagePath}`);
      return false;
    }

    // Construct full file path
    let fullPath;
    
    // If path starts with /uploads, it's a relative path from project root
    if (imagePath.startsWith('/uploads/')) {
      // Remove leading slash and construct path from project root
      fullPath = path.join(process.cwd(), imagePath.substring(1));
    } 
    // If path starts with uploads/ (without leading slash)
    else if (imagePath.startsWith('uploads/')) {
      fullPath = path.join(process.cwd(), imagePath);
    }
    // If it's already an absolute path, use it directly
    else if (path.isAbsolute(imagePath)) {
      fullPath = imagePath;
    }
    // Otherwise, treat it as relative to uploads directory
    else {
      fullPath = path.join(process.cwd(), 'uploads', 'menu-items', path.basename(imagePath));
    }

    // Check if file exists
    if (fs.existsSync(fullPath)) {
      // Delete the file
      fs.unlinkSync(fullPath);
      console.log(`Successfully deleted image file: ${fullPath}`);
      return true;
    } else {
      console.log(`Image file not found: ${fullPath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting image file ${imagePath}:`, error.message);
    // Don't throw error - just log it and continue
    return false;
  }
};

/**
 * Delete multiple image files from filesystem
 * @param {string[]} imagePaths - Array of image paths to delete
 * @returns {Promise<{ deleted: number, failed: number }>} - Returns count of deleted and failed files
 */
export const deleteMultipleImageFiles = async (imagePaths) => {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
    return { deleted: 0, failed: 0 };
  }

  let deleted = 0;
  let failed = 0;

  // Delete all images in parallel
  const deletePromises = imagePaths.map(async (imagePath) => {
    try {
      const result = await deleteImageFile(imagePath);
      if (result) {
        deleted++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to delete image ${imagePath}:`, error.message);
      failed++;
    }
  });

  await Promise.all(deletePromises);

  return { deleted, failed };
};
