import express from 'express';
import { getGroqConversationalResponse, getGroqAIResponse } from '../logic/groq.js';
import { initializeState, getSessionState, setSessionState, getRequiredFields, getNextMissingField, updateFields, isFieldsComplete } from '../logic/stateManager.js';
import { calculatePricing } from '../logic/pricing.js';
import { optionalAuth } from '../middleware/auth.js';
import { handleChatSession } from '../middleware/chatSession.js';
import Service from '../models/Service.js';

const router = express.Router();

// Global chat histories for sessions
const chatHistories = new Map();

// Helper function to stringify messages
function stringifyMessage(msg) {
  if (typeof msg === 'string') return msg;
  if (msg && typeof msg === 'object') {
    return msg.message || msg.text || msg.content || JSON.stringify(msg);
  }
  return String(msg || '');
}

// Helper function to parse ECS configuration from user input
function parseECSConfiguration(userMessage) {
  console.log('[DEBUG] Parsing ECS configuration from:', userMessage);
  
  const config = {
    instanceType: 'ecs.g6.large', // default
    instanceCount: 1, // default
    osType: 'Linux', // default
    region: 'riyadh',
    diskSize: 100 // default
  };
  
  // Parse instance type
  const instanceTypeMatch = userMessage.match(/ecs\.(g6|c6|r6|m6)\.(large|xlarge|2xlarge|4xlarge)/i);
  if (instanceTypeMatch) {
    config.instanceType = `ecs.${instanceTypeMatch[1].toLowerCase()}.${instanceTypeMatch[2].toLowerCase()}`;
  }
  
  // Parse instance count
  const countMatch = userMessage.match(/(\d+)\s*(instances?|vms?|machines?|servers?)/i);
  if (countMatch) {
    config.instanceCount = parseInt(countMatch[1]);
  }
  
  // Parse OS type
  if (/windows/i.test(userMessage)) {
    config.osType = 'Windows';
  } else if (/linux/i.test(userMessage)) {
    config.osType = 'Linux';
  }
  
  // Parse disk size
  const diskMatch = userMessage.match(/(\d+)\s*gb.*disk/i);
  if (diskMatch) {
    config.diskSize = parseInt(diskMatch[1]);
  }
  
  // Check if we have enough information
  const hasBasicInfo = userMessage.length > 10 && 
    (instanceTypeMatch || countMatch || /linux|windows/i.test(userMessage) || diskMatch);
  
  console.log('[DEBUG] Parsed ECS config:', config, 'hasBasicInfo:', hasBasicInfo);
  
  return hasBasicInfo ? config : null;
}

