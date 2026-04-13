import fs from 'node:fs';
import path from 'node:path';

const sourceDir = path.join(process.cwd(), 'src', 'public');
const targetDir = path.join(process.cwd(), 'dist', 'public');

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);

    if (item.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirectory(sourceDir, targetDir);
console.log(`Copied public assets to ${targetDir}`);
