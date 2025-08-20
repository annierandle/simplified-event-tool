# 📧 Quick Start: Email Integration Setup

**The Outlook integration is FULLY BUILT and ready to use!** You just need to provide credentials.

## 🚀 Current Status
✅ Microsoft Graph API integration: **COMPLETE**  
✅ Professional email templates: **COMPLETE**  
✅ Calendar invites: **COMPLETE**  
✅ SMTP fallback system: **COMPLETE**  

## ⚡ Quick Setup Options

### Option 1: SMTP Setup (5 minutes)
**Get email working immediately:**

1. **Update your `.env` file:**
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Company Info
COMPANY_NAME=Your Company Name
COMPANY_EMAIL=your-email@gmail.com
COMPANY_WEBSITE=https://yourcompany.com
```

2. **Get Gmail App Password:**
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

3. **Restart the app:**
```bash
pm2 restart corporate-events-scheduler
```

### Option 2: Full Outlook Integration (15 minutes)
**For professional Outlook integration:**

1. **Go to Azure Portal:** https://portal.azure.com
2. **Create App Registration:**
   - Search "App registrations" → "New registration"
   - Name: "Corporate Events Scheduler"
   - Register and copy Client ID + Tenant ID

3. **Create Client Secret:**
   - Go to "Certificates & secrets" → "New client secret"
   - Copy the secret VALUE immediately

4. **Add API Permissions:**
   - "API permissions" → "Add a permission" → "Microsoft Graph"
   - Application permissions: `Mail.Send`, `Calendars.ReadWrite`, `User.Read.All`
   - Grant admin consent

5. **Update `.env` file:**
```env
# Microsoft Graph API
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here
AZURE_TENANT_ID=your-tenant-id-here

# Company Info
COMPANY_NAME=Your Company Name
COMPANY_EMAIL=contact@yourcompany.com
COMPANY_WEBSITE=https://yourcompany.com
```

## 🧪 Test Your Setup

**Test endpoint:**
```
https://3000-if3m43dq3v5w7wyfcyyig-6532622b.e2b.dev/api/meetings/test/email-config
```

**Working Link:** [Click here to test your email configuration](https://3000-if3m43dq3v5w7wyfcyyig-6532622b.e2b.dev/api/meetings/test/email-config)

**What emails get sent:**
- ✉️ Meeting request confirmation
- ✅ Meeting approved notification  
- ❌ Meeting rejected notification
- 🎉 Meeting completed thank you

## 🔧 Troubleshooting

**SMTP not working?**
- Check Gmail app password (not regular password)
- Verify 2-factor auth is enabled
- Try different SMTP_SECURE settings

**Graph API not working?**
- Verify all 3 credentials are correct
- Check API permissions are granted
- Ensure admin consent was given

## 📞 Need Help?

Check the full setup guide: `OUTLOOK_SETUP.md`

**The integration is ready - just add your credentials! 🚀**