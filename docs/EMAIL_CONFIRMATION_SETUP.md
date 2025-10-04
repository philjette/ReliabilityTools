# Email Confirmation Setup Guide

This guide will help you configure email confirmation for user authentication in your Reliability Tools application.

## Understanding the Issue

When users sign up, Supabase sends a confirmation email by default. However, if email delivery isn't configured properly, users won't receive these emails and can't complete registration.

## Quick Fix for Development

### Disable Email Confirmation (Recommended for Development)

1. **Open Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on **Providers**
   - Click on **Email**

3. **Disable Email Confirmation**
   - Find the **"Confirm email"** toggle
   - Turn it **OFF**
   - Click **Save**

4. **Test Sign-Up**
   - Users can now sign up and sign in immediately
   - No email confirmation required

### Alternative: Use Supabase's Built-in Email Service

Supabase provides a built-in email service for development:
- Limited to 3 emails per hour
- Only works in development
- Emails may go to spam
- Check your spam/junk folder

## Production Setup

For production environments, you should configure a proper email service.

### Option 1: Custom SMTP (Recommended)

#### Step 1: Choose an Email Service Provider

Popular options:
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **AWS SES** (Very cost-effective)
- **Postmark** (Excellent deliverability)
- **Resend** (Developer-friendly)

#### Step 2: Get SMTP Credentials

For SendGrid example:
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify your sender email/domain
3. Create an API key
4. Note your SMTP settings:
   - Server: `smtp.sendgrid.net`
   - Port: `587` (or `465` for SSL)
   - Username: `apikey`
   - Password: Your API key

#### Step 3: Configure Supabase

1. Go to **Authentication** → **Email Templates** in Supabase
2. Click on **Settings** tab
3. Scroll to **SMTP Settings**
4. Enter your SMTP credentials:
   \`\`\`
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: YOUR_SENDGRID_API_KEY
   Sender email: noreply@yourdomain.com
   Sender name: Reliability Tools
   \`\`\`
5. Click **Save**

#### Step 4: Enable Email Confirmation

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to **ON**
3. Click **Save**

### Option 2: Use Vercel Email Integration

If deploying on Vercel, you can use their email integration:

1. Install the Vercel Email integration in your dashboard
2. Configure the integration in Supabase
3. Follow Vercel's setup guide

## Email Template Customization

### Customize Confirmation Email

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Customize the template:
   \`\`\`html
   <h2>Welcome to Reliability Tools!</h2>
   <p>Click the link below to confirm your email address:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
   \`\`\`
4. Click **Save**

### Available Templates

- **Confirm signup** - Sent when users register
- **Invite user** - Sent when inviting team members
- **Magic link** - Passwordless sign-in
- **Change email address** - Email change confirmation
- **Reset password** - Password reset emails

## Troubleshooting

### Users Not Receiving Emails

1. **Check Spam Folder**
   - Confirmation emails often go to spam
   - Ask users to check junk/spam folders

2. **Verify SMTP Settings**
   - Test SMTP credentials outside Supabase
   - Ensure port and security settings are correct

3. **Check Supabase Logs**
   - Go to **Logs** in Supabase dashboard
   - Filter by authentication events
   - Look for email sending errors

4. **Verify Sender Domain**
   - Some providers require domain verification
   - Configure SPF, DKIM, and DMARC records

5. **Rate Limits**
   - Check if you've hit provider rate limits
   - Upgrade plan if necessary

### Email Delivery is Slow

1. **Check Provider Status**
   - Verify your email provider is operational
   - Check their status page

2. **SMTP vs API**
   - Consider using provider's API instead of SMTP
   - APIs are often faster and more reliable

### Testing Email Delivery

Use a test email service:
- [MailHog](https://github.com/mailhog/MailHog) - Local email testing
- [Mailtrap](https://mailtrap.io) - Email sandbox
- [Ethereal](https://ethereal.email) - Fake SMTP service

## Security Best Practices

1. **Use Environment Variables**
   - Never commit SMTP credentials
   - Store in environment variables
   - Use Vercel/Supabase secrets

2. **Enable Rate Limiting**
   - Configure rate limits in Supabase
   - Prevent abuse and spam

3. **Verify Sender Domain**
   - Use a custom domain
   - Configure proper DNS records
   - Improves deliverability

4. **Monitor Email Metrics**
   - Track delivery rates
   - Monitor bounce rates
   - Watch for spam complaints

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Email Confirmation | Disabled | Enabled |
| Email Service | Supabase Built-in | Custom SMTP |
| Rate Limits | Relaxed | Strict |
| Domain | localhost | Custom domain |
| SSL/TLS | Optional | Required |

## Next Steps

1. Choose development or production setup
2. Configure email service
3. Test email delivery
4. Customize email templates
5. Monitor deliverability
6. Set up error alerts

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [SendGrid Setup Guide](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- [Email Deliverability Best Practices](https://postmarkapp.com/guides/email-deliverability)
- [Testing Email Locally](https://mailtrap.io/blog/test-emails-in-staging/)

## Support

If you continue to have issues:
1. Check Supabase Discord/Community
2. Review Supabase documentation
3. Contact your email provider support
4. Open a GitHub issue in this repository
