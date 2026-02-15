import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';

const inputPath = '../../public/ShardDen Logo.png';
const pngOutput = 'src-tauri/icons/icon.png';
const icoOutput = 'src-tauri/icons/icon.ico';

// Resize to 256x256 square and save as PNG
sharp(inputPath)
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(pngOutput)
  .then(() => {
    console.log('PNG resized successfully');
    // Then convert to ICO
    return pngToIco(pngOutput);
  })
  .then(buf => fs.writeFileSync(icoOutput, buf))
  .then(() => console.log('ICO created successfully'))
  .catch(console.error);
