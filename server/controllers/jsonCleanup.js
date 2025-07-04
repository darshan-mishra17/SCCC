// jsonCleanup.js
// Cleans up common JSON issues (trailing commas, comments, etc.)

function cleanJsonString(str) {
  // Remove JavaScript-style comments
  str = str.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
  // Remove trailing commas in objects and arrays
  str = str.replace(/,\s*([}\]])/g, '$1');
  // Remove newlines before closing brackets
  str = str.replace(/\n(?=\s*[}\]])/g, '');
  // Remove any non-breaking spaces
  str = str.replace(/\u00A0/g, ' ');
  // Remove extra whitespace
  str = str.replace(/\s+/g, ' ');
  return str.trim();
}

module.exports = { cleanJsonString };
