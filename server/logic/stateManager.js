// logic/stateManager.js (ESM)
// Handles conversation state for each session/service

import Service from '../models/Service.js';

const sessionStates = new Map();

export function initializeState(serviceName) {
  return {
    service: serviceName,
    fields: {},
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

export function getNextMissingField(state, requiredFields) {
  for (const field of requiredFields) {
    if (!(field in state.fields)) return field;
  }
  return null;
}

export function updateState(state, field, value) {
  state.fields[field] = value;
}

export function isStateComplete(state, requiredFields) {
  return requiredFields.every(f => f in state.fields);
}
