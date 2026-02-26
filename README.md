# USPS Shipping Label (EasyPost MVP)

Generate and print USPS shipping labels using the EasyPost API. Addresses are US-only; package weight is in ounces and dimensions in inches.

## Quick start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set your EasyPost API key**

   Copy the example env file and add your test key:

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and set `EASYPOST_API_KEY` to the key supplied for the interview or from your [EasyPost](https://www.easypost.com/) test account.

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Fill in From and To addresses (US only) and package weight/dimensions, then click **Generate label**. Use **Print label** to open the label in a new window and print. Test labels are fine and do not charge real postage.

## Assumptions

- **US only**: From and To addresses must be in the United States (state dropdown, ZIP 5 or 9 digits).
- **Test labels**: The app is intended for test keys; printing test labels does not incur real postage cost.
- **Single rate**: The app selects the lowest USPS rate for the shipment; no carrier or service selection.
- **No auth**: Single-user, no login or persistence of labels.

## What I’d do next

- **Validation**: Stronger client-side validation (e.g. required fields, ZIP format) and clearer inline errors.
- **Error handling**: More specific error messages from EasyPost (e.g. address validation failures) and retry/back-off for transient errors.
- **Tests**: Add more unit tests and integration tests for the create-label flow.
- **Production**: Switch to a production EasyPost API key when going live; consider rate limits and cost controls.
- **UX**: Optional address verification (EasyPost API), rate selection (show multiple USPS options), and label history/download.
- **Address autocomplete**: EasyPost does not provide street/address type-ahead. A next step would be to integrate a third-party autocomplete (e.g. Google Places) for suggestions.

## Other instructions

- **Node**: Next.js 16 requires Node.js >= 20.9.0. Use `nvm use 20` (or similar) if needed.
- **Lint**: `npm run lint`
- **Tests**: `npm run test:run` — runs unit tests for request validation and the create-label API (EasyPost mocked).
