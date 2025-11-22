# FairShare - AI Bill Splitter

An intelligent bill-splitting application that uses AI to parse receipts and natural language to automatically calculate how much each person owes.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Features

- 📸 **Receipt Upload**: Snap a photo of any receipt
- 🤖 **AI-Powered Parsing**: Automatically extracts items, prices, tax, and tip
- 💬 **Natural Language Input**: Describe the split in plain English (e.g., "Alice and Bob shared the apps")
- ✏️ **Manual Editing**: Fine-tune splits with an intuitive editor
- 💰 **Smart Calculations**: Automatically distributes tax and tip proportionally
- 📱 **Venmo Integration**: One-tap payment requests
- 🌓 **Dark Mode**: Full dark mode support
- ♿ **Accessible**: WCAG compliant with keyboard navigation and ARIA labels
- 📱 **Responsive**: Works seamlessly on mobile and desktop

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI**: [React 19](https://react.dev/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI**: [OpenRouter](https://openrouter.ai/) with Gemini 2.5 Flash
- **Icons**: [Lucide React](https://lucide.dev/)

## Prerequisites

- Node.js 20+ and npm
- An OpenRouter API key ([Get one here](https://openrouter.ai/))

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ai-bill-splitter
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```bash
OPENROUTER_API_KEY=your_api_key_here
```

To get an OpenRouter API key:
1. Visit [openrouter.ai](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to the API Keys section
4. Create a new key and copy it to your `.env.local` file

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Basic Flow

1. **Upload a Receipt**: Click or tap the upload area to select a receipt photo
2. **Describe the Split**: Enter instructions like:
   - "Alice and Bob split everything equally"
   - "Alice had the burger, Bob had the salad, we shared the fries"
   - "Add a 20% tip"
3. **Review & Edit**: Fine-tune the AI's interpretation using the editor
4. **Request Payment**: Tap the Venmo button to request payment from each person

### Example Prompts

```
Alice and Bob shared the appetizers. 
Alice had the steak. Bob had the pasta.
We split the wine. Add 18% tip.
```

```
Me and Sarah split everything 60/40.
Add $5 tip.
```

```
Everyone splits equally. Add 20% tip.
```

## Project Structure

```
app/
├── actions.ts              # Server actions (AI processing)
├── types.ts                # TypeScript type definitions
├── lib/
│   ├── constants.ts        # App-wide constants
│   ├── validation.ts       # Input validation utilities
│   ├── bill-utils.ts       # Calculation logic
│   ├── image-utils.ts      # Image compression
│   ├── env.ts             # Environment validation
│   └── hooks.ts           # Custom React hooks
└── components/
    └── bill-splitter/
        ├── index.tsx       # Main component
        ├── hooks/
        │   └── useBillSplitter.ts  # Main business logic hook
        ├── views/
        │   ├── InputView.tsx       # Upload & prompt screen
        │   ├── ProcessingView.tsx  # Loading state
        │   └── EditorView.tsx      # Split editor screen
        └── ui/
            ├── Header.tsx
            ├── ParticipantsList.tsx
            ├── LineItemsList.tsx
            ├── ModifierSection.tsx
            ├── ResultsPanel.tsx
            ├── ItemModal.tsx
            └── MobileTabs.tsx
```

## Key Features Explained

### Weight-Based Splitting

Items are split using a weight system:
- Weight of 1 = one portion
- Weight of 2 = two portions
- Fractional weights supported (0.5, 1.5, etc.)

Example: If Alice has weight 2 and Bob has weight 1 for an item:
- Alice pays 2/3 of the cost
- Bob pays 1/3 of the cost

### Tax & Tip Distribution

Tax and tip are distributed proportionally based on each person's share of the subtotal. This ensures fair splitting even when people order different amounts.

### Image Compression

Receipts are automatically compressed before upload to:
- Reduce API costs
- Speed up processing
- Stay within payload limits

Default: 1280px max width, 70% quality JPEG

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Quality

This project includes:
- ✅ TypeScript strict mode
- ✅ ESLint with Next.js rules
- ✅ Input validation and sanitization
- ✅ Comprehensive error handling
- ✅ Accessibility best practices
- ✅ Performance optimizations (memoization, useCallback)

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your `OPENROUTER_API_KEY` environment variable
4. Deploy!

### Other Platforms

Works with any Next.js-compatible hosting:
- Netlify
- Railway
- AWS Amplify
- Self-hosted with Node.js

**Important**: Ensure you set the `OPENROUTER_API_KEY` environment variable on your hosting platform.

## Configuration

### Changing the AI Model

Edit `app/lib/constants.ts`:

```typescript
export const API_MODEL = "google/gemini-2.5-flash-preview-09-2025";
```

See [OpenRouter models](https://openrouter.ai/models) for alternatives.

### Image Compression Settings

Edit `app/lib/constants.ts`:

```typescript
export const IMAGE_MAX_WIDTH = 1280;  // pixels
export const IMAGE_QUALITY = 0.7;     // 0-1
```

### App Branding

Edit `app/lib/constants.ts`:

```typescript
export const APP_NAME = "FairShare";
export const APP_TAGLINE = "Snap a receipt, explain the split, done.";
```

## Troubleshooting

### "OpenRouter API Key not configured"
- Ensure `.env.local` exists with `OPENROUTER_API_KEY=your_key`
- Restart the development server after adding environment variables

### Receipt processing fails
- Check that the image is clear and readable
- Ensure you have sufficient OpenRouter credits
- Try a more detailed prompt

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check that you're using Node.js 20+
- Delete `.next` folder and rebuild

## Contributing

Contributions are welcome! Areas for improvement:
- [ ] Add unit tests
- [ ] Support multiple currencies
- [ ] Add receipt history/persistence
- [ ] Support additional payment platforms (Cash App, Zelle)
- [ ] Export results as PDF
- [ ] Multi-language support

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [OpenRouter](https://openrouter.ai/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
