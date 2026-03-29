# ⚡ Quick Start Guide

Your Creator Commerce website is **100% complete**! Follow these 3 steps:

## Step 1: Install Dependencies (2 minutes)

```bash
cd /Users/mrbotanic/Desktop/Affiliate
npm install
```

**If npm is slow or fails:**
```bash
yarn install
# or
pnpm install
```

---

## Step 2: Configure Forms (5 minutes)

### Get Free API Keys:
1. Visit: **https://web3forms.com**
2. Enter your email → Get Access Key
3. Create 2 keys:
   - "Brands Form"
   - "Creators Form"

### Update Files:
1. Open `app/brands/page.tsx`
   - Find line 51: `YOUR_BRANDS_ACCESS_KEY`
   - Replace with your first key

2. Open `app/creators/page.tsx`
   - Find line 60: `YOUR_CREATORS_ACCESS_KEY`
   - Replace with your second key

---

## Step 3: Run & Test (1 minute)

```bash
npm run dev
```

Open: **http://localhost:3000**

### Test Checklist:
- ✅ Home page loads with animations
- ✅ Click "For Brands" → Brands page
- ✅ Click "For Creators" → Creators page
- ✅ Submit test form on Brands page
- ✅ Submit test form on Creators page
- ✅ Resize browser → Check mobile layout

---

## 🎉 Done!

Your site is ready. To deploy:

```bash
npm run build
```

Then push to GitHub and deploy to Vercel/Netlify.

---

## 🐛 Troubleshooting

**Dependencies won't install?**
- Check internet connection
- Try: `npm install --legacy-peer-deps`
- Or use `yarn` instead

**Forms not working?**
- Verify API keys are correct (no typos)
- Check browser console for errors
- Ensure you replaced the placeholder text

**Need help?**
- Read `README.md` for full documentation
- Read `SETUP.md` for detailed setup
- Read `PROJECT_SUMMARY.md` for what's included

---

**Next:** Install dependencies, configure forms, and you're live! 🚀
