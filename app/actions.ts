'use server';

import { API_MODEL, API_ENDPOINT } from "./lib/constants";
import { getOpenRouterApiKey } from "./lib/env";

const SYSTEM_PROMPT = `
You are a receipt parsing engine. Return ONLY raw JSON. No markdown, no explanation.
Input: An image of a receipt and a text description of how to split it.
Goal: Extract items and map them to people based on the text using a 'weight' system.
JSON Schema specific instructions:
1. 'participants': Extract names from the prompt. If none, use generic "Person 1", "Person 2". Use "Me" when referring to the user.
2. 'line_items': Extract all items, qty, price.
3. 'split_logic': For EACH item, create an entry.
   - If prompt says "Alice had 2/3, Bob 1/3", set allocs: [{pId: "Alice", weight: 2}, {pId: "Bob", weight: 1}].
   - If "Alice and Bob shared", set weights to 1 for both.
   - If unassigned/unknown, leave allocations empty.
4. 'additional_charges': Extract ALL additional charges from the receipt and user prompt.
   - Common charges: Tax, Tip, Service Charge, SF Mandate, Delivery Fee, etc.
   - Each charge needs: unique id (lowercase, no spaces), label (display name), source ("receipt" | "user_prompt" | "user"), type ("fixed" | "percentage"), value.
   - For percentage type, 'value' should be the whole number (e.g., 20 for 20%, not 0.2).
   - If an exact amount is shown on receipt, use "fixed" type. If described as a percentage, use "percentage" type.
   - IMPORTANT: Include every additional charge shown on the receipt, even if it's not tax or tip.
   - Examples: Tax (fixed $5.85), Tip (20%), SF Mandate (5%), Service Charge (18%), Delivery Fee ($3.99).
Output this exact structure:
{
  "meta": { "currency": "string", "notes": "string" },
  "participants": [ { "id": "string", "name": "string" } ],
  "line_items": [ { "id": "string", "description": "string", "quantity": number, "unit_price": number, "total_price": number } ],
  "split_logic": [
    {
      "item_id": "string",
      "method": "explicit" | "equal" | "ratio",
      "allocations": [ { "participant_id": "string", "weight": number } ]
    }
  ],
  "additional_charges": [
    { "id": "string", "label": "string", "source": "receipt" | "user_prompt" | "user", "type": "fixed" | "percentage", "value": number }
  ]
}
`;

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export async function processReceiptAction(base64Data: string, userPrompt: string) {
  console.log(`Processing receipt: ${Math.round(base64Data.length / 1024)}KB payload`);

  // Validate environment and get API key
  const apiKey = getOpenRouterApiKey();

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: API_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: `User Instructions: ${userPrompt}` },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json() as OpenRouterResponse;
    
    if (result.error) {
      throw new Error(result.error.message || "OpenRouter API Error");
    }

    if (!result.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from API");
    }

    let jsonText = result.choices[0].message.content;
    // Clean up markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?|```/g, "").trim();

    const parsedData = JSON.parse(jsonText);
    
    return parsedData;
  } catch (err) {
    console.error("OpenRouter API Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to process receipt";
    throw new Error(errorMessage);
  }
}

