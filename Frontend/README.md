# SCCC AI-Powered Pricing Advisor

This is a React + TypeScript single-page app built with Vite for SCCC's AI-Powered Pricing Advisor.

## Features
- **Left Panel:** AI Chat Window
  - Textarea for user input
  - Message history with styled bubbles (user & AI)
- **Right Panel:** Suggested Services & Cost Estimate
  - Cards for ECS, OSS, TDSQL
  - Monthly cost breakdown: subtotal, VAT (15%), total
  - Action buttons: Accept, Request Alternative, Manual Adjust
- **API Integration:**
  - `/api/ai` for AI-generated config
  - `/api/pricing` for cost breakdown
- **Styling:** TailwindCSS

## Getting Started
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```

## Customization
- Update the UI and logic in `src/` as needed.
- Replace placeholder API endpoints with your backend.

---

For more details, see the `.github/copilot-instructions.md` file.
