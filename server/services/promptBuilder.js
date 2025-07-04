
// Maps field names to human-readable questions
const fieldPrompts = {
  os: "What operating system would you like for your virtual machine (Linux/Windows)?",
  systemDisk: "How much system disk do you need in GB?",
  database: "Do you need a database? If so, which one?",
  bandwidth: "What bandwidth (in Mbps) do you require?",
  storageClass: "Which OSS storage class do you need (Standard/IA/Archive)?",
  capacity: "How much storage capacity do you need in GB?",
  region: "Which region should the service be deployed in?",
  engine: "Which database engine do you want (e.g., MySQL, PostgreSQL)?",
  version: "What version of the database engine do you need?",
  storage: "How much database storage do you need in GB?",
  instanceType: "What instance type do you require for TDSQL?"
};

function buildPromptForField(fieldName, state) {
  return fieldPrompts[fieldName] || `Please provide a value for ${fieldName}.`;
}

module.exports = { buildPromptForField };
