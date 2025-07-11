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
  console.log('[DEBUG] updateFields called with:', { fieldKey: fieldObj.key, fieldType: fieldObj.type, value, min: fieldObj.min, max: fieldObj.max });
  
  if (value === undefined || value === null || value === '') {
    console.log('[DEBUG] updateFields: Value is empty, returning');
    return;
  }
  
  if (fieldObj.type === 'number') {
    const num = Number(value);
    console.log('[DEBUG] updateFields: Converting to number:', num);
    
    if (isNaN(num)) {
      console.log('[DEBUG] updateFields: Value is not a number, returning');
      return;
    }
    
    if (fieldObj.min !== undefined && num < fieldObj.min) {
      console.log('[DEBUG] updateFields: Number too small, returning');
      return;
    }
    
    if (fieldObj.max !== undefined && num > fieldObj.max) {
      console.log('[DEBUG] updateFields: Number too large, returning');
      return;
    }
    
    fields[fieldObj.key] = num.toString();
    console.log('[DEBUG] updateFields: Successfully updated field:', fieldObj.key, 'with value:', fields[fieldObj.key]);
  } else {
    fields[fieldObj.key] = value;
    console.log('[DEBUG] updateFields: Successfully updated text field:', fieldObj.key, 'with value:', value);
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
