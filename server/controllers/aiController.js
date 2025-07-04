const Service = require('../models/Service');
const axios = require('axios');
const { calculatePrice } = require('../logic/pricing');
const { cleanJsonString } = require('./jsonCleanup');
require('dotenv').config();

const analyzeServices = async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ message: 'userMessage is required in request body' });
  }

  try {
    // --- DEBUG LOGGING: Log incoming user message ---
    console.log('[AI DEBUG] userMessage:', userMessage);
    const services = await Service.find({});
    if (!services.length) {
      return res.status(404).json({ message: 'No services found in database' });
    }

    // Build AI prompt
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
    { "sizeGB": , "category": "" }
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

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'qwen/qwen3-32b',
        temperature: 0.1,
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

    let rawReply = response.data.choices?.[0]?.message?.content || '';
    // --- DEBUG LOGGING: Log raw AI response ---
    console.log('[AI DEBUG] Raw AI response:', rawReply);

    // Improved JSON extraction: find the first and last brackets
    const extractJSON = (text) => {
      let cleaned = text
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<think\s*\/?/gi, '')
        .replace(/```(json)?/gi, '')
        .replace(/```/g, '')
        .trim();
      // Find the first [ and last ]
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        return cleaned.substring(firstBracket, lastBracket + 1);
      }
      // Fallback: try to extract the first {...} object and wrap in array
      const objMatch = cleaned.match(/\{[\s\S]*?\}/);
      if (objMatch) {
        return `[${objMatch[0]}]`;
      }
      return null;
    };

    const extracted = extractJSON(rawReply);
    // --- DEBUG LOGGING: Log extracted JSON string ---
    console.log('[AI DEBUG] Extracted JSON string:', extracted);

    if (!extracted) {
      console.error('[AI JSON EXTRACT ERROR] Could not extract valid JSON array. Raw reply:', rawReply);
      return res.status(500).json({
        message: 'AI response could not be extracted as JSON',
        rawReply,
      });
    }

    let parsedResult;
    try {
      // Clean up common JSON issues before parsing
      const cleanedExtracted = cleanJsonString(extracted);
      parsedResult = JSON.parse(cleanedExtracted);
    } catch (parseErr) {
      // --- DEBUG LOGGING: Log parse error and try jsonrepair ---
      console.error('[AI JSON PARSE ERROR]', parseErr, '\nExtracted JSON string:', extracted);
      // Try to repair JSON using jsonrepair
      try {
        const { repairJsonString } = require('./jsonRepair');
        const repaired = repairJsonString(extracted);
        console.log('[AI DEBUG] Attempting jsonrepair. Repaired string:', repaired);
        parsedResult = JSON.parse(repaired);
      } catch (repairErr) {
        console.error('[AI JSONREPAIR ERROR]', repairErr);
        return res.status(500).json({
          message: 'AI response could not be parsed or repaired as JSON',
          extracted,
          error: parseErr.message,
          repairError: repairErr.message,
        });
      }
    }

    // Apply detailed pricing logic to each service
    let subtotal = 0;
    parsedResult = parsedResult.map((item) => {
      // Use calculatePrice for ECS, fallback to defaultEstimatedMonthlyCost for others
      let pricing = { subtotalSAR: 0, vatSAR: 0, totalMonthlySAR: 0 };
      if (item.service && item.service.toLowerCase() === 'ecs') {
        pricing = calculatePrice(item);
      } else if (item.service && item.service.toLowerCase() === 'oss') {
        // OSS: USD/GB/month, apply KSA multiplier, SAR, VAT
        const baseUSD = (item.storageGB || 0) * 0.025;
        const subtotalSAR = baseUSD * 1.6 * 3.75;
        const vatSAR = subtotalSAR * 0.15;
        pricing = {
          subtotalSAR: +subtotalSAR.toFixed(2),
          vatSAR: +vatSAR.toFixed(2),
          totalMonthlySAR: +(subtotalSAR + vatSAR).toFixed(2),
        };
      } else if (item.service && item.service.toLowerCase() === 'tdsql') {
        // TDSQL: USD/month per node
        const baseUSD = 120 * (item.quantity || 1);
        const subtotalSAR = baseUSD * 1.6 * 3.75;
        const vatSAR = subtotalSAR * 0.15;
        pricing = {
          subtotalSAR: +subtotalSAR.toFixed(2),
          vatSAR: +vatSAR.toFixed(2),
          totalMonthlySAR: +(subtotalSAR + vatSAR).toFixed(2),
        };
      } else {
        // Fallback: use defaultEstimatedMonthlyCost if present
        const baseCost = item.defaultEstimatedMonthlyCost || 0;
        const vatSAR = baseCost * 0.15;
        pricing = {
          subtotalSAR: +baseCost,
          vatSAR: +vatSAR.toFixed(2),
          totalMonthlySAR: +(baseCost + vatSAR).toFixed(2),
        };
      }
      subtotal += pricing.subtotalSAR;
      return {
        ...item,
        subtotalSAR: pricing.subtotalSAR,
        vatSAR: pricing.vatSAR,
        finalMonthlyCostSARWithVAT: pricing.totalMonthlySAR,
      };
    });

    const vat = +(subtotal * 0.15).toFixed(2);
    const grandTotal = +(subtotal + vat).toFixed(2);

    res.status(200).json({
      solution: parsedResult,
      subtotalSAR: subtotal.toFixed(2),
      vatSAR: vat.toFixed(2),
      totalFinalMonthlySAR: grandTotal.toFixed(2),
    });
  } catch (err) {
    console.error('[AI CONTROLLER ERROR]', err);
    res.status(500).json({
      message: 'Error processing AI request',
      error: err.message,
    });
  }
};

module.exports = { analyzeServices };
