// backend/services/promptBuilder.js

const promptMap = {
  operatingSystem: "Which operating system would you like to use (Linux/Windows)?",
  systemDiskGB: "How much system disk do you need (in GB)?",
  bandwidthMbps: "What bandwidth do you require (in Mbps)?",
  storageGB: "How much storage do you need (in GB)?",
  engine: "What database engine do you prefer (e.g., MySQL, PostgreSQL)?",
  storageClass: "What storage class do you want (Standard/Archive)?",
  retentionDays: "How long do you want to retain backups (in days)?",
  frequency: "What backup frequency do you need (Daily/Weekly)?",
  instanceType: "What instance type are you targeting (e.g., ecs.g6.large)?",
  plan: "Which WAF plan do you want (Basic/Enterprise)?",
  domainsProtected: "How many domains do you want to protect?"
};

export function buildPromptForField(fieldName) {
  return promptMap[fieldName] || `Please provide value for ${fieldName}`;
}
