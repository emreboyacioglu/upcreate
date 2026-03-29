# Creator Commerce

Tüm Creator Commerce dosyaları bu repoda. Şu an: landing page (marketing sitesi). İleride Shopify app bu klasör içine eklenecek.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**

## Getting Started

### 1. Install Dependencies

The project is ready to install. Choose your preferred package manager:

```bash
# Using npm
npm install

# OR using yarn (faster)
yarn install

# OR using pnpm
pnpm install
```

**Note:** If you encounter network issues, try:
- Using a different package manager
- Adding `--legacy-peer-deps` flag for npm
- Checking your internet connection
- Using a VPN if registry is blocked

### 2. Configure Web3Forms (Required for forms to work)

1. Visit [web3forms.com](https://web3forms.com) and get 2 free API keys
2. Open `app/brands/page.tsx` and replace `YOUR_BRANDS_ACCESS_KEY` with your first key
3. Open `app/creators/page.tsx` and replace `YOUR_CREATORS_ACCESS_KEY` with your second key

Alternatively, create a `.env.local` file (see `.env.local.example`) and update the form components to use environment variables.

### 3. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Project Structure

```
/app
  /page.tsx - Home page
  /brands/page.tsx - Brands page with application form
  /creators/page.tsx - Creators page with application form
  /layout.tsx - Root layout with header/footer

/components
  /ui - Reusable UI components (Button, Card, FormField)
  /sections - Page sections (Hero, Problem, Solution, etc.)
  Header.tsx, Footer.tsx, AnimatedContentGrid.tsx

/lib
  constants.ts - All Turkish copy/content
  utils.ts - Utility functions
```

## Content Management

All Turkish copy is centralized in `/lib/constants.ts`. Update content there without touching components.

## Deployment

Build for production:
```bash
npm run build
npm start
```

Deploy to Vercel, Netlify, or any Next.js-compatible hosting.

## Design System

- **Colors**: Near-white background (#FAFAFA), near-black text (#0A0A0A), electric blue accent (#0066FF)
- **Typography**: Inter font, large headings, generous spacing
- **Layout**: Max content width 1280px, 80-128px vertical spacing
- **Components**: Minimal, rounded corners (16-24px), subtle shadows

## License

All rights reserved © 2026 Creator Commerce
