import express from 'express';
import { getGroqAIResponse, getGroqConversationalResponse, getGroqNumericExtraction, getGroqExplanation } from '../logic/groq.js';
import { initializeState, getSessionState, setSessionState, getRequiredFields, getNextMissingField, updateFields, isFieldsComplete } from '../logic/stateManager.js';
import { buildPromptForField } from '../services/promptBuilder.js';
import { calculatePricing } from '../logic/pricing.js';

// Helper to ensure messages are always strings
function stringifyMessage(msg) {
  console.log('[DEBUG] stringifyMessage input:', JSON.stringify(msg, null, 2), 'Type:', typeof msg);
  if (typeof msg === 'string') {
    // If it's already the problematic "[object Object]" string, that means something went wrong earlier
    if (msg === '[object Object]') {
      console.error('[ERROR] Received [object Object] string - this should not happen');
      return 'Sorry, there was an error processing the message.';
    }
    return msg;
  }
  if (typeof msg === 'object' && msg !== null) {
    console.log('[DEBUG] Object keys:', Object.keys(msg));
    // Try different possible message properties
    if (msg.message && typeof msg.message === 'string') return msg.message;
    if (msg.response && typeof msg.response === 'string') return msg.response;
    if (msg.question && typeof msg.question === 'string') return msg.question;
    if (msg.text && typeof msg.text === 'string') return msg.text;
    if (msg.content && typeof msg.content === 'string') return msg.content;
    
    // If no string property found, stringify the whole object
    const result = JSON.stringify(msg);
    console.log('[DEBUG] Stringified object result:', result);
    return result;
  }
  const result = String(msg);
  console.log('[DEBUG] String conversion result:', result);
  return result;
}

const router = express.Router();

// Add a simple in-memory chat history per session
const chatHistories = new Map();

