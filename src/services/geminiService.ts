import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeReceipt = async (base64Image: string) => {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze this receipt or sales record. Extract the total amount, payment method (cash, credit, debit, or pix), and a brief description of items. Return as JSON.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER },
          paymentMethod: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["amount", "paymentMethod"],
      },
    },
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
};

export const analyzeSpreadsheetData = async (data: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            text: `Extract sales information from the following spreadsheet data. 
            For each sale, find: date (string, YYYY-MM-DD), time (string, HH:mm), amount (number), paymentMethod (cash, credit, debit, pix, payment-link, or exchange-voucher), source (physical-store, whatsapp, or instagram), and sellerName (if available).
            Return a JSON array of sales objects.
            
            Data:
            ${data}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            paymentMethod: { type: Type.STRING },
            source: { type: Type.STRING },
            sellerName: { type: Type.STRING },
          },
          required: ["date", "time", "amount", "paymentMethod", "source"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const generateSalesMotivationImage = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: {
      parts: [{ text: `A motivational sales achievement image: ${prompt}` }],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