// @route POST /api/ai/message
// @desc Handle AI chat messages with enhanced suggestion system
// @access Public (with optional auth)
router.post('/message', optionalAuth, handleChatSession, async (req, res) => {
  console.log('[DEBUG] Incoming /api/ai/message:', req.body);
  req.startTime = Date.now();
  
  try {
    const { sessionId, userMessage } = req.body;
    if (!sessionId || !userMessage) {
      return res.status(400).json({ error: 'Missing sessionId or userMessage' });
    }

    // Track chat history for this session
    if (!chatHistories.has(sessionId)) chatHistories.set(sessionId, []);
    chatHistories.get(sessionId).push({ role: 'user', content: userMessage });

    let state = getSessionState(sessionId);
    const sessionHistory = chatHistories.get(sessionId) || [];
    
    console.log('[DEBUG] Session state:', state);
    console.log('[DEBUG] Session history length:', sessionHistory.length);

    // Handle confirmation for AI suggestions (when user says "yes")
    if (state && state.mode === 'suggestion_provided' && state.awaitingConfirmation) {
      console.log('[DEBUG] Checking for confirmation response');
      
      if (/^yes|^y$|^ok|^okay|^proceed|^confirm|^accept/i.test(userMessage.trim())) {
        console.log('[DEBUG] User confirmed the suggestion, proceeding with configuration');
        
        const confirmationMsg = `Perfect! I'll finalize this configuration for you. 

✅ **Configuration Confirmed**

Your recommended services have been processed and are ready for deployment. You can review the final details and pricing in the suggestion panel on the right.

If you need any modifications or have questions about the setup, feel free to ask!`;

        chatHistories.get(sessionId).push({ role: 'assistant', content: confirmationMsg });
        
        // Send the confirmed configuration to the frontend
        return res.json({ 
          message: confirmationMsg,
          complete: true,
          services: state.suggestedServices.map(service => ({
            name: service.name,
            description: service.reason,
            config: service.config,
            monthlyCost: service.monthlyCost || 0
          })),
          pricing: state.pricing || {
            subtotal: 0,
            vat: 0,
            totalMonthlySAR: 0
          }
        });
      } else if (/modify|change|adjust|different/i.test(userMessage)) {
        console.log('[DEBUG] User wants to modify the suggestion');
        
        setSessionState(sessionId, { 
          mode: 'suggestion_gathering',
          awaitingRequirements: true 
        });
        
        const modifyMsg = `I'd be happy to adjust the configuration! 

Please tell me what you'd like to change:
- Different service types or configurations
- Adjust performance requirements  
- Modify capacity or storage needs
- Change to different pricing tier

What specific changes would you like to make?`;

        chatHistories.get(sessionId).push({ role: 'assistant', content: modifyMsg });
        return res.json({ message: modifyMsg });
      }
    }

    // Handle AI suggestion mode first (highest priority)
    if (state && state.mode === 'suggestion_gathering' && state.awaitingRequirements) {
      console.log('[DEBUG] Processing AI suggestion request');
      
      // Generate AI suggestion based on user requirements
      let aiSuggestion;
      try {
        console.log('[DEBUG] Calling getGroqAIResponse...');
        aiSuggestion = await getGroqAIResponse('ai_suggestion', userMessage);
        console.log('[DEBUG] AI Suggestion received:', aiSuggestion);
      } catch (error) {
        console.log('[DEBUG] Error getting AI suggestion:', error);
        throw error;
      }
      
      // Parse the AI response
      let suggestion;
      try {
        suggestion = typeof aiSuggestion === 'string' ? JSON.parse(aiSuggestion) : aiSuggestion;
      } catch (e) {
        console.log('[DEBUG] Failed to parse AI suggestion, using fallback');
        // Fallback suggestion if parsing fails
        suggestion = {
          analysis: "Based on your requirements, I recommend a scalable web application setup.",
          recommendedServices: [
            {
              name: "ecs",
              reason: "For hosting your application with scalable compute power",
              config: { instanceType: "ecs.g6.large", instanceCount: 2, region: "riyadh", osType: "Linux" }
            },
            {
              name: "tdsql",
              reason: "For reliable database storage",
              config: { engine: "MySQL 5.7", instanceSize: "small", storageSize: "100", backupRetention: "7 days" }
            }
          ],
          estimatedCapacity: "Suitable for medium-scale applications",
          monthlyCost: "~800 SAR/month",
          nextSteps: "Please confirm if this configuration meets your needs."
        };
      }

      // Calculate real pricing for the suggested services
      let totalPricing = { subtotal: 0, vat: 0, total: 0 };
      try {
        const serviceConfigs = suggestion.recommendedServices || [];
        const pricingConfig = {};
        
        // Transform service suggestions to pricing config format
        for (const service of serviceConfigs) {
          if (service.config && service.name) {
            pricingConfig[service.name.toLowerCase()] = service.config;
          }
        }
        
        console.log('[DEBUG] Pricing config:', pricingConfig);
        
        if (Object.keys(pricingConfig).length > 0) {
          const pricing = calculatePricing(pricingConfig);
          totalPricing.subtotal = pricing.subtotal || pricing.subtotalSAR || 0;
          totalPricing.vat = pricing.vat || pricing.vatSAR || 0;
          totalPricing.total = pricing.total || pricing.totalMonthlySAR || 0;
        }
      } catch (pricingError) {
        console.log('[DEBUG] Pricing calculation error:', pricingError);
      }

      // Format the response with pricing
      const responseMsg = `Perfect! Based on your requirements: "${userMessage}"

📊 Recommended Configuration

${suggestion.analysis || 'Based on your requirements, here\'s my recommended cloud architecture optimized for performance and cost-effectiveness.'}

Suggested Services:

${(suggestion.recommendedServices || []).map(service => 
`${service.name.toUpperCase()} - ${service.reason}
Configuration: ${JSON.stringify(service.config, null, 2)}`
).join('\n\n')}

📈 Capacity & Performance:
- Estimated Capacity: ${suggestion.estimatedCapacity || suggestion.estimatedUsers || 'Optimized for your requirements'}
- Estimated Monthly Cost: ${totalPricing.total > 0 ? `${totalPricing.total.toFixed(2)} SAR/month (including 15% VAT)` : suggestion.monthlyCost || '~800 SAR/month'}

💰 Cost Breakdown:
- Subtotal: ${totalPricing.subtotal.toFixed(2)} SAR
- VAT (15%): ${totalPricing.vat.toFixed(2)} SAR
- Total: ${totalPricing.total.toFixed(2)} SAR/month

Next Steps:
${suggestion.nextSteps || 'Please confirm if this configuration meets your needs, or let me know if you\'d like to adjust anything.'}

Do you want me to proceed with this configuration? 
Reply with:
- "Yes" to proceed with this setup
- "Modify" to adjust any service
- "Manual" to configure services yourself`;

      chatHistories.get(sessionId).push({ role: 'assistant', content: responseMsg });
      
      // Update state to indicate suggestion provided
      setSessionState(sessionId, { 
        mode: 'suggestion_provided',
        suggestedServices: suggestion.recommendedServices,
        pricing: {
          subtotal: totalPricing.subtotalSAR,
          vat: totalPricing.vatSAR,
          totalMonthlySAR: totalPricing.totalMonthlySAR
        },
        awaitingConfirmation: true 
      });

      console.log('[DEBUG] AI suggestion received:', JSON.stringify(suggestion, null, 2));
      console.log('[DEBUG] Recommended services:', JSON.stringify(suggestion.recommendedServices, null, 2));

      return res.json({ 
        message: responseMsg,
        complete: true,
        services: suggestion.recommendedServices.map(service => {
          // Calculate individual service cost
          let individualCost = 0;
          try {
            const singleServiceConfig = {};
            singleServiceConfig[service.name.toLowerCase()] = service.config;
            const servicePrice = calculatePricing(singleServiceConfig);
            individualCost = servicePrice.subtotalSAR || 0;
          } catch (error) {
            console.log('[DEBUG] Error calculating individual service cost:', error);
          }
          
          return {
            name: service.name,
            description: service.reason,
            config: service.config,
            monthlyCost: individualCost
          };
        }),
        pricing: {
          subtotal: totalPricing.subtotalSAR,
          vat: totalPricing.vatSAR,
          totalMonthlySAR: totalPricing.totalMonthlySAR
        }
      });
    }

    // Handle initial greeting and service selection
    if (!state && sessionHistory.length === 1) {
      // FIRST: Check if user chose manual configuration in first message
      if (/option.*1|choice.*1|manual|configure.*myself/i.test(userMessage)) {
        console.log('[DEBUG] User chose manual configuration in first message');
        
        setSessionState(sessionId, {
          mode: 'manual_configuration',
          awaitingServiceSelection: true
        });
        
        const manualMsg = `Perfect! Let's configure your services manually. Which services would you like to set up?

Available services:
- **ECS** (Elastic Compute Service) - Virtual machines and compute power
- **OSS** (Object Storage Service) - File storage and backup  
- **TDSQL** (Database Service) - Managed database solutions

Just tell me which ones you need (e.g., "ECS", "OSS", or "ECS and TDSQL").`;

        chatHistories.get(sessionId).push({ role: 'assistant', content: manualMsg });
        return res.json({ message: manualMsg });
      }
      
      // SECOND: Check if user chose AI suggestions in first message
      if (/option.*2|choice.*2|ai.*suggest|ai.*recommendation/i.test(userMessage)) {
        console.log('[DEBUG] User chose AI suggestions in first message');
        
        setSessionState(sessionId, { 
          mode: 'suggestion_gathering',
          awaitingRequirements: true 
        });
        
        const promptMsg = `Great! I'd be happy to suggest the perfect cloud configuration for your needs.

Please describe your application requirements in detail. For example:
- "A web application with database for 1000 users"
- "E-commerce platform with file storage for 5000 customers"  
- "Live streaming platform with 100 concurrent users per hour"

The more details you provide about your expected users, features, and performance needs, the better I can tailor the recommendations!`;

        chatHistories.get(sessionId).push({ role: 'assistant', content: promptMsg });
        return res.json({ message: promptMsg });
      }
      
      // THIRD: Check if user is directly describing their application (detailed description)
      const isDetailedDescription = /\b(application|app|website|platform|system|service|project)\b.*\b(users?|customers?|orders?|concurrent|daily|monthly|traffic|visitors?|data|storage|processing|backend|frontend|api|database|real.?time|authentication|payment|e-?commerce|streaming|iot|analytics|mobile|web)\b/i.test(userMessage);
      
      console.log('[DEBUG] Checking detailed description pattern for:', userMessage);
      console.log('[DEBUG] isDetailedDescription:', isDetailedDescription);
      
      if (isDetailedDescription) {
        console.log('[DEBUG] User provided detailed application description in first message, processing immediately');
        
        // Process the application description immediately
        const aiSuggestion = await getGroqAIResponse('ai_suggestion', userMessage);
        console.log('[DEBUG] AI Suggestion received:', aiSuggestion);
        
        // Parse the AI response
        let suggestion;
        try {
          suggestion = typeof aiSuggestion === 'string' ? JSON.parse(aiSuggestion) : aiSuggestion;
        } catch (e) {
          console.log('[DEBUG] Failed to parse AI suggestion, using fallback');
          suggestion = {
            analysis: "Based on your mobile application requirements with 4,000 users and 100 orders per day, I recommend a balanced setup optimized for performance and reliability.",
            recommendedServices: [
              { name: "ecs", reason: "For reliable application hosting with scalable compute power", config: { instanceType: "ecs.g6.xlarge", instanceCount: 3, region: "riyadh", osType: "Linux" }},
              { name: "tdsql", reason: "For secure order and user data management with high availability", config: { engine: "MySQL 8.0", instanceSize: "large", storageSize: "1000", backupRetention: "7 days" }}
            ],
            estimatedCapacity: "400 concurrent users with room for 600 peak traffic",
            monthlyCost: "~5700 SAR/month",
            nextSteps: "Please confirm if this configuration meets your needs."
          };
        }

        // Calculate real pricing for the suggested services
        let totalPricing = { subtotal: 0, vat: 0, total: 0 };
        try {
          const serviceConfigs = suggestion.recommendedServices || [];
          const pricingConfig = {};
          
          // Transform service suggestions to pricing config format
          for (const service of serviceConfigs) {
            if (service.config && service.name) {
              pricingConfig[service.name.toLowerCase()] = service.config;
            }
          }
          
          console.log('[DEBUG] Pricing config for first message processing:', pricingConfig);
          
          if (Object.keys(pricingConfig).length > 0) {
            const pricing = calculatePricing(pricingConfig);
            totalPricing.subtotal = pricing.subtotal || pricing.subtotalSAR || 0;
            totalPricing.vat = pricing.vat || pricing.vatSAR || 0;
            totalPricing.total = pricing.total || pricing.totalMonthlySAR || 0;
          }
        } catch (pricingError) {
          console.log('[DEBUG] Pricing calculation error:', pricingError);
        }

        // Format the response with pricing
        const responseMsg = `Perfect! Based on your requirements: "${userMessage}"

## 📊 **Recommended Configuration**

**${suggestion.analysis}**

### **Suggested Services:**

${(suggestion.recommendedServices || []).map(service => 
`**${service.name.toUpperCase()}** - ${service.reason}
Configuration: ${JSON.stringify(service.config, null, 2)}`
).join('\n\n')}

### **📈 Capacity & Performance:**
- **Estimated Capacity:** ${suggestion.estimatedCapacity}
- **Estimated Monthly Cost:** ${totalPricing.total > 0 ? `${totalPricing.total.toFixed(2)} SAR/month (including 15% VAT)` : suggestion.monthlyCost}

### **💰 Cost Breakdown:**
- **Subtotal:** ${totalPricing.subtotal.toFixed(2)} SAR
- **VAT (15%):** ${totalPricing.vat.toFixed(2)} SAR
- **Total:** ${totalPricing.total.toFixed(2)} SAR/month

### **Next Steps:**
${suggestion.nextSteps}

**Do you want me to proceed with this configuration?** 
Reply with:
- "**Yes**" to proceed with this setup
- "**Modify**" to adjust any service
- "**Manual**" to configure services yourself`;

        chatHistories.get(sessionId).push({ role: 'assistant', content: responseMsg });
        
        setSessionState(sessionId, { 
          mode: 'suggestion_provided',
          suggestedServices: suggestion.recommendedServices,
          pricing: {
            subtotal: totalPricing.subtotal,
            vat: totalPricing.vat,
            totalMonthlySAR: totalPricing.total
          },
          awaitingConfirmation: true 
        });

        return res.json({ 
          message: responseMsg,
          complete: true,
          services: suggestion.recommendedServices.map(service => {
            // Calculate individual service cost for first message processing
            let individualCost = 0;
            try {
              const singleServiceConfig = {};
              singleServiceConfig[service.name.toLowerCase()] = service.config;
              const servicePrice = calculatePricing(singleServiceConfig);
              individualCost = servicePrice.subtotalSAR || 0;
            } catch (error) {
              console.log('[DEBUG] Error calculating individual service cost for first message:', error);
            }
            
            return {
              name: service.name,
              description: service.reason,
              config: service.config,
              monthlyCost: individualCost
            };
          }),
          pricing: {
            subtotal: totalPricing.subtotal,
            vat: totalPricing.vat,
            totalMonthlySAR: totalPricing.total
          }
        });
      }
      
      // Default greeting (if no specific choice was made)
      const initialGreeting = `Hi! Welcome to SCCC AI-Powered Cloud Advisor! 🚀

I can help you configure the perfect cloud solution. You have two options:

**Option 1: Manual Configuration**
Tell me which services you'd like to configure:
• ECS (Elastic Compute Service) - Virtual machines and compute power
• OSS (Object Storage Service) - File storage and backup
• TDSQL (Database Service) - Managed database solutions

**Option 2: AI Suggestion**
Describe your application requirements (e.g., "A web application with database for 1000 users") and I'll suggest the best service combination and configuration for you.

Which approach would you prefer?`;

      chatHistories.get(sessionId).push({ role: 'assistant', content: initialGreeting });
      return res.json({ message: initialGreeting });
    }

    // Handle manual configuration mode - database-driven approach
    if (state && state.mode === 'manual_configuration') {
      console.log('[DEBUG] Processing manual configuration request');
      console.log('[DEBUG] State awaitingConfirmation:', state.awaitingConfirmation);
      console.log('[DEBUG] State configuredServices:', state.configuredServices?.length || 'undefined');
      
      // Check for restart request
      if (/restart|start.*over|begin.*again|new.*configuration/i.test(userMessage)) {
        console.log('[DEBUG] User requested restart');
        
        // Clear session state and start over
        sessionStates.delete(sessionId);
        chatHistories.delete(sessionId);
        
        const restartMsg = `Sure! Let's start fresh. 

Hi! Welcome to SCCC AI-Powered Cloud Advisor! 🚀

I can help you configure the perfect cloud solution. You have two options:

Option 1: Manual Configuration
Tell me which services you'd like to configure:
- ECS (Elastic Compute Service) - Virtual machines and compute power
- OSS (Object Storage Service) - File storage and backup
- TDSQL (Database Service) - Managed database solutions

Option 2: AI Suggestion
Describe your application requirements (e.g., "A web application with database for 1000 users") and I'll suggest the best service combination and configuration for you.

Which approach would you prefer?`;

        chatHistories.set(sessionId, [{ role: 'assistant', content: restartMsg }]);
        return res.json({ message: restartMsg });
      }
      
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
              configuredServices: state.configuredServices || [], // Preserve existing services
              awaitingFieldInput: true,
              awaitingServiceSelection: false
            });
            
            let fieldPrompt = `Great! Let's configure your ${service.displayName}.

${service.description}

Question 1 of ${service.requiredFields.length}:

${firstField.aiQuestion || firstField.label}`;

            if (firstField.type === 'option' && firstField.options) {
              fieldPrompt += `\n\nAvailable options:\n${firstField.options.map(opt => `- ${opt}`).join('\n')}`;
            }
            
            if (firstField.type === 'number' && (firstField.min || firstField.max)) {
              fieldPrompt += `\n\nRange: ${firstField.min || 0} - ${firstField.max || 'unlimited'}`;
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
            
            const summaryMsg = `Perfect! Here's your ${service.displayName} configuration:

Configuration Summary:
${Object.entries(updatedFields).map(([key, value]) => {
  const field = service.requiredFields.find(f => f.key === key);
  return `- ${field?.label || key}: ${value}`;
}).join('\n')}

Monthly Cost: SAR ${pricing.totalMonthlySAR?.toFixed(2) || 0} (including 15% VAT)

Cost Breakdown:
- Subtotal: SAR ${pricing.subtotalSAR?.toFixed(2) || 0}
- VAT (15%): SAR ${pricing.vatSAR?.toFixed(2) || 0}
- Total: SAR ${pricing.totalMonthlySAR?.toFixed(2) || 0}

Is this configuration correct? Reply with:
- "Yes" to confirm and finalize
- "Modify" to change the configuration
- "Add more services" to configure additional services`;          // Get existing configured services from state or initialize empty array
          const existingServices = (state && state.configuredServices) ? state.configuredServices : [];
          
          // Create new service configuration
          const newServiceConfig = {
            name: service.displayName,
            description: service.description,
            config: updatedFields,
            monthlyCost: pricing.subtotalSAR || 0,
            serviceName: state.currentService
          };
          
          // Add to configured services
          const allConfiguredServices = [...existingServices, newServiceConfig];

            setSessionState(sessionId, {
              mode: 'manual_configuration',
              currentService: state.currentService,
              serviceInfo: service,
              collectedFields: updatedFields,
              pricing: pricing,
              configuredServices: allConfiguredServices,
              awaitingConfirmation: true,
              awaitingFieldInput: false
            });

            chatHistories.get(sessionId).push({ role: 'assistant', content: summaryMsg });
            
            return res.json({ 
              message: summaryMsg,
              complete: true,
              services: allConfiguredServices,
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
            configuredServices: state.configuredServices || [], // Preserve existing services
            awaitingFieldInput: true
          });
          
          let nextFieldPrompt = `Great! ✅ ${currentField.label}: ${parsedValue}

Question ${nextFieldIndex + 1} of ${service.requiredFields.length}:

${nextField.aiQuestion || nextField.label}`;

          if (nextField.type === 'option' && nextField.options) {
            nextFieldPrompt += `\n\nAvailable options:\n${nextField.options.map(opt => `- ${opt}`).join('\n')}`;
          }
          
          if (nextField.type === 'number' && (nextField.min || nextField.max)) {
            nextFieldPrompt += `\n\nRange: ${nextField.min || 0} - ${nextField.max || 'unlimited'}`;
          }

          chatHistories.get(sessionId).push({ role: 'assistant', content: nextFieldPrompt });
          return res.json({ message: nextFieldPrompt });
        }
      }
      
      if (state.awaitingConfirmation) {
        console.log('[DEBUG] Processing confirmation, userMessage:', userMessage);
        
        if (/^yes|^y$|^ok|^okay|^confirm/i.test(userMessage.trim())) {
          // Get all configured services and calculate total pricing
          const allServices = state.configuredServices || [];
          console.log('[DEBUG] All configured services:', JSON.stringify(allServices, null, 2));
          let totalPricing = { subtotal: 0, vat: 0, totalMonthlySAR: 0 };
          
          if (allServices.length > 0) {
            // Calculate combined pricing for all services
            const combinedConfig = {};
            allServices.forEach(service => {
              if (service.serviceName && service.config) {
                // Use lowercase service name as key
                combinedConfig[service.serviceName.toLowerCase()] = service.config;
              }
            });
            
            try {
              console.log('[DEBUG] Combined config for pricing:', JSON.stringify(combinedConfig, null, 2));
              const pricing = calculatePricing(combinedConfig);
              console.log('[DEBUG] Calculated pricing result:', pricing);
              totalPricing = {
                subtotal: pricing.subtotalSAR || 0,
                vat: pricing.vatSAR || 0,
                totalMonthlySAR: pricing.totalMonthlySAR || 0
              };
            } catch (error) {
              console.log('[DEBUG] Error calculating combined pricing:', error);
            }
          }

          const finalMsg = `✅ Configuration Confirmed!

Your services have been configured successfully:
${allServices.map(service => `- ${service.name} - SAR ${service.monthlyCost.toFixed(2)}/month`).join('\n')}

Total Monthly Cost: SAR ${totalPricing.totalMonthlySAR.toFixed(2)} (including 15% VAT)

You can see all configurations and pricing in the suggestion panel on the right.

Would you like to:
- Add more services (configure additional services)
- Finalize this configuration
- Start a new configuration`;

          chatHistories.get(sessionId).push({ role: 'assistant', content: finalMsg });
          return res.json({ 
            message: finalMsg,
            complete: true,
            services: allServices,
            pricing: totalPricing
          });
        }
        
        // Handle "Add more services" request
        if (/add.*more|more.*service|another.*service|additional.*service/i.test(userMessage)) {
          console.log('[DEBUG] User requested to add more services, current configured services:', state.configuredServices?.length || 0);
          
          // Reset state to allow service selection again but keep configured services
          setSessionState(sessionId, {
            mode: 'manual_configuration',
            configuredServices: state.configuredServices || [], // Keep existing services
            awaitingServiceSelection: true,
            awaitingConfirmation: false
          });
          
          const addMoreMsg = `Great! Let's configure another service. 

Which additional service would you like to configure?
- ECS - Elastic Compute Service (Virtual machines)
- OSS - Object Storage Service (File storage)  
- TDSQL - Database Service (Managed databases)

Please type the service name (ECS, OSS, or TDSQL):`;

          chatHistories.get(sessionId).push({ role: 'assistant', content: addMoreMsg });
          return res.json({ message: addMoreMsg });
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
            configuredServices: state.configuredServices || [], // Preserve existing services
            awaitingFieldInput: true,
            awaitingConfirmation: false
          });
          
          let fieldPrompt = `Let's reconfigure your ${state.serviceInfo.displayName}.

Question 1 of ${state.serviceInfo.requiredFields.length}:

${firstField.aiQuestion || firstField.label}`;

          if (firstField.type === 'option' && firstField.options) {
            fieldPrompt += `\n\nAvailable options:\n${firstField.options.map(opt => `- ${opt}`).join('\n')}`;
          }
          
          if (firstField.type === 'number' && (firstField.min || firstField.max)) {
            fieldPrompt += `\n\nRange: ${firstField.min || 0} - ${firstField.max || 'unlimited'}`;
          }

          chatHistories.get(sessionId).push({ role: 'assistant', content: fieldPrompt });
          return res.json({ message: fieldPrompt });
        }
      }
      
      // If we're in manual configuration mode but the input wasn't handled above,
      // provide a helpful error message instead of falling through to AI suggestions
      const errorMsg = `I didn't understand that. In manual configuration mode, please:

      ${state.awaitingServiceSelection ? 
        '- Type a service name: ECS, OSS, or TDSQL' :
        state.awaitingFieldInput ? 
        '- Provide the requested information for the current field' :
        state.awaitingConfirmation ?
        '- Reply "Yes" to confirm, "Modify" to change, or "Add more services"' :
        '- Follow the prompts for manual configuration'
      }
      
      Or type "restart" to begin again.`;
      
      chatHistories.get(sessionId).push({ role: 'assistant', content: errorMsg });
      return res.json({ message: errorMsg });
    }

    // Handle subsequent messages for AI suggestions
    if (!state || (state && !state.mode)) {
      console.log('[DEBUG] Checking subsequent messages for AI suggestions, userMessage:', userMessage);
      
      // Check if user is now requesting AI suggestions or describing their application
      if (/option.*2|choice.*2|ai.*suggest|suggest|recommendation|streaming|platform|application|app|users|concurrent|live.*stream|web.*app|e-commerce|database.*users|mobile.*app/i.test(userMessage)) {
        console.log('[DEBUG] User requesting AI suggestions in follow-up message');
        
        // If they just said "option 2" and haven't described their app yet, ask for details
        if (/option.*2|choice.*2|ai.*suggest|suggest|recommendation/i.test(userMessage) && !/streaming|platform|application|app|users|concurrent|live.*stream|web.*app|e-commerce|database.*users|mobile.*app/i.test(userMessage)) {
          setSessionState(sessionId, { 
            mode: 'suggestion_gathering',
            awaitingRequirements: true 
          });
          
          const promptMsg = `Perfect! I'll help you design the ideal cloud architecture based on your specific requirements.

Please describe your application in detail. For example:
- "Live streaming platform with 100 concurrent users per hour"
- "E-commerce platform with file storage for 5000 customers"  
- "API backend with analytics for mobile app"

What type of application are you building and what are your expected usage patterns?`;

          chatHistories.get(sessionId).push({ role: 'assistant', content: promptMsg });
          return res.json({ message: promptMsg });
        }
        
        // If they're describing their application, process it immediately
        console.log('[DEBUG] User is describing application, processing as requirements immediately');
        
        // Generate AI suggestion based on user requirements
        const aiSuggestion = await getGroqAIResponse('ai_suggestion', userMessage);
        console.log('[DEBUG] AI Suggestion received:', aiSuggestion);
        
        // Parse the AI response
        let suggestion;
        try {
          suggestion = typeof aiSuggestion === 'string' ? JSON.parse(aiSuggestion) : aiSuggestion;
        } catch (e) {
          console.log('[DEBUG] Failed to parse AI suggestion, using fallback');
          suggestion = {
            analysis: "Based on your mobile application requirements with 4,000 users and 100 orders per day, I recommend a balanced setup.",
            recommendedServices: [
              { name: "ecs", reason: "For reliable application hosting with scalable compute power", config: { instanceType: "ecs.g6.xlarge", instanceCount: 3, region: "riyadh", osType: "Linux" }},
              { name: "tdsql", reason: "For secure order and user data management", config: { engine: "MySQL 8.0", instanceSize: "large", storageSize: "1000", backupRetention: "7 days" }}
            ],
            estimatedCapacity: "400 concurrent users with room for 600 peak traffic",
            monthlyCost: "~5700 SAR/month",
            nextSteps: "Please confirm if this configuration meets your needs."
          };
        }

        // Calculate real pricing for the suggested services
        let totalPricing = { subtotal: 0, vat: 0, total: 0 };
        try {
          const serviceConfigs = suggestion.recommendedServices || [];
          const pricingConfig = {};
          
          // Transform service suggestions to pricing config format
          for (const service of serviceConfigs) {
            if (service.config && service.name) {
              pricingConfig[service.name.toLowerCase()] = service.config;
            }
          }
          
          console.log('[DEBUG] Pricing config for immediate processing:', pricingConfig);
          
          if (Object.keys(pricingConfig).length > 0) {
            const pricing = calculatePricing(pricingConfig);
            totalPricing.subtotal = pricing.subtotal || pricing.subtotalSAR || 0;
            totalPricing.vat = pricing.vat || pricing.vatSAR || 0;
            totalPricing.total = pricing.total || pricing.totalMonthlySAR || 0;
          }
        } catch (pricingError) {
          console.log('[DEBUG] Pricing calculation error:', pricingError);
        }

        // Format the response with pricing
        const responseMsg = `Perfect! Based on your requirements: "${userMessage}"

## 📊 **Recommended Configuration**

**${suggestion.analysis}**

### **Suggested Services:**

${(suggestion.recommendedServices || []).map(service => 
`**${service.name.toUpperCase()}** - ${service.reason}
Configuration: ${JSON.stringify(service.config, null, 2)}`
).join('\n\n')}

### **📈 Capacity & Performance:**
- **Estimated Capacity:** ${suggestion.estimatedCapacity}
- **Estimated Monthly Cost:** ${totalPricing.total > 0 ? `${totalPricing.total.toFixed(2)} SAR/month (including 15% VAT)` : suggestion.monthlyCost}

### **💰 Cost Breakdown:**
- **Subtotal:** ${totalPricing.subtotal.toFixed(2)} SAR
- **VAT (15%):** ${totalPricing.vat.toFixed(2)} SAR
- **Total:** ${totalPricing.total.toFixed(2)} SAR/month

### **Next Steps:**
${suggestion.nextSteps}

**Do you want me to proceed with this configuration?** 
Reply with:
- "**Yes**" to proceed with this setup
- "**Modify**" to adjust any service
- "**Manual**" to configure services yourself`;

        chatHistories.get(sessionId).push({ role: 'assistant', content: responseMsg });
        
        setSessionState(sessionId, { 
          mode: 'suggestion_provided',
          suggestedServices: suggestion.recommendedServices,
          pricing: {
            subtotal: totalPricing.subtotal,
            vat: totalPricing.vat,
            totalMonthlySAR: totalPricing.total
          },
          awaitingConfirmation: true 
        });

        return res.json({ 
          message: responseMsg,
          complete: true,
          services: suggestion.recommendedServices.map(service => ({
            name: service.name,
            description: service.reason,
            config: service.config,
            monthlyCost: service.monthlyCost || 0
          })),
          pricing: {
            subtotal: totalPricing.subtotal,
            vat: totalPricing.vat,
            totalMonthlySAR: totalPricing.total
          }
        });
      }
      
      // Handle manual configuration option
      console.log('[DEBUG] Testing manual config pattern on:', userMessage);
      console.log('[DEBUG] Manual pattern test result:', /option.*1|choice.*1|manual|configure.*myself/i.test(userMessage));
      
      if (/option.*1|choice.*1|manual|configure.*myself/i.test(userMessage)) {
        console.log('[DEBUG] User chose manual configuration');
        
        setSessionState(sessionId, {
          mode: 'manual_configuration',
          awaitingServiceSelection: true
        });
        
        const manualMsg = `Perfect! Let's configure your services manually. Which services would you like to set up?

Available services:
- **ECS** (Elastic Compute Service) - Virtual machines and compute power
- **OSS** (Object Storage Service) - File storage and backup  
- **TDSQL** (Database Service) - Managed database solutions

Just tell me which ones you need (e.g., "ECS", "OSS", or "ECS and TDSQL").`;

        chatHistories.get(sessionId).push({ role: 'assistant', content: manualMsg });
        return res.json({ message: manualMsg });
      }
    }

    // Default fallback response
    const fallbackMsg = await getGroqConversationalResponse(
      `The user said: "${userMessage}". Help them choose between manual configuration (ECS, OSS, TDSQL services) or AI suggestions for their cloud setup. Be helpful and guide them toward making a choice.`
    );
    
    const msg = stringifyMessage(fallbackMsg);
    chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
    return res.json({ message: msg });

  } catch (error) {
    console.error('[ERROR] AI route error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
