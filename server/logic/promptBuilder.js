// logic/promptBuilder.js

function buildPrompt(promptType, context) {
  switch (promptType) {
    case 'clarification':
      return `You are an AI cloud solution advisor. The user provided: ${JSON.stringify(context)}. Ask any clarifying questions needed to fully understand the requirements. Respond in structured JSON: { questions: [ ... ] }`;
    case 'recommendation':
      return `You are an Alibaba Cloud solution advisor. Based on the following context: ${JSON.stringify(context)}, recommend a configuration using Alibaba Cloud services (ECS, OSS, TDSQL) in this JSON format:\n{ ecs: { instanceType: 'ecs.g6.large', count: 2 }, oss: { storageGB: 100 }, tdsql: { nodes: 1, engine: 'MySQL' } }\nOnly output the JSON, no explanation.`;
    case 'whatIf':
      return `Given the current config: ${JSON.stringify(context.config)}, and this scenario: ${context.scenario}, suggest the changes and show the new config. Respond in structured JSON: { newConfig: ... }`;
    case 'justification':
      return `Explain the reasoning for this cloud config: ${JSON.stringify(context)}. Respond in structured JSON: { explanation: ... }`;
    default:
      return `Given: ${JSON.stringify(context)}, respond in structured JSON.`;
  }
}

module.exports = { buildPrompt };