// POST /api/ai/message
// AI-powered, catalog-driven, dynamic field extraction
// Debug: log every incoming request to /api/ai/message
router.post('/message', async (req, res) => {
  console.log('[DEBUG] Incoming /api/ai/message:', req.body);
  try {
    const { sessionId, userMessage } = req.body;
    if (!sessionId || !userMessage) {
      return res.status(400).json({ error: 'Missing sessionId or userMessage' });
    }

    // Track chat history for this session
    if (!chatHistories.has(sessionId)) chatHistories.set(sessionId, []);
    chatHistories.get(sessionId).push({ role: 'user', content: userMessage });

    let state = getSessionState(sessionId);
    // Step 1: Service selection if not started
    if (!state) {
      // Detect multiple services in user message
      let serviceNames = [];
      if (/ecs|virtual machine|vm|compute|server|instance/i.test(userMessage)) serviceNames.push('ecs');
      if (/oss|object storage|storage|files|backup/i.test(userMessage)) serviceNames.push('oss');
      if (/tdsql|database|mysql|postgres|db|sql/i.test(userMessage)) serviceNames.push('tdsql');
      
      if (serviceNames.length === 0) {
        // Let AI handle the greeting and first question
        const aiMsg = await getGroqConversationalResponse(
          `The user said: "${userMessage}". Greet them warmly and ask which cloud service they're interested in. Our services are ECS (compute instances), OSS (object storage), or TDSQL (database). Be friendly and helpful.`
        );
        const msg = stringifyMessage(aiMsg);
        chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
        return res.json({ message: msg });
      }
      state = initializeState(serviceNames);
      setSessionState(sessionId, state);
    }

    // Multi-service: handle each service in order
    const { services, currentServiceIdx } = state;
    const currentService = services[currentServiceIdx];
    let requiredFields;
    try {
      requiredFields = await getRequiredFields(currentService.name);
      if (!requiredFields || !Array.isArray(requiredFields) || requiredFields.length === 0) {
        throw new Error('No required fields found for service: ' + currentService.name);
      }
    } catch (err) {
      console.error('[AI ROUTE] Error fetching required fields:', err);
      return res.status(500).json({ error: 'Failed to fetch required fields for service: ' + currentService.name });
    }
    // Debug: log required fields
    console.log('[DEBUG] requiredFields:', requiredFields);

    // Find next missing field for current service
    let nextFieldObj = getNextMissingField(currentService.fields, requiredFields);
    // Debug: log next field object
    console.log('[DEBUG] nextFieldObj:', nextFieldObj);
    if (!nextFieldObj) {
      services[currentServiceIdx].complete = true;
      if (currentServiceIdx < services.length - 1) {
        state.currentServiceIdx++;
        setSessionState(sessionId, state);
        // Let AI introduce the next service naturally
        const nextServiceName = services[state.currentServiceIdx].name.toUpperCase();
        const aiMsg = await getGroqConversationalResponse(
          `The user has finished configuring ${currentService.name.toUpperCase()}. Now they need to configure ${nextServiceName}. Transition smoothly and ask if they're ready to configure ${nextServiceName}.`
        );
        const msg = stringifyMessage(aiMsg);
        chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
        return res.json({ message: msg });
      } else {
        // All services complete, show summary and pricing
        console.log('[DEBUG] *** ALL SERVICES COMPLETE - CALCULATING PRICING ***');
        console.log('[DEBUG] Final services configuration:', JSON.stringify(services, null, 2));
        
        // Calculate pricing for each service
        const servicesArr = [];
        let totalCost = 0;
        let totalSubtotal = 0;
        let totalVAT = 0;
        
        for (const service of services) {
          console.log(`[DEBUG] Processing pricing for ${service.name}:`, service.fields);
          
          let servicePricing = { subtotalSAR: 0, vatSAR: 0, totalMonthlySAR: 0 };
          
          try {
            // Use the enhanced pricing engine for all services
            const { calculateServicePricing } = await import('../services/enhancedPricingEngine.js');
            servicePricing = calculateServicePricing(service.name, service.fields);
            console.log(`[DEBUG] ${service.name} pricing result:`, servicePricing);
          } catch (e) {
            console.error(`[DEBUG] Pricing error for ${service.name}:`, e);
            servicePricing = { subtotalSAR: 0, vatSAR: 0, totalMonthlySAR: 0 };
          }
          
          // Build service summary for frontend - pass fields as object
          servicesArr.push({
            name: service.name.toUpperCase(),
            config: service.fields, // Pass the actual fields object
            monthlyCost: servicePricing.totalMonthlySAR,
            subtotal: servicePricing.subtotalSAR || servicePricing.subtotal,
            vat: servicePricing.vatSAR || servicePricing.vat
          });
          
          totalCost += servicePricing.totalMonthlySAR || 0;
          totalSubtotal += servicePricing.subtotalSAR || servicePricing.subtotal || 0;
          totalVAT += servicePricing.vatSAR || servicePricing.vat || 0;
        }
        
        const totalPricing = {
          subtotal: +totalSubtotal.toFixed(2),
          vat: +totalVAT.toFixed(2),
          totalMonthlySAR: +totalCost.toFixed(2)
        };
        
        console.log('[DEBUG] *** FINAL PRICING SUMMARY ***');
        console.log('[DEBUG] Services:', servicesArr);
        console.log('[DEBUG] Total pricing:', totalPricing);
        
        // Generate a final summary message
        const summaryMsg = `Configuration complete! Total monthly cost: ${totalPricing.totalMonthlySAR} SAR (including VAT)`;
        chatHistories.get(sessionId).push({ role: 'assistant', content: summaryMsg });
        
        // Clear session
        setSessionState(sessionId, null);
        chatHistories.delete(sessionId);
        
        return res.json({ 
          message: summaryMsg,
          services: servicesArr, 
          pricing: totalPricing,
          complete: true
        });
      }
    }

    // If this is the very first interaction after service selection (chat history only has user service selection), send first field prompt
    const chatHistory = chatHistories.get(sessionId) || [];
    const isFirstFieldPrompt = chatHistory.length === 1 && Object.keys(currentService.fields).length === 0;
    
    if (isFirstFieldPrompt) {
      // Prompt for the first required field
      const firstField = requiredFields[0];
      let messageText;
      // Use aiQuestion if available, else build a detailed prompt
      if (firstField.aiQuestion) {
        messageText = firstField.aiQuestion;
      } else if (firstField.options && Array.isArray(firstField.options) && firstField.options.length > 0) {
        const fieldContext = firstField.label || firstField.key;
        const description = firstField.description ? ` ${firstField.description}.` : '';
        messageText = `What ${fieldContext.toLowerCase()} would you like?${description} Available options: ${firstField.options.join(', ')}. If you need help choosing, I can explain each option.`;
      } else if (firstField.type === 'number' || (firstField.min && firstField.max)) {
        messageText = `Please enter a value for ${firstField.label || firstField.key}`;
        if (firstField.min !== undefined && firstField.max !== undefined) {
          messageText += ` (range: ${firstField.min} to ${firstField.max})`;
        }
      } else {
        messageText = `What would you like for ${firstField.label || firstField.key}?`;
      }
      chatHistories.get(sessionId).push({ role: 'assistant', content: messageText });
      return res.json({ message: messageText });
    }

    // Process user input for the current field - EXTRACT VALUE FIRST
    console.log('[DEBUG] About to start field extraction logic');
    
    // Check if user is asking for help or explanation
    const isHelpRequest = /\b(help|explain|what|how|tell me|info|information|details|options|choices|difference|clarify|don't understand|confused)\b/i.test(userMessage) ||
                         userMessage.includes('?');
    
    if (isHelpRequest) {
      console.log('[DEBUG] User is asking for help/explanation');
      let explanation;
      
      if (nextFieldObj.options && nextFieldObj.options.length > 0) {
        // Explain the options for this field with specific context
        const fieldContext = nextFieldObj.label || nextFieldObj.key;
        const description = nextFieldObj.description || '';
        const units = nextFieldObj.units ? ` (${nextFieldObj.units})` : '';
        const serviceContext = currentService.name || 'cloud service';
        
        explanation = await getGroqExplanation(
          `For ${serviceContext}, explain these ${fieldContext.toLowerCase()}${units} options: ${nextFieldObj.options.join(', ')}. ${description} Compare their benefits, use cases, and when to choose each one.`
        );
      } else if (nextFieldObj.type === 'number' || nextFieldObj.min !== undefined) {
        const fieldContext = nextFieldObj.label || nextFieldObj.key;
        const units = nextFieldObj.units ? ` (${nextFieldObj.units})` : '';
        const rangeInfo = (nextFieldObj.min !== undefined && nextFieldObj.max !== undefined) 
          ? ` (range: ${nextFieldObj.min}-${nextFieldObj.max})` 
          : '';
        const description = nextFieldObj.description || '';
        const serviceContext = currentService.name || 'cloud service';
        
        explanation = await getGroqExplanation(
          `For ${serviceContext}, explain how to choose the right ${fieldContext.toLowerCase()}${units}${rangeInfo}. ${description} What factors should customers consider when deciding this value?`
        );
      } else {
        const fieldContext = nextFieldObj.label || nextFieldObj.key;
        const description = nextFieldObj.description || '';
        const serviceContext = currentService.name || 'cloud service';
        
        explanation = await getGroqExplanation(
          `For ${serviceContext}, explain what ${fieldContext.toLowerCase()} means and how to choose the right value. ${description} Provide practical guidance for customers.`
        );
      }
      
      const msg = stringifyMessage(explanation);
      chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
      return res.json({ message: msg });
    }
    
    // Check if user provided answers for multiple fields at once
    const allFieldKeys = requiredFields.map(f => f.key);
    const multiFieldAnswers = {};
    let foundMultipleAnswers = false;
    
    // Try to extract values for all missing fields from the user message
    for (const field of requiredFields) {
      if (currentService.fields[field.key]) continue; // Skip already filled fields
      
      let value = null;
      
      if (field.options && Array.isArray(field.options)) {
        // Look for field-specific keywords or option matches
        const userInput = userMessage.toLowerCase();
        value = field.options.find(opt => {
          const normOpt = opt.toLowerCase();
          return userInput.includes(normOpt) || normOpt.includes(userInput);
        });
      } else if (field.type === 'number' || field.min !== undefined) {
        // Extract numbers - could be multiple in the message
        const numbers = userMessage.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          // For now, just take the first number found
          const num = parseInt(numbers[0], 10);
          if ((field.min === undefined || num >= field.min) && 
              (field.max === undefined || num <= field.max)) {
            value = num.toString();
          }
        }
      }
      
      if (value) {
        multiFieldAnswers[field.key] = value;
        foundMultipleAnswers = true;
      }
    }
    
    // If multiple fields found, confirm with user before proceeding
    if (foundMultipleAnswers && Object.keys(multiFieldAnswers).length > 1) {
      console.log('[DEBUG] Found multiple field answers:', multiFieldAnswers);
      
      // Build confirmation message
      const confirmationItems = Object.entries(multiFieldAnswers).map(([key, value]) => {
        const field = requiredFields.find(f => f.key === key);
        const label = field ? (field.label || field.key) : key;
        return `${label}: ${value}`;
      });
      
      const confirmationMsg = await getGroqConversationalResponse(
        `The user provided multiple answers: ${confirmationItems.join(', ')}. Ask them to confirm if these are correct before proceeding. Be conversational and friendly.`
      );
      
      // Store the potential answers for next interaction
      state.pendingAnswers = multiFieldAnswers;
      setSessionState(sessionId, state);
      
      const msg = stringifyMessage(confirmationMsg);
      chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
      return res.json({ message: msg });
    }
    
    // Check if user is confirming previously suggested answers
    if (state.pendingAnswers && /\b(yes|correct|right|ok|confirm|that's right|looks good)\b/i.test(userMessage)) {
      console.log('[DEBUG] User confirmed pending answers');
      
      // Apply all pending answers
      for (const [fieldKey, value] of Object.entries(state.pendingAnswers)) {
        const field = requiredFields.find(f => f.key === fieldKey);
        if (field) {
          updateFields(currentService.fields, field, value);
        }
      }
      
      // Clear pending answers
      delete state.pendingAnswers;
      setSessionState(sessionId, state);
      
      // Check if all fields are now complete
      const nextField = getNextMissingField(currentService.fields, requiredFields);
      if (nextField) {
        // Ask for the next missing field
        let nextPrompt;
        if (nextField.aiQuestion) {
          nextPrompt = nextField.aiQuestion;
        } else {
          nextPrompt = `What would you like for ${nextField.label || nextField.key}?`;
        }
        chatHistories.get(sessionId).push({ role: 'assistant', content: nextPrompt });
        return res.json({ message: nextPrompt });
      } else {
        // All fields complete for this service
        services[currentServiceIdx].complete = true;
        // Continue with service completion logic...
        if (currentServiceIdx < services.length - 1) {
          state.currentServiceIdx++;
          setSessionState(sessionId, state);
          const nextServiceName = services[state.currentServiceIdx].name.toUpperCase();
          const aiMsg = await getGroqConversationalResponse(
            `The user has finished configuring ${currentService.name.toUpperCase()}. Now they need to configure ${nextServiceName}. Transition smoothly and ask if they're ready to configure ${nextServiceName}.`
          );
          const msg = stringifyMessage(aiMsg);
          chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
          return res.json({ message: msg });
        } else {
          // All services complete - proceed to pricing calculation
          // (Pricing logic will be handled in the main flow below)
        }
      }
    }
    
    // Check if user is rejecting previously suggested answers
    if (state.pendingAnswers && /\b(no|wrong|incorrect|not right|fix|change)\b/i.test(userMessage)) {
      console.log('[DEBUG] User rejected pending answers');
      
      // Clear pending answers and ask for the current field again
      delete state.pendingAnswers;
      setSessionState(sessionId, state);
      
      const retryMsg = await getGroqConversationalResponse(
        `The user wants to correct their previous answers. Ask them to provide the correct information for ${nextFieldObj.label || nextFieldObj.key} step by step. Be helpful and understanding.`
      );
      
      const msg = stringifyMessage(retryMsg);
      chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
      return res.json({ message: msg });
    }
    
    // Enhanced field extraction logic
    let extractedValue = null;
    
    // Debug: print nextFieldObj and requiredFields before extraction
    console.log('[DEBUG] nextFieldObj:', nextFieldObj);
    console.log('[DEBUG] requiredFields:', requiredFields);
    
    // Option field: robust match user input to available options (trim, lowercase, allow partial)
    if (nextFieldObj.options && Array.isArray(nextFieldObj.options)) {
      const userInput = userMessage.trim().toLowerCase();
      console.log('[DEBUG] Option extraction - userInput:', userInput, 'options:', nextFieldObj.options);
      // Exact match
      extractedValue = nextFieldObj.options.find(opt => {
        const normOpt = opt.trim().toLowerCase();
        const isExact = normOpt === userInput;
        if (isExact) console.log('[DEBUG] Exact match:', normOpt, userInput);
        return isExact;
      });
      // Partial match if no exact
      if (!extractedValue) {
        extractedValue = nextFieldObj.options.find(opt => {
          const normOpt = opt.trim().toLowerCase();
          const isPartial = userInput.includes(normOpt) || normOpt.includes(userInput);
          if (isPartial) console.log('[DEBUG] Partial match:', normOpt, userInput);
          return isPartial;
        });
      }
      console.log('[DEBUG] Option extraction result:', extractedValue);
    } else if (
      nextFieldObj.type === 'number' ||
      nextFieldObj.min !== undefined ||
      nextFieldObj.max !== undefined ||
      ['count', 'size', 'nodes', 'storageGB', 'diskSize'].includes(nextFieldObj.key)
    ) {
      // Extract numbers from anywhere in the message (e.g. "2 instances", "I want 2")
      const numberMatches = userMessage.match(/\d+/g);
      if (numberMatches && numberMatches.length > 0) {
        let number = parseInt(numberMatches[0], 10);
        // If multiple numbers, try to pick the most relevant one
        if (numberMatches.length > 1) {
          // For storage fields, prefer larger numbers
          if (nextFieldObj.key.includes('storage') || nextFieldObj.key.includes('disk')) {
            number = Math.max(...numberMatches.map(n => parseInt(n, 10)));
          }
        }
        // Validate against constraints
        if (nextFieldObj.min !== undefined && number < nextFieldObj.min) {
          console.log('[DEBUG] Number too small:', number, 'min:', nextFieldObj.min);
          extractedValue = null; // Will ask again with guidance
        } else if (nextFieldObj.max !== undefined && number > nextFieldObj.max) {
          console.log('[DEBUG] Number too large:', number, 'max:', nextFieldObj.max);
          extractedValue = null; // Will ask again with guidance
        } else {
          extractedValue = number.toString();
          console.log('[DEBUG] Found valid number:', extractedValue);
        }
      } else {
        console.log('[DEBUG] No number found in user message for numeric field');
      }
    } else {
      // For text fields, be more permissive but validate
      const trimmed = userMessage.trim();
      if (trimmed.length > 0 && trimmed.length < 200 && 
          !trimmed.toLowerCase().includes('help') && 
          !trimmed.toLowerCase().includes('what') && 
          !trimmed.toLowerCase().includes('how') &&
          !trimmed.toLowerCase().includes('?')) {
        extractedValue = trimmed;
        console.log('[DEBUG] Using message as text field:', extractedValue);
      }
    }
    
    // If direct extraction failed, try AI-powered extraction as fallback
    if (!extractedValue) {
      console.log('[DEBUG] Direct extraction failed, trying AI extraction...');
      try {
        let extractionPrompt;
        let aiExtracted;
        
        if (nextFieldObj.options && nextFieldObj.options.length > 0) {
          extractionPrompt = `From this user message: "${userMessage}", extract which option they chose for ${nextFieldObj.label}. Available options are: ${nextFieldObj.options.join(', ')}. Return just the exact option name, or "null" if unclear.`;
          aiExtracted = await getGroqConversationalResponse(extractionPrompt);
        } else if (nextFieldObj.type === 'number' || nextFieldObj.min !== undefined) {
          extractionPrompt = `Extract the numeric value from this user message: "${userMessage}"`;
          aiExtracted = await getGroqNumericExtraction(extractionPrompt);
        } else {
          extractionPrompt = `From this user message: "${userMessage}", extract the value for ${nextFieldObj.label}. Return just the value, or "null" if unclear.`;
          aiExtracted = await getGroqConversationalResponse(extractionPrompt);
        }
        
        let cleanedAI = aiExtracted.trim().replace(/['"]/g, '');
        console.log('[DEBUG] AI extracted response:', cleanedAI);
        
        if (cleanedAI && cleanedAI.toLowerCase() !== 'null' && cleanedAI.toLowerCase() !== 'invalid' && cleanedAI.length > 0) {
          // For options, validate against available options
          if (nextFieldObj.options && nextFieldObj.options.length > 0) {
            const matchedOption = nextFieldObj.options.find(opt => 
              opt.toLowerCase() === cleanedAI.toLowerCase()
            );
            if (matchedOption) {
              extractedValue = matchedOption;
              console.log('[DEBUG] AI found option match:', matchedOption);
            }
          } else if (nextFieldObj.type === 'number' || nextFieldObj.min !== undefined) {
            // For number fields, accept a string that is a valid number
            const numStr = cleanedAI.trim();
            console.log('[DEBUG] Checking numeric string:', numStr);
            if (/^\d+(\.\d+)?$/.test(numStr)) {
              const num = parseInt(numStr, 10);
              if ((nextFieldObj.min === undefined || num >= nextFieldObj.min) &&
                  (nextFieldObj.max === undefined || num <= nextFieldObj.max)) {
                extractedValue = num.toString();
                console.log('[DEBUG] AI extracted valid number:', extractedValue);
              } else {
                console.log('[DEBUG] AI extracted number out of range:', num);
              }
            } else {
              console.log('[DEBUG] AI numeric extraction failed - not a valid number format:', numStr);
            }
          } else {
            extractedValue = cleanedAI;
            console.log('[DEBUG] AI extracted value:', cleanedAI);
          }
        }
      } catch (e) {
        console.log('[DEBUG] AI extraction failed:', e.message);
      }
    }

    console.log('[DEBUG] Final extracted value:', extractedValue, 'for field:', nextFieldObj.key);

    // Handle successful field extraction
    if (extractedValue !== null && extractedValue !== undefined && extractedValue !== '') {
      console.log('[DEBUG] *** UPDATING FIELD ***');
      // Always store as string for comparison
      console.log('[DEBUG] About to update field:', nextFieldObj.key, 'with value:', extractedValue);
      console.log('[DEBUG] Fields before update:', JSON.stringify(currentService.fields));
      updateFields(currentService.fields, nextFieldObj, extractedValue.toString());
      setSessionState(sessionId, state);
      console.log('[DEBUG] Fields after update:', JSON.stringify(currentService.fields));
      
      // Check next missing field after update
      const updatedRequiredFields = await getRequiredFields(currentService.name);
      const nextField = getNextMissingField(currentService.fields, updatedRequiredFields);
      console.log('[DEBUG] Next missing field after update:', nextField);
      
      if (nextField) {
        // Prompt for next field using metadata
        let nextPrompt;
        if (nextField.aiQuestion) {
          nextPrompt = nextField.aiQuestion;
        } else if (nextField.options && Array.isArray(nextField.options) && nextField.options.length > 0) {
          const fieldContext = nextField.label || nextField.key;
          const description = nextField.description ? ` ${nextField.description}.` : '';
          nextPrompt = `What ${fieldContext.toLowerCase()} would you like?${description} Available options: ${nextField.options.join(', ')}. If you need help choosing, I can explain each option.`;
        } else if (nextField.type === 'number' || (nextField.min && nextField.max)) {
          nextPrompt = `Please enter a value for ${nextField.label || nextField.key}`;
          if (nextField.min !== undefined && nextField.max !== undefined) {
            nextPrompt += ` (range: ${nextField.min} to ${nextField.max})`;
          }
        } else {
          nextPrompt = `What would you like for ${nextField.label || nextField.key}?`;
        }
        chatHistories.get(sessionId).push({ role: 'assistant', content: nextPrompt });
        return res.json({ message: nextPrompt });
      } else {
        // Current service fields complete - move to next service or calculate pricing
        services[currentServiceIdx].complete = true;
        if (currentServiceIdx < services.length - 1) {
          state.currentServiceIdx++;
          setSessionState(sessionId, state);
          // Let AI introduce the next service naturally
          const nextServiceName = services[state.currentServiceIdx].name.toUpperCase();
          const aiMsg = await getGroqConversationalResponse(
            `The user has finished configuring ${currentService.name.toUpperCase()}. Now they need to configure ${nextServiceName}. Transition smoothly and ask if they're ready to configure ${nextServiceName}.`
          );
          const msg = stringifyMessage(aiMsg);
          chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
          return res.json({ message: msg });
        } else {
          // All services complete - calculate pricing and show summary
          console.log('[DEBUG] *** ALL SERVICES COMPLETE - CALCULATING PRICING ***');
          console.log('[DEBUG] Final services configuration:', JSON.stringify(services, null, 2));
          
          // Calculate pricing for each service
          const servicesArr = [];
          let totalCost = 0;
          let totalSubtotal = 0;
          let totalVAT = 0;
          
          for (const service of services) {
            console.log(`[DEBUG] Processing pricing for ${service.name}:`, service.fields);
            
            let servicePricing = { subtotalSAR: 0, vatSAR: 0, totalMonthlySAR: 0 };
            
            try {
              if (service.name.toLowerCase() === 'ecs') {
                // Use the detailed ECS pricing engine
                const { calculatePrice } = await import('../logic/pricing.js');
                servicePricing = calculatePrice(service.fields);
                console.log(`[DEBUG] ECS pricing result:`, servicePricing);
              } else {
                // Use the general pricing engine for other services
                const pricingInput = { [service.name]: service.fields };
                servicePricing = calculatePricing(pricingInput);
                console.log(`[DEBUG] ${service.name} pricing result:`, servicePricing);
              }
            } catch (e) {
              console.error(`[DEBUG] Pricing error for ${service.name}:`, e);
              servicePricing = { subtotalSAR: 0, vatSAR: 0, totalMonthlySAR: 0 };
            }
            
            // Build service summary for frontend - pass fields as object
            servicesArr.push({
              name: service.name.toUpperCase(),
              config: service.fields, // Pass the actual fields object
              monthlyCost: servicePricing.totalMonthlySAR,
              subtotal: servicePricing.subtotalSAR || servicePricing.subtotal,
              vat: servicePricing.vatSAR || servicePricing.vat
            });
            
            totalCost += servicePricing.totalMonthlySAR || 0;
            totalSubtotal += servicePricing.subtotalSAR || servicePricing.subtotal || 0;
            totalVAT += servicePricing.vatSAR || servicePricing.vat || 0;
          }
          
          const totalPricing = {
            subtotal: +totalSubtotal.toFixed(2),
            vat: +totalVAT.toFixed(2),
            totalMonthlySAR: +totalCost.toFixed(2)
          };
          
          console.log('[DEBUG] *** FINAL PRICING SUMMARY ***');
          console.log('[DEBUG] Services:', servicesArr);
          console.log('[DEBUG] Total pricing:', totalPricing);
          
          // Generate a final summary message
          const summaryMsg = `Configuration complete! Total monthly cost: ${totalPricing.totalMonthlySAR} SAR (including VAT)`;
          chatHistories.get(sessionId).push({ role: 'assistant', content: summaryMsg });
          
          // Clear session
          setSessionState(sessionId, null);
          chatHistories.delete(sessionId);
          
          return res.json({ 
            message: summaryMsg,
            services: servicesArr, 
            pricing: totalPricing,
            complete: true
          });
        }
      }
    }

    // If no value was extracted, provide intelligent help based on field type and user input
    let retryMessage;
    
    // Check if user provided an ambiguous answer that we can help clarify
    const isAmbiguousAnswer = userMessage.trim().length > 0 && 
                             !userMessage.toLowerCase().includes('?') &&
                             !(/\b(help|explain|what|how|tell me|info|information|details|options|choices|difference|clarify|don't understand|confused)\b/i.test(userMessage));
    
    if (isAmbiguousAnswer) {
      console.log('[DEBUG] User provided ambiguous answer, trying to help clarify');
      
      if (nextFieldObj.options && Array.isArray(nextFieldObj.options) && nextFieldObj.options.length > 0) {
        // For option fields, help user understand the options
        retryMessage = await getGroqConversationalResponse(
          `The user said "${userMessage}" for ${nextFieldObj.label || nextFieldObj.key}, but the available options are: ${nextFieldObj.options.join(', ')}. Help them understand which option matches what they want. Be helpful and suggest the closest option or ask for clarification.`
        );
      } else if (nextFieldObj.type === 'number' || nextFieldObj.min !== undefined || nextFieldObj.max !== undefined) {
        // For number fields, help with range validation
        const rangeInfo = (nextFieldObj.min !== undefined && nextFieldObj.max !== undefined) 
          ? ` The value should be between ${nextFieldObj.min} and ${nextFieldObj.max}.` 
          : '';
        retryMessage = await getGroqConversationalResponse(
          `The user said "${userMessage}" for ${nextFieldObj.label || nextFieldObj.key}, but I need a specific number.${rangeInfo} Help them provide the right numeric value based on their request.`
        );
      } else {
        // For text fields, ask for clarification
        retryMessage = await getGroqConversationalResponse(
          `The user said "${userMessage}" for ${nextFieldObj.label || nextFieldObj.key}. Help them provide clearer information for this field. Be helpful and ask for clarification.`
        );
      }
    } else {
      // Default retry messages
      if (nextFieldObj.options && Array.isArray(nextFieldObj.options) && nextFieldObj.options.length > 0) {
        const fieldContext = nextFieldObj.label || nextFieldObj.key;
        const description = nextFieldObj.description ? ` ${nextFieldObj.description}.` : '';
        retryMessage = `I didn't understand your choice for ${fieldContext.toLowerCase()}.${description} Please select one of these options: ${nextFieldObj.options.join(', ')}`;
      } else if (nextFieldObj.type === 'number' || nextFieldObj.min !== undefined || nextFieldObj.max !== undefined) {
        retryMessage = `Please provide a number for ${nextFieldObj.label || nextFieldObj.key}`;
        if (nextFieldObj.min !== undefined && nextFieldObj.max !== undefined) {
          retryMessage += ` (between ${nextFieldObj.min} and ${nextFieldObj.max})`;
        }
      } else {
        retryMessage = nextFieldObj.aiQuestion || `What would you like for ${nextFieldObj.label || nextFieldObj.key}?`;
      }
    }
    
    const msg = stringifyMessage(retryMessage);
    chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
    return res.json({ message: msg });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;
//       arr = Object.entries(config)
//         .filter(([k, v]) => serviceMap[k] && typeof v === 'object')
//         .map(([k, v]) => {
//           // Prepare a minimal config for pricing
//           let serviceConfig = {};
//           if (k === 'ecs') {
//             serviceConfig = { service: 'ecs', count: v.count || 1 };
//           } else if (k === 'oss') {
//             serviceConfig = { service: 'oss', storageGB: v.storageGB || 0 };
//           } else if (k === 'tdsql') {
//             serviceConfig = { service: 'tdsql', nodes: v.nodes || 1 };
//           }
//           // Calculate pricing for this service
//           let monthlyCost = 0;
//           try {
//             const pricing = calculatePricing({ services: [serviceConfig] });
//             monthlyCost = pricing && typeof pricing.totalMonthlySAR === 'number' ? pricing.totalMonthlySAR : 0;
//           } catch (e) {
//             console.error(`[AI ROUTE] Pricing error for service ${k}:`, e);
//           }
//           return {
//             name: serviceMap[k].name,
//             config: serviceMap[k].getConfig(v),
//             monthlyCost,
//             raw: v
//           };
//         });
//     }
//     // Log for debugging
//     console.log('[AI ROUTE] Returning array to frontend:', arr);
//     // If nothing matched, send a fallback demo array
//     if (!arr || arr.length === 0) {
//       arr = [
//         { name: 'Elastic Compute Service (ECS)', config: 'ecs.g6.large, Count: 2', monthlyCost: 150 },
//         { name: 'Object Storage Service (OSS)', config: 'Storage: 100 GB', monthlyCost: 30 },
//         { name: 'TDSQL', config: 'Nodes: 1, Engine: MySQL', monthlyCost: 120 },
//       ];
//     }
//     res.json({
//       message: 'Here is the recommended configuration:',
//       solution: arr
//     });
//   } catch (err) {
//     console.error('[AI ROUTE] Error generating AI config:', err);
//     res.status(500).json({ error: 'AI config generation failed', details: err.message });
//   }
// });

// module.exports = router;
// routes/ai.js
// routes/ai.js

// ...existing ESM code at the top of the file remains. Removed all duplicate and CommonJS code below...
