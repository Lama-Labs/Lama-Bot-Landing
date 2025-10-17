This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Demo API Keys (JSON object mapping assistant IDs to their API keys)
# Each key should be from a Clerk user account with appropriate vectorStoreId in privateMetadata
DEMO_API_KEYS={"alpacachat":"key_for_alpacachat_assistant","gym":"key_for_gym_assistant","wristway":"key_for_wristway_assistant"}
```

**Note:** The app automatically detects the deployment URL. On Vercel, `VERCEL_URL` is automatically provided. Locally, it defaults to `http://localhost:3000`.

**Demo Assistant Configuration:**

- `alpacachat`: Alpaca Chat website assistant (default)
- `gym`: Fitness/Gym Assistant (requires vectorStore `vs_FyHYZ4MCvmlYV761G73hK4vA`)
- `wristway`: Wristway Ergonomic Assistant (requires vectorStore `vs_yMRChIljXKBsMw3TP8m20r9D`)

Each API key must correspond to a Clerk user account with:

- The appropriate `vectorStoreId` in their `privateMetadata`
- An active subscription

### Running the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
