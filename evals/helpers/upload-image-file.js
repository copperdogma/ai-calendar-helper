// Uploads an image to OpenAI Files (purpose: vision) the first time it is seen
// and returns { fileId: 'file-...' }. Used as a transformVars script in promptfoo.
// The function can be async; promptfoo awaits it.

const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const client = new OpenAI();

const CACHE_PATH = path.join(__dirname, 'fileIdCache.json');

// simple JSON cache { absolutePath: file_id }
function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch (_) {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

module.exports = async function transformVars(vars) {
  if (!vars.image) return {};

  const abs = path.resolve(vars.image);
  let cache = loadCache();

  if (!cache[abs]) {
    // Upload file
    const stream = fs.createReadStream(abs);
    const file = await client.files.create({ file: stream, purpose: 'vision' });
    cache[abs] = file.id;
    saveCache(cache);
  }

  return {
    fileId: cache[abs],
  };
}; 