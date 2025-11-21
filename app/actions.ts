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
4. 'modifiers': Look for Tax on receipt. Look for Tip in receipt or prompt. 
   - Tip type: "percentage" or "fixed". If percentage, the 'value' should be the whole number (e.g., 20 for 20%, not 0.2).
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
  const apiKey = process.env.GEMINI_API_KEY || "";
  
  if (!apiKey) {
    throw new Error("Gemini API Key not configured on server.");
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            { text: `User Instructions: ${userPrompt}` },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    const jsonText = result.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(jsonText);
    
    return parsedData;
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    throw new Error(err.message || "Failed to process receipt");
  }
}

