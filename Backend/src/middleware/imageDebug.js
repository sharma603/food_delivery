/**
 * Middleware to debug image serving issues
 * Use this to check if images are being requested correctly
 */
import path from 'path';
import fs from 'fs';

export const imageDebugMiddleware = (req, res, next) => {
  if (req.path.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), req.path);
    
    console.log('🖼️  Image Request Debug:');
    console.log('  - Request path:', req.path);
    console.log('  - Full file path:', filePath);
    console.log('  - File exists:', fs.existsSync(filePath));
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log('  - File size:', stats.size, 'bytes');
      console.log('  - File modified:', stats.mtime);
    } else {
      console.error('  - ❌ FILE NOT FOUND!');
      
      // Try to find the file in different locations
      const altPaths = [
        path.join(process.cwd(), 'Backend', req.path.substring(1)),
        path.join(process.cwd(), 'src', req.path.substring(1)),
      ];
      
      console.log('  - Checking alternative paths:');
      altPaths.forEach(altPath => {
        console.log(`    - ${altPath}: ${fs.existsSync(altPath) ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      });
    }
  }
  
  next();
};

export default imageDebugMiddleware;
