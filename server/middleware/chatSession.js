import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';

// Middleware to handle chat session integration
export const handleChatSession = async (req, res, next) => {
  try {
    const { sessionId, userMessage } = req.body;
    
    if (!sessionId || !userMessage) {
      return next(); // Continue without chat session integration
    }
    
    // Check if user is authenticated
    const userId = req.user?._id;
    
    if (userId) {
      // Find or create chat session for authenticated users
      let chatSession = await ChatSession.findOne({
        sessionId,
        userId,
        isActive: true
      });
      
      if (!chatSession) {
        // Create new session
        chatSession = new ChatSession({
          sessionId,
          userId,
          title: 'AI Consultation',
          status: 'in-progress'
        });
        await chatSession.save();
      }
      
      // Save user message
      const userChatMessage = new ChatMessage({
        sessionId,
        userId,
        messageType: 'user',
        content: userMessage,
        metadata: {
          userContext: req.body.context || {}
        }
      });
      await userChatMessage.save();
      
      // Update session
      chatSession.messageCount += 1;
      chatSession.lastMessage = userMessage.length > 100 ? userMessage.substring(0, 100) + '...' : userMessage;
      await chatSession.save();
      
      // Add session to request for use in response
      req.chatSession = chatSession;
    }
    
    next();
  } catch (error) {
    console.error('Chat session middleware error:', error);
    // Continue without chat session integration
    next();
  }
};

// Function to save AI response to chat session
export const saveAIResponse = async (sessionId, userId, content, metadata = {}) => {
  try {
    if (!sessionId || !userId || !content) return;
    
    // Save AI message
    const aiMessage = new ChatMessage({
      sessionId,
      userId,
      messageType: 'ai',
      content: typeof content === 'string' ? content : JSON.stringify(content),
      metadata: {
        ...metadata,
        processingTimeMs: metadata.processingTime
      }
    });
    await aiMessage.save();
    
    // Update session
    const chatSession = await ChatSession.findOne({
      sessionId,
      userId,
      isActive: true
    });
    
    if (chatSession) {
      chatSession.messageCount += 1;
      chatSession.lastMessage = aiMessage.content.length > 100 
        ? aiMessage.content.substring(0, 100) + '...' 
        : aiMessage.content;
      
      // Update services and pricing if provided in metadata
      if (metadata.servicesRecommended) {
        chatSession.services = metadata.servicesRecommended;
      }
      
      if (metadata.pricing) {
        chatSession.pricing = metadata.pricing;
      }
      
      await chatSession.save();
    }
  } catch (error) {
    console.error('Error saving AI response:', error);
  }
};

// Function to save service configuration to chat session
export const saveServiceConfiguration = async (sessionId, userId, services, pricing) => {
  try {
    if (!sessionId || !userId) return;
    
    const chatSession = await ChatSession.findOne({
      sessionId,
      userId,
      isActive: true
    });
    
    if (chatSession) {
      // Update services and pricing
      if (services && services.length > 0) {
        chatSession.services = services.map(service => ({
          name: service.name || service.service,
          type: service.name || service.service,
          config: service.config,
          monthlyCost: service.monthlyCost || 0,
          selected: true
        }));
      }
      
      if (pricing) {
        chatSession.pricing = {
          subtotal: pricing.subtotal || 0,
          vat: pricing.vat || 0,
          total: pricing.totalMonthlySAR || pricing.total || 0,
          currency: 'SAR'
        };
      }
      
      // Update title based on services if not set
      if (chatSession.services.length > 0 && (!chatSession.title || chatSession.title === 'AI Consultation')) {
        const serviceNames = chatSession.services.map(s => s.name).join(', ');
        chatSession.title = `${serviceNames} Configuration`;
      }
      
      // Mark as completed if we have final configuration
      if (services && pricing) {
        chatSession.status = 'completed';
        chatSession.completedAt = new Date();
        
        // Save completion message
        const completionMessage = new ChatMessage({
          sessionId,
          userId,
          messageType: 'system',
          content: `Configuration completed! Total monthly cost: SAR ${pricing.totalMonthlySAR?.toFixed(2) || pricing.total?.toFixed(2) || 0}`,
          metadata: {
            services,
            pricing,
            completionTimestamp: new Date().toISOString()
          }
        });
        await completionMessage.save();
        chatSession.messageCount += 1;
      }
      
      await chatSession.save();
    }
  } catch (error) {
    console.error('Error saving service configuration:', error);
  }
};
