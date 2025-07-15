// Test pattern matching
const testMessage = "i have a mobile application with 10000 monthly sign in and 4000 user and 100 orders per day";

const pattern = /option.*2|choice.*2|ai.*suggest|suggest|recommendation|streaming|platform|application|app|users|concurrent|live.*stream|web.*app|e-commerce|database.*users|mobile.*app/i;

console.log('Test message:', testMessage);
console.log('Pattern matches:', pattern.test(testMessage));

// Test individual parts
console.log('Contains "application":', /application/i.test(testMessage));
console.log('Contains "mobile.*app":', /mobile.*app/i.test(testMessage));
console.log('Contains "users":', /users/i.test(testMessage));

// Test with exact frontend pattern
const frontendPattern = /suggest|suggestion|recommend|help.*choose|what.*should|ai.*suggest|don't know|not sure|option.*2|choice.*2|streaming|platform|application|app|users|concurrent|live.*stream/i;
console.log('Frontend pattern matches:', frontendPattern.test(testMessage));
