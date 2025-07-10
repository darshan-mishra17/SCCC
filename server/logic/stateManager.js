// logic/stateManager.js (ESM)
// Handles conversation state for each session/service

import Service from '../models/Service.js';

const sessionStates = new Map();


// Multi-service: initialize state with one or more services
export function initializeState(serviceNames) {
  // serviceNames: array of service keys (e.g. ['ecs', 'tdsql'])
  if (!Array.isArray(serviceNames)) serviceNames = [serviceNames];
  return {
    services: serviceNames.map(name => ({ name, fields: {}, complete: false })),
    currentServiceIdx: 0,
    complete: false
  };
}

export function getSessionState(sessionId) {
  if (!sessionStates.has(sessionId)) return null;
  return sessionStates.get(sessionId);
}

export function setSessionState(sessionId, state) {
  sessionStates.set(sessionId, state);
}


export async function getRequiredFields(serviceName) {
  // Fetch required fields for the service from MongoDB
  const service = await Service.findOne({ name: serviceName });
  return service ? service.requiredFields : [];
}



// Returns the first required field object that is missing from fields

// A field is only considered filled if it exists and is non-empty/non-null/non-undefined
export function getNextMissingField(fields, requiredFields) {
  for (const fieldObj of requiredFields) {
    const val = fields[fieldObj.key];
    if (
      val === undefined || val === null || val === '' ||
      (fieldObj.type === 'number' && (isNaN(Number(val)) || val === 'NaN'))
    ) {
      return fieldObj;
    }
    // Optionally, add more validation for min/max/options here if needed
  }
  return null;
}



// Update fields with the field key from the field object

// Only update if value is valid (non-empty, non-null, in range for numbers)
export function updateFields(fields, fieldObj, value) {
  if (value === undefined || value === null || value === '') return;
  if (fieldObj.type === 'number') {
    const num = Number(value);
    if (isNaN(num)) return;
    if (fieldObj.min !== undefined && num < fieldObj.min) return;
    if (fieldObj.max !== undefined && num > fieldObj.max) return;
    fields[fieldObj.key] = num.toString();
  } else {
    fields[fieldObj.key] = value;
  }
}



export function isFieldsComplete(fields, requiredFields) {
  return requiredFields.every(fieldObj => {
    const val = fields[fieldObj.key];
    return !(
      val === undefined || val === null || val === '' ||
      (fieldObj.type === 'number' && (isNaN(Number(val)) || val === 'NaN'))
    );
  });
}
