import fs from 'fs';
import path from 'path';

const distPath = path.resolve('./dist');
const indexPath = path.join(distPath, 'index.html');
const staticPath = path.join(distPath, 'static');

// Check if index.html exists
if (fs.existsSync(indexPath)) {
  // Create static folder if it doesn't exist
  if (!fs.existsSync(staticPath)) {
    fs.mkdirSync(staticPath, { recursive: true });
  }
  // Move index.html into the static folder
  fs.renameSync(indexPath, path.join(staticPath, 'index.html'));
  console.log('index.html moved to static folder.');
} else {
  console.error('index.html not found!');
}
