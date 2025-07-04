
// Supported services and their required fields
const serviceFields = {
  ECS: ["os", "systemDisk", "database", "bandwidth"],
  OSS: ["storageClass", "capacity", "region"],
  TDSQL: ["engine", "version", "storage", "instanceType"]
};

// Initialize state for a given service
function initializeState(serviceName) {
  const fields = serviceFields[serviceName];
  if (!fields) throw new Error("Unknown service: " + serviceName);
  const state = { service: serviceName };
  fields.forEach(f => { state[f] = null; });
  state.isComplete = false;
  return state;
}

// Update state based on user message (simple keyword-based extraction)
function updateState(state, userMessage) {
  const fields = serviceFields[state.service];
  let updated = false;
  fields.forEach(field => {
    // Simple regex: look for "field: value" or "field value"
    const regex = new RegExp(field + "[\s:]+([\w.-]+)", "i");
    const match = userMessage.match(regex);
    if (match && !state[field]) {
      state[field] = match[1];
      updated = true;
    }
  });
  state.isComplete = isStateComplete(state);
  return updated;
}

// Get the next missing field
function getNextMissingField(state) {
  const fields = serviceFields[state.service];
  for (let field of fields) {
    if (!state[field]) return field;
  }
  return null;
}

// Check if all required fields are filled
function isStateComplete(state) {
  const fields = serviceFields[state.service];
  return fields.every(f => state[f]);
}

module.exports = {
  initializeState,
  updateState,
  getNextMissingField,
  isStateComplete
};
