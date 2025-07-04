const Service = require('../models/Service');
const axios = require('axios');
require('dotenv').config();

const analyzeServices = async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ message: 'userMessage is required in request body' });
  }

  try {
    const services = await Service.find({});
    if (!services.length) {
      return res.status(404).json({ message: 'No services found in database' });
    }

    // 💬 Prompt construction
const prompt = `
You are a cloud infrastructure pricing assistant.

The user has asked: "${userMessage}"

You must:
- Analyze the user’s request.
- Select one or more cloud services from the list below that fit the requirements.
- Create a structured configuration for each selected service.

⚠️ Only use the services listed below — do not invent new services or prices.

Available Cloud Services:
${JSON.stringify(services, null, 2)}

📦 For each selected service, return a structured object in this format:

{
  "service": "",
  "quantity": ,
  "instanceType": "",
  "operatingSystem": "",
  "systemDisk": {
    "sizeGB": ,
    "category": ""
  },
  "additionalDataDisks": [
    { "sizeGB": , "category": }
  ],
  "bandwidthMbps": ,
  "pricingModel": "",
  "defaultEstimatedMonthlyCost":
}

📌 Guidelines:
- Do not respond with any explanation or text — ONLY a valid JSON array of such objects.
- If the user query doesn’t mention a specific detail (e.g. bandwidth), make a best-effort estimate.
- Maintain accuracy, realism, and completeness.

Now provide your answer in JSON only.
`;

// const prompt = `
// You are a cloud infrastructure pricing assistant.

// The user has asked: "${userMessage}"

// Your task:
// - Analyze the user's request.
// - Choose appropriate services **ONLY** from the list below.
// - Create a structured configuration for each service.

// ⚠️ Do NOT invent any services or values.
// ⚠️ Do NOT write any explanations, commentary, or HTML.
// ⚠️ ONLY return a valid JSON array of objects.

// Available Cloud Services:
// ${JSON.stringify(services, null, 2)}

// Return each object in this structure:

// {
//   "service": "",
//   "quantity": ,
//   "instanceType": "",
//   "operatingSystem": "",
//   "systemDisk": {
//     "sizeGB": ,
//     "category": ""
//   },
//   "additionalDataDisks": [
//     { "sizeGB": , "category": "" }
//   ],
//   "bandwidthMbps": ,
//   "pricingModel": "",
//   "defaultEstimatedMonthlyCost": 
// }

// 🔁 Final Output Instructions:
// - ONLY output a **valid JSON array** of such objects. Example:
// [
//   {
//     "service": "ECS",
//     "quantity": 2,
//     "instanceType": "ecs.g6.large",
//     "operatingSystem": "Linux",
//     "systemDisk": {
//       "sizeGB": 100,
//       "category": "cloud_essd"
//     },
//     "additionalDataDisks": [],
//     "bandwidthMbps": 50,
//     "pricingModel": "PayAsYouGo",
//     "defaultEstimatedMonthlyCost": 250
//   }
// ]
// `;


    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a cloud pricing and configuration advisor.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const rawReply = response.data.choices[0]?.message?.content || '[]';

     // 🧠 Parse AI's stringified JSON array
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawReply);
    } catch (err) {
      console.error('[AI PARSE ERROR]', err.message);
      return res.status(500).json({
        message: 'AI response could not be parsed as JSON',
        rawReply,
      });
    }

    // 💰 Total cost calculation
    const totalFinalCost = parsedResult.reduce(
      (acc, item) => acc + (item.finalMonthlyCostSARWithVAT || 0),
      0
    );

    res.status(200).json({
      solution: parsedResult,
      totalFinalMonthlySAR: totalFinalCost.toFixed(2),
    });

  } catch (err) {
    console.error('[AI CONTROLLER ERROR]', err.message);
    res.status(500).json({ message: 'Error processing AI request', error: err.message });
  }
};

module.exports = { analyzeServices };