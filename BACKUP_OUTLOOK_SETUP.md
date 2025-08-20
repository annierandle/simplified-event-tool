# Microsoft Outlook Integration Setup Guide

This guide will walk you through setting up Microsoft Outlook integration for the Corporate Events Scheduler application.

## 🔵 What is Microsoft Azure?

**Microsoft Azure** is Microsoft's cloud computing platform that provides various services including identity and access management. For Outlook integration, we need **Azure Active Directory (Azure AD)**, which is Microsoft's cloud-based identity service.

## 📧 Why Do We Need Azure?

Microsoft requires all applications that access Outlook/Office 365 services to be registered through Azure AD for security reasons. This ensures that only authorized applications can access users' email accounts and calendars.

## 🚀 Current Integration Status

✅ **FULLY IMPLEMENTED** - The Outlook integration code is complete and ready to use!

### What's Already Built:

- **Complete Microsoft Graph API integration**
- **Professional HTML email templates** optimized for Outlook
- **Automatic calendar invite generation** (ICS files)
- **SMTP fallback system** using Nodemailer
- **Status-based email workflows** (pending, approved, rejected, completed)
- **Calendar event creation** in Outlook when meetings are approved

## 🔧 Setup Requirements

### Option 1: Microsoft Graph API (Recommended)

To enable full Outlook integration, you need:

1. **Azure App Registration**
2. **API Permissions**
3. **Environment Variables**

### Option 2: SMTP Fallback (Works Immediately)

For basic email functionality without Azure setup:

1. **Gmail or other SMTP provider**
2. **App passwords**
3. **Environment variables**

---

## 📋 Step-by-Step Setup

### 🔵 Method 1: Microsoft Graph API (Full Outlook Integration)

#### Step 1: Create Azure App Registration

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com
   - Sign in with your Microsoft account

2. **Navigate to App Registrations**
   - Search for "App registrations" in the search bar
   - Click on "App registrations"

3. **Create New Registration**
   - Click "New registration"
   - **Name**: `Corporate Events Scheduler`
   - **Supported account types**: 
     - Choose "Accounts in this organizational directory only" (for single tenant)
     - Or "Accounts in any organizational directory" (for multi-tenant)
   - **Redirect URI**: Leave blank for now
   - Click "Register"

4. **Copy Application Details**
   - After registration, note down:
     - **Application (client) ID**
     - **Directory (tenant) ID**

#### Step 2: Create Client Secret

1. **In your app registration**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - **Description**: `Corporate Events API Secret`
   - **Expires**: Choose duration (12 months recommended)
   - Click "Add"

2. **Copy Secret Value**
   - **IMPORTANT**: Copy the secret **VALUE** immediately
   - This will only be shown once!

#### Step 3: Configure API Permissions

1. **Go to API Permissions**
   - In your app registration, click "API permissions"
   - Click "Add a permission"

2. **Add Microsoft Graph Permissions**
   - Choose "Microsoft Graph"
   - Choose "Application permissions"
   - Add these permissions:
     - `Mail.Send` - Send emails
     - `Calendars.ReadWrite` - Create calendar events
     - `User.Read.All` - Read user profiles

3. **Grant Admin Consent**
   - Click "Grant admin consent for [Your Organization]"
   - Confirm by clicking "Yes"

#### Step 4: Configure Environment Variables

Update your `.env` file with the Azure credentials:

```env
# Microsoft Graph API Configuration
AZURE_CLIENT_ID=your-application-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-value-here
AZURE_TENANT_ID=your-directory-tenant-id-here

# Company Information (for emails)
COMPANY_NAME=Your Company Name
COMPANY_EMAIL=contact@yourcompany.com
COMPANY_WEBSITE=https://yourcompany.com
```

---

### 📧 Method 2: SMTP Fallback (Quick Setup)

If you want to get email functionality working immediately without Azure setup:

#### Step 1: Get SMTP Credentials

**For Gmail:**
1. Enable 2-factor authentication on your Google account
2. Generate an "App Password":
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

