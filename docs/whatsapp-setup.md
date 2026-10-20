# WhatsApp Business Platform Setup Guide

## Overview
StitchFlow integrates with the official Meta WhatsApp Business Platform (Cloud API) to send order confirmation, completion, and delivery notifications to customers.

## Development Mode (Default — No Setup Required)
By default, StitchFlow runs in **Sandbox Mode**. Messages are NOT sent to real phone numbers. Instead, they are logged in the backend console and stored in the database with status `MOCK_SENT`.

This lets you develop and test the complete order workflow without any Meta account.

---

## Setting Up Live WhatsApp Messaging

### Step 1: Create Meta Business Account
1. Go to https://business.facebook.com and create a Business Account.
2. Verify your business.

### Step 2: Create a Meta Developer App
1. Go to https://developers.facebook.com/apps
2. Click **Create App**
3. Choose **Business** type
4. Fill in app name (e.g., "StitchFlow Notifications")
5. Add **WhatsApp** product to your app

### Step 3: Set Up WhatsApp Business Account
1. In your app dashboard → WhatsApp → Getting Started
2. You'll get a **test phone number** (for development)
3. Add your business phone number for production

### Step 4: Get Your Credentials
From the WhatsApp dashboard, copy:
- **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID` in your .env
- **WhatsApp Business Account ID** → `WHATSAPP_BUSINESS_ACCOUNT_ID` in your .env
- **Temporary Access Token** (valid 24h) or create a **System User Token** (permanent)

### Step 5: Create Message Templates
Templates must be approved by Meta before use (takes 1–3 business days for new accounts).

Create these templates in your Meta Business Manager → WhatsApp → Message Templates:

#### Template 1: `order_received`
```
Category: UTILITY
Language: English (en)
Body:
Hello {{1}}! 👋

Thank you for choosing {{2}}.

Your order has been registered.

Order No: {{3}}
Total: {{4}}
Advance Received: {{5}}
Balance Due: {{6}}

We will notify you when your order is ready. ❤️
```

#### Template 2: `order_completed`  
```
Category: UTILITY
Language: English (en)
Body:
Hello {{1}}! ✨

Great news! Your order {{2}} is ready for pickup at {{3}}.

Total: {{4}}
Advance Received: {{5}}
Balance Due: {{6}}

Please visit us to collect your garments. ❤️
```

#### Template 3: `order_delivered`
```
Category: UTILITY
Language: English (en)
Body:
Hello {{1}}! 💖

Your order {{2}} has been delivered. Thank you for choosing {{3}}!

Final Amount: {{4}}
Amount Paid: {{5}}
Balance Due: {{6}}

We look forward to serving you again! ✨
```

### Step 6: Configure Webhook (For Delivery Status)
1. In your Meta App → WhatsApp → Configuration → Webhooks
2. Set Callback URL: `https://your-backend-domain.com/whatsapp/webhook`
3. Set Verify Token: Same value as `WHATSAPP_VERIFY_TOKEN` in your .env
4. Subscribe to: **messages** (for delivery receipts)

### Step 7: Enable Live Mode in StitchFlow
1. Open StitchFlow app → Settings → WhatsApp
2. Enter your **Phone Number ID** and **Access Token**
3. Toggle **Sandbox Mode** OFF
4. Tap **Test Connection**

---

## Environment Variables Reference

```env
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_permanent_system_user_token  
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
WHATSAPP_VERIFY_TOKEN=your_custom_webhook_verify_token
WHATSAPP_SANDBOX_MODE=false   # Set to false for live mode
```

---

## Message Delivery Flow

```
Order Submitted
     │
     ▼
WhatsApp Message Record Created (status: QUEUED)
     │
     ▼
Bull Job Queue (Redis)
     │
     ▼
WhatsApp Processor (background worker)
     │
     ├── Sandbox Mode? → Log message, status: MOCK_SENT
     │
     └── Live Mode? → POST to Meta API
                          │
                          ├── Success → status: SENT
                          │               │
                          │               ▼
                          │         Webhook callback
                          │               │
                          │               └── status: DELIVERED
                          │
                          └── Failure → Retry (max 3 times, backoff)
                                        → status: FAILED (after exhausting retries)
```

---

## Testing Live Integration
1. Use a real phone number in your WhatsApp Business test contacts
2. Your number must be added as a test recipient in Meta Developer Console
3. Send a test order and verify message receipt

## Troubleshooting
- **401 Unauthorized**: Access token expired — generate new system user token
- **400 Bad Request**: Phone number format wrong — must be E.164 (e.g., +919876543210)
- **131009 Parameter Missing**: Template variable count mismatch — check template parameters
- **Webhook not receiving**: Ensure your backend is publicly accessible (use ngrok for local dev)
