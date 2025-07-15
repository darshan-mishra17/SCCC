// logic/promptBuilder.js

export function buildPrompt(promptType, context) {
  switch (promptType) {
    case 'clarification':
      return `You are an AI cloud solution advisor. The user provided: ${JSON.stringify(context)}. Ask any clarifying questions needed to fully understand the requirements. Respond in structured JSON: { questions: [ ... ] }`;
    case 'recommendation':
      return `You are an Alibaba Cloud solution advisor. Based on the following context: ${JSON.stringify(context)}, recommend a configuration using Alibaba Cloud services (ECS, OSS, TDSQL) in this JSON format:\n{ ecs: { instanceType: 'ecs.g6.large', count: 2 }, oss: { storageGB: 100 }, tdsql: { nodes: 1, engine: 'MySQL' } }\nOnly output the JSON, no explanation.`;
    case 'ai_suggestion':
      return `You are an expert Alibaba Cloud solution architect. Based on the user's application requirements: "${context}", provide a comprehensive cloud architecture recommendation.

Analyze the requirements considering:
- Application type and scale
- Expected user load and concurrent connections
- Data storage and database needs
- Performance and availability requirements
- Security and compliance needs
- Cost optimization

Respond with a detailed JSON configuration:
{
  "analysis": "Brief technical analysis of the requirements and challenges",
  "recommendedServices": [
    {
      "name": "ecs",
      "reason": "Detailed explanation why ECS is needed and how it fits",
      "config": {
        "instanceType": "ecs.g6.large",
        "instanceCount": 2,
        "region": "riyadh",
        "osType": "Linux"
      }
    },
    {
      "name": "tdsql", 
      "reason": "Database rationale and why TDSQL fits the requirements",
      "config": {
        "engine": "MySQL 5.7",
        "instanceSize": "medium", 
        "storageSize": "500",
        "backupRetention": "7 days"
      }
    }
  ],
  "estimatedCapacity": "How many concurrent users and transactions this can handle",
  "performanceExpectations": "Expected response times and throughput",
  "monthlyCost": "Estimated cost range in SAR",
  "scalabilityNotes": "How this setup can scale with growth",
  "nextSteps": "What to confirm with the user before proceeding"
}

Only return valid JSON, no additional text.`;
    case 'whatIf':
      return `Given the current config: ${JSON.stringify(context.config)}, and this scenario: ${context.scenario}, suggest the changes and show the new config. Respond in structured JSON: { newConfig: ... }`;
    case 'justification':
      return `Explain the reasoning for this cloud config: ${JSON.stringify(context)}. Respond in structured JSON: { explanation: ... }`;
    default:
      return `Given: ${JSON.stringify(context)}, respond in structured JSON.`;
  }
}
