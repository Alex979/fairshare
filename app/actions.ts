'use server';

const SYSTEM_PROMPT = `
You are a receipt parsing engine. Return ONLY raw JSON. No markdown, no explanation.
Input: An image of a receipt and a text description of how to split it.
Goal: Extract items and map them to people based on the text using a 'weight' system.
JSON Schema specific instructions:
1. 'participants': Extract names from the prompt. If none, use generic "Person 1", "Person 2".
2. 'line_items': Extract all items, qty, price.
3. 'split_logic': For EACH item, create an entry.
   - If prompt says "Alice had 2/3, Bob 1/3", set allocs: [{pId: "Alice", weight: 2}, {pId: "Bob", weight: 1}].
   - If "Alice and Bob shared", set weights to 1 for both.
   - If unassigned/unknown, leave allocations empty.
4. 'modifiers': Look for Tax on receipt. Look for Tip in receipt or user prompt. 
   - Tip type: "percentage" or "fixed". If percentage, the 'value' should be the whole number (e.g., 20 for 20%, not 0.2).
   - If an exact tip amount is shown on the receipt, prefer "fixed" tip type over "percentage".
Output this exact structure:
{
  "meta": { "currency": "string", "notes": "string" },
  "participants": [ { "id": "string", "name": "string" } ],
  "line_items": [ { "id": "string", "description": "string", "quantity": number, "unit_price": number, "total_price": number, "category": "string" } ],
  "split_logic": [ 
    { 
      "item_id": "string", 
      "method": "explicit" | "equal" | "ratio", 
      "allocations": [ { "participant_id": "string", "weight": number } ]
    } 
  ],
  "modifiers": {
    "tax": { "source": "receipt" | "user", "type": "fixed" | "percentage", "value": number },
    "tip": { "source": "receipt" | "user", "type": "fixed" | "percentage", "value": number },
    "fees": [] 
  }
}
`;

export async function processReceiptAction(base64Data: string, userPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  
  if (!apiKey) {
    throw new Error("OpenRouter API Key not configured on server.");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-preview-09-2025",
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

    const result = await response.json();
    if (result.error) throw new Error(result.error.message || "OpenRouter API Error");

    let jsonText = result.choices[0].message.content;
    // Clean up markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?|```/g, "").trim();

    const parsedData = JSON.parse(jsonText);
    
    return parsedData;
  } catch (err: any) {
    console.error("OpenRouter API Error:", err);
    throw new Error(err.message || "Failed to process receipt");
  }
}

