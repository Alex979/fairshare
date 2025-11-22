/**
 * Environment variable configuration and validation
 * Server-side only
 */

/**
 * Validates that all required environment variables are present
 * Throws an error if any are missing
 */
export function validateServerEnv(): void {
  const required = ['OPENROUTER_API_KEY'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file or environment configuration.'
    );
  }
}

/**
 * Gets the OpenRouter API key with validation
 */
export function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not configured. ' +
      'Please add it to your .env.local file.'
    );
  }

  return apiKey;
}

