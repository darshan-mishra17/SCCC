// logic/promptBuilder.js
import Service from '../models/Service.js';

export async function buildPrompt(promptType, context) {
  switch (promptType) {
    case 'clarification':
      return `You are an AI cloud solution advisor. The user provided: ${JSON.stringify(context)}. Ask any clarifying questions needed to fully understand the requirements. Respond in structured JSON: { questions: [ ... ] }`;
    case 'recommendation':
      return `You are an Alibaba Cloud solution advisor. Based on the following context: ${JSON.stringify(context)}, recommend a configuration using Alibaba Cloud services (ECS, OSS, TDSQL) in this JSON format:\n{ ecs: { instanceType: 'ecs.g6.large', count: 2 }, oss: { storageGB: 100 }, tdsql: { nodes: 1, engine: 'MySQL' } }\nOnly output the JSON, no explanation.`;
    case 'ai_suggestion':
      // Fetch available services from database for dynamic suggestions
      try {
        const availableServices = await Service.find({});
        const serviceDescriptions = availableServices.map(service => 
          `- ${service.name.toUpperCase()} (${service.displayName}): ${service.description}`
        ).join('\n');
        
        const serviceExamples = availableServices.map(service => {
          const exampleConfig = service.exampleConfig || {};
          return `    {
      "name": "${service.name}",
      "reason": "Explanation why ${service.displayName} fits the requirements",
      "config": ${JSON.stringify(exampleConfig, null, 8)}
    }`;
        }).join(',\n');

        return `You are an expert Alibaba Cloud solution architect. Based on the user's application requirements: "${context}", provide a comprehensive cloud architecture recommendation.

AVAILABLE SERVICES IN OUR SYSTEM:
${serviceDescriptions}

Analyze the requirements considering:
- Application type and scale
- Expected user load and concurrent connections
- Data storage and database needs
- Performance and availability requirements
- Security and compliance needs
- Cost optimization

IMPORTANT: Only recommend services that are available in our system. Use the exact service names: ${availableServices.map(s => s.name).join(', ')}.

Respond with a detailed JSON configuration:
{
  "analysis": "Brief technical analysis of the requirements and challenges",
  "recommendedServices": [
${serviceExamples}
  ],
  "estimatedCapacity": "How many concurrent users and transactions this can handle",
  "performanceExpectations": "Expected response times and throughput", 
  "monthlyCost": "Estimated cost range in SAR",
  "scalabilityNotes": "How this setup can scale with growth",
  "nextSteps": "What to confirm with the user before proceeding"
}

Only use services from the available list above. Each service configuration should match the expected format for that service type.`;
      } catch (error) {
        console.error('[ERROR] Failed to fetch services for AI prompt:', error);
        // Fallback to static prompt if database query fails
        return `You are an expert Alibaba Cloud solution architect. Based on the user's application requirements: "${context}", provide a comprehensive cloud architecture recommendation.

Analyze the requirements and respond with a detailed JSON configuration using available services (ecs, tdsql, oss).`;
      }
    case 'whatIf':
      return `Given the current config: ${JSON.stringify(context.config)}, and this scenario: ${context.scenario}, suggest the changes and show the new config. Respond in structured JSON: { newConfig: ... }`;
    case 'justification':
      return `Explain the reasoning for this cloud config: ${JSON.stringify(context)}. Respond in structured JSON: { explanation: ... }`;
    default:
      return `Given: ${JSON.stringify(context)}, respond in structured JSON.`;
  }
}