**For Other Providers:**
- Get SMTP server details from your email provider
- Ensure you have authentication credentials

#### Step 2: Configure Environment Variables

Update your `.env` file:

```env
# SMTP Configuration (Fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here

# Company Information
COMPANY_NAME=Your Company Name
COMPANY_EMAIL=your-email@gmail.com
COMPANY_WEBSITE=https://yourcompany.com
```

---

## 🧪 Testing the Integration

### Test Configuration

Visit the test endpoint to check your setup:
```
https://3000-if3m43dq3v5w7wyfcyyig-6532622b.e2b.dev/api/meetings/test/email-config
```

**Working Link:** [Click here to test your email configuration](https://3000-if3m43dq3v5w7wyfcyyig-6532622b.e2b.dev/api/meetings/test/email-config)

This will show:
- ✅ Microsoft Graph status
- ✅ SMTP status  
- 📋 Configuration recommendations

### Test Email Sending

1. **Submit a meeting request** through the frontend
2. **Check if confirmation email is sent**
3. **Update meeting status** in admin panel
4. **Verify status update emails are sent**

---

## 📧 Email Features

### Automatic Emails Sent:

1. **Meeting Request Submitted** (`pending`)
   - Confirmation email to client
   - Copy to sales representative
   - Professional HTML template
   - Calendar invite attachment (.ics)

2. **Meeting Approved** (`approved`)
   - Confirmation with meeting details
   - Calendar invite with exact time/location
   - Sales rep contact information
   - Automatic calendar event created in Outlook

3. **Meeting Rejected** (`rejected`)
   - Polite notification with alternatives
   - Admin notes (if provided)
   - Suggestions for rescheduling

4. **Meeting Completed** (`completed`)
   - Thank you email
   - Follow-up contact information
   - Next steps guidance

### Email Template Features:

- **Mobile responsive design**
- **Professional corporate styling**
- **Outlook-optimized HTML**
- **Company branding integration**
- **Clear call-to-action buttons**
- **Automatic calendar integration**

---

## 🔧 Troubleshooting

### Common Issues:

#### Microsoft Graph Errors:
- **"Authentication failed"**: Check client ID, secret, and tenant ID
- **"Insufficient privileges"**: Ensure API permissions are granted and admin consent given
- **"User not found"**: Verify the `COMPANY_EMAIL` exists in your organization

#### SMTP Errors:
- **"Authentication failed"**: Check username/password and enable app passwords
- **"Connection refused"**: Verify SMTP host and port settings
- **"TLS errors"**: Try different SMTP_SECURE settings (true/false)

#### Email Not Received:
- **Check spam folders**
- **Verify email addresses are correct**
- **Check application logs** for error messages
- **Test with the configuration endpoint**

### Getting Help:

1. **Check application logs**:
   ```bash
   pm2 logs corporate-events-scheduler --nostream
   ```

2. **Test configuration**:
   ```bash
   curl https://your-app-url/api/meetings/test/email-config
   ```

3. **Verify environment variables**:
   ```bash
   cat .env
   ```

---

## 🎯 Benefits of Full Integration

### With Microsoft Graph API:
- ✅ **Seamless Outlook integration**
- ✅ **Automatic calendar events** in sales rep calendars
- ✅ **Professional email delivery**
- ✅ **Better deliverability** (not marked as spam)
- ✅ **Corporate email authentication**
- ✅ **Advanced calendar features**

### With SMTP Fallback:
- ✅ **Quick setup** (no Azure required)
- ✅ **Basic email functionality**
- ✅ **Calendar invites** via attachments
- ✅ **Works with any email provider**

---

## 📞 Support

If you need help with the setup:

1. **Azure Portal**: https://portal.azure.com
2. **Microsoft Graph Documentation**: https://docs.microsoft.com/en-us/graph/
3. **Application Support**: Check the logs and test endpoints

The integration is **fully built and ready** - you just need to provide the credentials!