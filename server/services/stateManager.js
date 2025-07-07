// backend/services/stateManager.js

export function initializeState(serviceName, requiredFields = []) {
  const state = {
    service: serviceName,
    isComplete: false
  };

  requiredFields.forEach(field => {
    state[field] = null;
  });

  return state;
}

export function updateState(state, fieldName, value) {
  state[fieldName] = value;
  return checkCompletion(state);
}

export function getNextMissingField(state) {
  for (const key of Object.keys(state)) {
    if (key !== 'service' && key !== 'isComplete' && state[key] === null) {
      return key;
    }
  }
  return null;
}

export function checkCompletion(state) {
  const requiredFields = Object.keys(state).filter(
    key => key !== 'service' && key !== 'isComplete'
  );

  const isComplete = requiredFields.every(field => state[field] !== null);
  state.isComplete = isComplete;
  return state;
}
