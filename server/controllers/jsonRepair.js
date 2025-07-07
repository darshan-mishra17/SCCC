// Utility to attempt to repair malformed JSON using jsonrepair (ESM)
import { jsonrepair } from 'jsonrepair';

export function repairJsonString(str) {
  try {
    return jsonrepair(str);
  } catch (e) {
    console.error('[jsonrepair] Failed to repair JSON:', e.message);
    return str;
  }
}
