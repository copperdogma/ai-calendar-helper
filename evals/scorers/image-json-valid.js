module.exports = async function score(response, _prompt, _config) {
  try {
    const parsed = JSON.parse(response.trim());
    if (parsed && (Array.isArray(parsed.events) ? parsed.events.length > 0 : parsed.title)) {
      return 1;
    }
    return 0;
  } catch {
    return 0;
  }
};
