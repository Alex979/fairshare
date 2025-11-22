'use server';

import { SYSTEM_PROMPT } from "./lib/prompts";
import { BillDataSchema } from "./lib/schema";
import { ZodError } from "zod";

export async function processReceiptAction(base64Data: string, userPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  
  console.log(`Processing receipt: ${Math.round(base64Data.length / 1024)}KB payload`);

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
    if (result.error) {
        console.error("OpenRouter API Error response:", result.error);
        throw new Error(result.error.message || "OpenRouter API Error");
    }

    let jsonText = result.choices[0].message.content;
    
    // Enhanced cleanup for JSON
    jsonText = jsonText.replace(/```json\n?|```/g, "").trim();
    
    // Sometimes models add text before or after the JSON, try to find the first { and last }
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    let parsedData;
    try {
        parsedData = JSON.parse(jsonText);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Raw Text:", jsonText);
        throw new Error("Failed to parse AI response as JSON");
    }
    
    // Validate with Zod
    const validatedData = BillDataSchema.parse(parsedData);
    
    return validatedData;
  } catch (err: unknown) {
    console.error("Process Receipt Error:", err);
    
    if (err instanceof ZodError) {
         throw new Error(`Invalid data format from AI: ${err.issues.map((i) => i.message).join(", ")}`);
    }
    
    const errorMessage = err instanceof Error ? err.message : "Failed to process receipt";
    throw new Error(errorMessage);
  }
}
