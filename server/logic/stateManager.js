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
export function getNextMissingField(fields, requiredFields) {
  for (const fieldObj of requiredFields) {
    if (!(fieldObj.key in fields)) return fieldObj;
  }
  return null;
}



// Update fields with the field key from the field object
export function updateFields(fields, fieldObj, value) {
  fields[fieldObj.key] = value;
}



export function isFieldsComplete(fields, requiredFields) {
  return requiredFields.every(f => f.key in fields);
}
