// Complete working manual configuration with database-driven questions
// This will replace the broken section in ai.js

// Handle manual configuration mode - database-driven approach
if (state && state.mode === 'manual_configuration') {
  console.log('[DEBUG] Processing manual configuration request');
  
  if (state.awaitingServiceSelection) {
    console.log('[DEBUG] User needs to select a service, message:', userMessage);
    
    // Check which service the user selected
    let selectedServiceName = null;
    if (/ecs/i.test(userMessage)) selectedServiceName = 'ecs';
    else if (/oss/i.test(userMessage)) selectedServiceName = 'oss';
    else if (/tdsql/i.test(userMessage)) selectedServiceName = 'tdsql';
    
    if (selectedServiceName) {
      console.log(`[DEBUG] User selected ${selectedServiceName}, fetching service from database`);
      
      try {
        // Fetch service details from database
        const service = await Service.findOne({ name: selectedServiceName });
        if (!service) {
          const errorMsg = `Sorry, I couldn't find the ${selectedServiceName.toUpperCase()} service in our database. Please try again.`;
          chatHistories.get(sessionId).push({ role: 'assistant', content: errorMsg });
          return res.json({ message: errorMsg });
        }
        
        console.log(`[DEBUG] Found service ${service.displayName} with ${service.requiredFields.length} required fields`);
        
        // Start asking the first question
        const firstField = service.requiredFields[0];
        
        setSessionState(sessionId, {
          mode: 'manual_configuration',
          currentService: selectedServiceName,
          serviceInfo: service,
          currentFieldIndex: 0,
          collectedFields: {},
          awaitingFieldInput: true,
          awaitingServiceSelection: false
        });
        
        let fieldPrompt = `Great! Let's configure your **${service.displayName}**.

${service.description}

**Question 1 of ${service.requiredFields.length}:**

${firstField.aiQuestion || firstField.label}`;

        if (firstField.type === 'option' && firstField.options) {
          fieldPrompt += `\n\n**Available options:**\n${firstField.options.map(opt => `• ${opt}`).join('\n')}`;
        }
        
        if (firstField.type === 'number' && (firstField.min || firstField.max)) {
          fieldPrompt += `\n\n**Range:** ${firstField.min || 0} - ${firstField.max || 'unlimited'}`;
        }

        chatHistories.get(sessionId).push({ role: 'assistant', content: fieldPrompt });
        return res.json({ message: fieldPrompt });
        
      } catch (error) {
        console.error('[DEBUG] Error fetching service:', error);
        const errorMsg = `Sorry, there was an error accessing the service database. Please try again.`;
        chatHistories.get(sessionId).push({ role: 'assistant', content: errorMsg });
        return res.json({ message: errorMsg });
      }
    }
    
    // If they mention multiple services
    if (/ecs.*oss|ecs.*tdsql|oss.*tdsql/i.test(userMessage)) {
      const multiMsg = `I see you want multiple services! Let's configure them one by one.

Which service would you like to configure first?
- **ECS** (Elastic Compute Service) - Virtual machines
- **OSS** (Object Storage Service) - File storage  
- **TDSQL** (Database Service) - Managed databases

Just tell me which one to start with.`;

      chatHistories.get(sessionId).push({ role: 'assistant', content: multiMsg });
      return res.json({ message: multiMsg });
    }
  }
  
  if (state.awaitingFieldInput) {
    console.log('[DEBUG] Processing field input for field index:', state.currentFieldIndex);
    
    const service = state.serviceInfo;
    const currentField = service.requiredFields[state.currentFieldIndex];
    const userInput = userMessage.trim();
    
    console.log(`[DEBUG] Current field: ${currentField.key}, type: ${currentField.type}, user input: ${userInput}`);
    
    // Validate the input based on field type
    let isValid = false;
    let parsedValue = null;
    let errorMessage = '';
    
    if (currentField.type === 'option') {
      const normalizedInput = userInput.toLowerCase();
      const validOption = currentField.options.find(opt => 
        opt.toLowerCase() === normalizedInput || 
        opt.toLowerCase().includes(normalizedInput) ||
        normalizedInput.includes(opt.toLowerCase())
      );
      
      if (validOption) {
        isValid = true;
        parsedValue = validOption;
      } else {
        errorMessage = `Please choose from the available options: ${currentField.options.join(', ')}`;
      }
    } else if (currentField.type === 'number') {
      const numValue = parseInt(userInput);
      if (!isNaN(numValue)) {
        if (currentField.min && numValue < currentField.min) {
          errorMessage = `Value must be at least ${currentField.min}`;
        } else if (currentField.max && numValue > currentField.max) {
          errorMessage = `Value must be no more than ${currentField.max}`;
        } else {
          isValid = true;
          parsedValue = numValue;
        }
      } else {
        errorMessage = `Please enter a valid number`;
      }
    } else {
      // For text fields, just accept the input
      isValid = true;
      parsedValue = userInput;
    }
    
    if (!isValid) {
      const retryMsg = `${errorMessage}

**${currentField.aiQuestion || currentField.label}**

${currentField.type === 'option' && currentField.options ? 
`**Available options:**\n${currentField.options.map(opt => `• ${opt}`).join('\n')}` : ''}

${currentField.type === 'number' && (currentField.min || currentField.max) ? 
`**Range:** ${currentField.min || 0} - ${currentField.max || 'unlimited'}` : ''}`;

      chatHistories.get(sessionId).push({ role: 'assistant', content: retryMsg });
      return res.json({ message: retryMsg });
    }
    
    // Valid input - save it and move to next field
    const updatedFields = { ...state.collectedFields };
    updatedFields[currentField.key] = parsedValue;
    
    console.log(`[DEBUG] Saved field ${currentField.key} = ${parsedValue}`);
    
    const nextFieldIndex = state.currentFieldIndex + 1;
    
    if (nextFieldIndex >= service.requiredFields.length) {
      // All fields collected - calculate pricing and show summary
      console.log('[DEBUG] All fields collected, calculating pricing');
      
      try {
        const pricingConfig = {};
        pricingConfig[state.currentService] = updatedFields;
        
        const pricing = calculatePricing(pricingConfig);
        
        const summaryMsg = `Perfect! Here's your **${service.displayName}** configuration:

**Configuration Summary:**
${Object.entries(updatedFields).map(([key, value]) => {
  const field = service.requiredFields.find(f => f.key === key);
  return `• **${field?.label || key}:** ${value}`;
}).join('\n')}

**Monthly Cost:** SAR ${pricing.totalMonthlySAR?.toFixed(2) || 0} (including 15% VAT)

**Cost Breakdown:**
• Subtotal: SAR ${pricing.subtotalSAR?.toFixed(2) || 0}
• VAT (15%): SAR ${pricing.vatSAR?.toFixed(2) || 0}
• **Total: SAR ${pricing.totalMonthlySAR?.toFixed(2) || 0}**

Is this configuration correct? Reply with:
• **"Yes"** to confirm and finalize
• **"Modify"** to change the configuration
• **"Add more services"** to configure additional services`;

        setSessionState(sessionId, {
          mode: 'manual_configuration',
          currentService: state.currentService,
          serviceInfo: service,
          collectedFields: updatedFields,
          pricing: pricing,
          awaitingConfirmation: true,
          awaitingFieldInput: false
        });

        chatHistories.get(sessionId).push({ role: 'assistant', content: summaryMsg });
        
        return res.json({ 
          message: summaryMsg,
          complete: true,
          services: [{
            name: service.displayName,
            description: service.description,
            config: updatedFields,
            monthlyCost: pricing.subtotalSAR || 0
          }],
          pricing: {
            subtotal: pricing.subtotalSAR || 0,
            vat: pricing.vatSAR || 0,
            totalMonthlySAR: pricing.totalMonthlySAR || 0
          }
        });
        
      } catch (error) {
        console.error('[DEBUG] Pricing calculation error:', error);
        const errorMsg = `Configuration saved! However, there was an error calculating pricing. You can proceed with the configuration.`;
        chatHistories.get(sessionId).push({ role: 'assistant', content: errorMsg });
        return res.json({ message: errorMsg });
      }
    } else {
      // Move to next field
      const nextField = service.requiredFields[nextFieldIndex];
      
      setSessionState(sessionId, {
        mode: 'manual_configuration',
        currentService: state.currentService,
        serviceInfo: service,
        currentFieldIndex: nextFieldIndex,
        collectedFields: updatedFields,
        awaitingFieldInput: true
      });
      
      let nextFieldPrompt = `Great! ✅ **${currentField.label}:** ${parsedValue}

**Question ${nextFieldIndex + 1} of ${service.requiredFields.length}:**

${nextField.aiQuestion || nextField.label}`;

      if (nextField.type === 'option' && nextField.options) {
        nextFieldPrompt += `\n\n**Available options:**\n${nextField.options.map(opt => `• ${opt}`).join('\n')}`;
      }
      
      if (nextField.type === 'number' && (nextField.min || nextField.max)) {
        nextFieldPrompt += `\n\n**Range:** ${nextField.min || 0} - ${nextField.max || 'unlimited'}`;
      }

      chatHistories.get(sessionId).push({ role: 'assistant', content: nextFieldPrompt });
      return res.json({ message: nextFieldPrompt });
    }
  }
  
  if (state.awaitingConfirmation) {
    if (/^yes|^y$|^ok|^okay|^confirm/i.test(userMessage.trim())) {
      const finalMsg = `✅ **Configuration Confirmed!**

Your ${state.serviceInfo.displayName} has been configured successfully.

You can see the final configuration and pricing in the suggestion panel on the right.

Would you like to:
• **Add more services** (OSS, TDSQL)
• **Finalize this configuration**
• **Start a new configuration**`;

      chatHistories.get(sessionId).push({ role: 'assistant', content: finalMsg });
      return res.json({ 
        message: finalMsg,
        complete: true,
        services: [{
          name: state.serviceInfo.displayName,
          description: state.serviceInfo.description,
          config: state.collectedFields,
          monthlyCost: state.pricing?.subtotal || 0
        }],
        pricing: state.pricing || { subtotal: 0, vat: 0, totalMonthlySAR: 0 }
      });
    }
    
    if (/modify|change|adjust/i.test(userMessage)) {
      // Reset to first field to restart configuration
      const firstField = state.serviceInfo.requiredFields[0];
      
      setSessionState(sessionId, {
        mode: 'manual_configuration',
        currentService: state.currentService,
        serviceInfo: state.serviceInfo,
        currentFieldIndex: 0,
        collectedFields: {},
        awaitingFieldInput: true,
        awaitingConfirmation: false
      });
      
      let fieldPrompt = `Let's reconfigure your **${state.serviceInfo.displayName}**.

**Question 1 of ${state.serviceInfo.requiredFields.length}:**

${firstField.aiQuestion || firstField.label}`;

      if (firstField.type === 'option' && firstField.options) {
        fieldPrompt += `\n\n**Available options:**\n${firstField.options.map(opt => `• ${opt}`).join('\n')}`;
      }
      
      if (firstField.type === 'number' && (firstField.min || firstField.max)) {
        fieldPrompt += `\n\n**Range:** ${firstField.min || 0} - ${firstField.max || 'unlimited'}`;
      }

      chatHistories.get(sessionId).push({ role: 'assistant', content: fieldPrompt });
      return res.json({ message: fieldPrompt });
    }
  }
}
