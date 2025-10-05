/*
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({});

interface ApprovalData {
  grantAmount: number;
  availableBalance: number;
  rules: string;
  requestAmount: number;
  requestDescription: string;
}

// Define the required JSON output schema for reliable parsing
const approvalSchema = {
  type: Type.OBJECT,
  properties: {
    decision: {
      type: Type.STRING,
      enum: ["Approved", "Denied"],
      description: "The final approval decision."
    },
    justification: {
      type: Type.STRING,
      description: "A brief, 1-2 sentence reason based on the grant rules."
    }
  },
  required: ["decision", "justification"]
};

//will need to add stuff on fringe rates
export async function getApproval(data: ApprovalData) {
  const prompt = `
    Analyze the following spending request against the grant rules:
    - Current Available Balance: $${data.availableBalance.toFixed(2)}
    - Requested Amount: $${data.requestAmount.toFixed(2)}
    - Request Description: "${data.requestDescription}"
    - Grant Rules: "${data.rules}"

    RULES CHECK:
    1. Is the requested amount within the available balance?
    2. Does the request description comply with the Grant Rules?

    Based strictly on the Grant Rules and the available balance, provide a decision
    and justification in the requested JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: approvalSchema,
      },
    });

    // Parse the reliably formatted JSON string
    return JSON.parse(response.text.trim());

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return a default denial on API error
    return { decision: "Denied", justification: "System error prevented external approval check." };
  }
}
  */
