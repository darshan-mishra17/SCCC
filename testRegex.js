// Test the new detailed description regex
const testMessage = "i have a mobile application with 10000 monthly sign in and 4000 user and 100 orders per day";

const detailedPattern = /\b(application|app|website|platform|system|service|project)\b.*\b(users?|customers?|orders?|concurrent|daily|monthly|traffic|visitors?|data|storage|processing|backend|frontend|api|database|real.?time|authentication|payment|e-?commerce|streaming|iot|analytics|mobile|web)\b/i;

console.log('Test message:', testMessage);
console.log('Detailed pattern matches:', detailedPattern.test(testMessage));

// Test individual parts
console.log('Has application/app:', /\b(application|app|website|platform|system|service|project)\b/i.test(testMessage));
console.log('Has details:', /\b(users?|customers?|orders?|concurrent|daily|monthly|traffic|visitors?|data|storage|processing|backend|frontend|api|database|real.?time|authentication|payment|e-?commerce|streaming|iot|analytics|mobile|web)\b/i.test(testMessage));

// Test with simpler approach
const simplePattern = /(application|app|website|platform|system|service|project).*(users?|customers?|orders?|concurrent|daily|monthly|traffic|visitors?)/i;
console.log('Simple pattern matches:', simplePattern.test(testMessage));

// Test the old pattern that was working
const oldPattern = /suggest|suggestion|recommend|help.*choose|what.*should|ai.*suggest|don't know|not sure|option.*2|choice.*2|streaming|platform|application|app|users|concurrent|live.*stream/i;
console.log('Old pattern matches:', oldPattern.test(testMessage));
