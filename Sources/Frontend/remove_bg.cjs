const Jimp = require('jimp');

async function removeWhiteBg() {
  const image = await Jimp.read('src/assets/police-emblem.png');
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const color = image.getPixelColor(x, y);
      const rgba = Jimp.intToRGBA(color);
      // If the pixel is close to white (e.g., r,g,b > 240), make it transparent
      if (rgba.r > 240 && rgba.g > 240 && rgba.b > 240) {
        image.setPixelColor(Jimp.rgbaToInt(255, 255, 255, 0), x, y);
      }
    }
  }
  
  await image.writeAsync('src/assets/police-emblem.png');
  console.log('White background removed!');
}

removeWhiteBg().catch(console.error);
