const fs = require('fs');
const path = require('path');

/**
 * Nunjucks helper: read file and return base64 string (no MIME prefix)
 * Usage: {{ base64(image) }}
 */
module.exports = function base64(filePath) {
  const abs = path.resolve(filePath);
  return fs.readFileSync(abs, { encoding: 'base64' });
};

/**
 * Return a full data URL (data:image/<ext>;base64,...) for the given image path.
 * Infers mime from file extension.
 */
module.exports.dataUrl = function dataUrl(filePath) {
  const abs = path.resolve(filePath);
  const ext = path.extname(abs).toLowerCase().replace('.', '');
  const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp' };
  const mime = mimeMap[ext] || 'jpeg';
  const b64 = fs.readFileSync(abs, { encoding: 'base64' });
  return `data:image/${mime};base64,${b64}`;
};
