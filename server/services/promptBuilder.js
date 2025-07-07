// backend/services/promptBuilder.js


// Build a user-friendly prompt for a required field object
export function buildPromptForField(fieldObj) {
  if (!fieldObj) return 'Please provide the required information.';
  let prompt = fieldObj.label || `Please provide value for ${fieldObj.key}`;
  if (fieldObj.options && Array.isArray(fieldObj.options) && fieldObj.options.length > 0) {
    prompt += ` (options: ${fieldObj.options.join(', ')})`;
  }
  return prompt;
}
