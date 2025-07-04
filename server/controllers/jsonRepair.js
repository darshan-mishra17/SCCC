// Utility to attempt to repair malformed JSON using jsonrepair
const { jsonrepair } = require('jsonrepair');

function repairJsonString(str) {
  try {
    return jsonrepair(str);
  } catch (e) {
    console.error('[jsonrepair] Failed to repair JSON:', e.message);
    return str;
  }
}

module.exports = { repairJsonString };
