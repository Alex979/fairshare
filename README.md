## FairShare · AI Bill Splitter

FairShare lets you snap a photo of a receipt, describe who ordered what, and instantly produce a clean breakdown (per‑person totals, Venmo deeplinks, and “unassigned” reminders). It is built on Next.js 16 with the App Router and runs entirely client-side except for the server action that calls OpenRouter for multimodal parsing.

### Features
- Receipt photo compression before upload to keep payloads small.
- Natural-language instructions (e.g. “Alex ate the burger, everyone split the apps, add 20% tip”).
- Inline editing of participants, line items, modifiers, and share weights.
- Responsive editor/results layout with manual dark mode toggle.
- Calculated Venmo deeplinks to speed up payback requests.

### Requirements
- Node.js 18+ (tested with 22.x)
- npm 10+
- An [OpenRouter API key](https://openrouter.ai/) with access to Gemini 2.5 Flash or equivalent multimodal model.

### Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` and add your OpenRouter key:
   ```bash
   echo "OPENROUTER_API_KEY=sk-your-key" > .env.local
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000`.

### Environment Variables
| Name | Description |
| ---- | ----------- |
| `OPENROUTER_API_KEY` | Required. Used by `processReceiptAction` to talk to OpenRouter. |

### Available Scripts
- `npm run dev` – Start Next.js in development.
- `npm run build` – Build the production bundle.
- `npm run start` – Serve the production build.
- `npm run lint` – Run ESLint (Next.js + TypeScript rules).

### Project Layout
```
app/
  actions.ts                # Server actions (LLM receipt parsing)
  components/bill-splitter/ # Input, processing, editor UI
  lib/                      # Domain utilities (totals, validation, imaging)
  types.ts                  # Shared domain models
```

### Notes
- A mock dataset is available via “Use Example Data” in the UI; edits are performed on a fresh clone so the fixture stays pristine.
- The OpenRouter payload is validated and sanitized before it ever hits the UI. If the LLM returns malformed JSON, the app surfaces a friendly error instead of silently breaking.
- When building for production, ensure your deployment target allows outbound HTTPS requests to `https://openrouter.ai`.

Happy splitting! 🎉
