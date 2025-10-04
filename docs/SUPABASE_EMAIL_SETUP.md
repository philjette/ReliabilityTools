# Supabase Email Configuration Guide

## Why Supabase's Default Email Service Doesn't Work Well

Supabase provides a minimal built-in email service for development, but it has significant limitations:

- **Rate Limited**: Only 3-4 emails per hour
- **Poor Deliverability**: Often goes to spam
- **No Customization**: Limited branding options
- **Not Production-Ready**: Intended for testing only
- **No Guarantees**: May fail without warning

## Quick Fix: Disable Email Confirmation

### For Development (Recommended)

**Step-by-Step Instructions:**

1. **Open Supabase Dashboard**
   - URL: https://app.supabase.com
   - Log in with your account
   - Select your project

2. **Navigate to Authentication**
   - Click "Authentication" in left sidebar
   - Click "Providers" tab
   - Click "Email" provider

3. **Disable Confirmation**
   \`\`\`
   Authentication → Providers → Email
   
   Settings:
   ✅ Enable Email provider: ON (keep enabled)
   ❌ Confirm email: OFF (disable this)
   ✅ Enable Email Signup: ON (keep enabled)
   
   Click: [Save]
   \`\`\`

4. **Verify Changes**
   - Go to "Users" tab
   - You should see "Email confirmation: Disabled"

5. **Test Sign-Up**
   - Create a new account in your app
   - You should be logged in immediately
   - No email verification required

### What This Does

When email confirmation is **disabled**:
- ✅ Users can sign up instantly
- ✅ No email verification needed
- ✅ Users can sign in immediately
- ✅ Perfect for development/testing
- ⚠️ Less secure for production

When email confirmation is **enabled**:
- 📧 Confirmation email is sent
- ⏳ User must click link in email
- 🔒 More secure
- ❌ Requires working email service

## Production Solution: Configure SMTP

For production, you MUST use a real email service provider.

### Recommended Email Providers

#### 1. SendGrid (Most Popular)
- **Free Tier**: 100 emails/day
- **Pricing**: $19.95/mo for 50K emails
- **Setup Time**: 15 minutes
- **Deliverability**: Excellent

**Setup Instructions:**

\`\`\`bash
# 1. Sign up at sendgrid.com
# 2. Verify your email
# 3. Create API key: Settings → API Keys → Create API Key
# 4. Note these settings:

SMTP Host: smtp.sendgrid.net
SMTP Port: 587
Username: apikey
Password: YOUR_SENDGRID_API_KEY
\`\`\`

#### 2. Resend (Developer-Friendly)
- **Free Tier**: 3,000 emails/month
- **Pricing**: $20/mo for 50K emails
- **Setup Time**: 5 minutes
- **Deliverability**: Excellent

#### 3. Amazon SES (Most Cost-Effective)
- **Free Tier**: 62,000 emails/month (when hosted on AWS)
- **Pricing**: $0.10 per 1,000 emails
- **Setup Time**: 30 minutes
- **Deliverability**: Excellent

#### 4. Postmark (Best Deliverability)
- **Free Trial**: 100 emails
- **Pricing**: $15/mo for 10K emails
- **Setup Time**: 10 minutes
- **Deliverability**: Outstanding

### Configure SMTP in Supabase

1. **Get SMTP Credentials** from your email provider

2. **Open Supabase Dashboard**
   - Go to Project Settings
   - Click "Auth" tab
   - Scroll to "SMTP Settings"

3. **Enter SMTP Details**
   \`\`\`
   SMTP Settings:
   
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: SG.xxxxxxxxxxxxx
   Sender email: noreply@yourdomain.com
   Sender name: Reliability Tools
   
   Enable TLS: ✅ ON
   \`\`\`

4. **Test Configuration**
   - Click "Send Test Email"
   - Check your inbox
   - Verify email arrives

5. **Enable Email Confirmation**
   - Go to Authentication → Providers → Email
   - Turn ON "Confirm email"
   - Click Save

### Customize Email Templates

1. **Navigate to Email Templates**
   - Authentication → Email Templates
   - Select "Confirm signup"

2. **Customize Template**
   \`\`\`html
   <h2>Welcome to {{ .SiteURL }}!</h2>
   <p>Thanks for signing up. Click below to confirm your email:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm Email Address</a></p>
   <p>If you didn't create this account, you can safely ignore this email.</p>
   \`\`\`

3. **Available Variables**
   - `{{ .ConfirmationURL }}` - Email confirmation link
   - `{{ .SiteURL }}` - Your site URL
   - `{{ .Token }}` - Confirmation token
   - `{{ .TokenHash }}` - Hashed token
   - `{{ .Email }}` - User's email address

## Troubleshooting

### Issue: Emails Going to Spam

**Solutions:**
1. Verify your sender domain with your email provider
2. Set up SPF, DKIM, and DMARC DNS records
3. Use a custom domain (not gmail.com)
4. Warm up your IP address gradually
5. Follow email best practices

### Issue: Emails Not Sending

**Check:**
1. SMTP credentials are correct
2. Port is correct (usually 587 or 465)
3. TLS is enabled
4. Your email provider account is active
5. You haven't hit rate limits

**Debug Steps:**
\`\`\`bash
# Check Supabase logs
1. Go to Logs in dashboard
2. Filter by "auth" events
3. Look for email errors

# Test SMTP outside Supabase
# Use a tool like swaks or telnet
swaks --to test@example.com \
      --server smtp.sendgrid.net:587 \
      --auth-user apikey \
      --auth-password YOUR_API_KEY
\`\`\`

### Issue: Confirmation Link Not Working

**Check:**
1. Site URL is set correctly in Supabase settings
2. Redirect URLs are configured
3. Confirmation link hasn't expired (24 hours default)
4. User hasn't already confirmed

## Testing Locally

### Use MailHog (Recommended)

\`\`\`bash
# 1. Install MailHog
brew install mailhog  # macOS
# or download from: https://github.com/mailhog/MailHog

# 2. Start MailHog
mailhog

# 3. Configure Supabase SMTP
Host: localhost
Port: 1025
Username: (leave empty)
Password: (leave empty)

# 4. View emails at: http://localhost:8025
\`\`\`

### Use Mailtrap

1. Sign up at mailtrap.io
2. Get SMTP credentials from dashboard
3. Configure in Supabase
4. View emails in Mailtrap inbox

## Environment-Specific Setup

### Development
\`\`\`bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase Settings
Email Confirmation: OFF
SMTP: Not required (or use MailHog)
\`\`\`

### Staging
\`\`\`bash
# Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_staging_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_key

# Supabase Settings
Email Confirmation: ON
SMTP: Test provider (Mailtrap)
\`\`\`

### Production
\`\`\`bash
# Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key

# Supabase Settings
Email Confirmation: ON
SMTP: Production provider (SendGrid/Resend)
Custom Domain: enabled
Rate Limits: configured
\`\`\`

## Security Considerations

### Production Checklist

- [ ] Email confirmation is enabled
- [ ] Custom SMTP is configured
- [ ] Sender domain is verified
- [ ] SPF/DKIM/DMARC records are set
- [ ] Rate limiting is enabled
- [ ] Email templates are customized
- [ ] Redirect URLs are whitelisted
- [ ] SSL/TLS is enabled
- [ ] Monitor email deliverability
- [ ] Set up alerts for failures

### Rate Limits

Configure in Supabase → Auth → Rate Limits:
\`\`\`
Email sends per hour: 10
Sign-ups per hour: 50
Password resets per hour: 10
\`\`\`

## Cost Comparison

| Provider | Free Tier | Basic Plan | Per Email |
|----------|-----------|------------|-----------|
| SendGrid | 100/day | $19.95 (50K) | $0.0004 |
| Resend | 3,000/mo | $20 (50K) | $0.0004 |
| AWS SES | 62K/mo* | Pay as you go | $0.0001 |
| Postmark | 100 trial | $15 (10K) | $0.0015 |
| Mailgun | 5,000/mo | $35 (50K) | $0.0007 |

*When hosted on AWS

## Next Steps

1. **Immediate**: Disable email confirmation for development
2. **Before Testing**: Test sign-up flow thoroughly
3. **Before Launch**: Set up production SMTP
4. **After Launch**: Monitor email deliverability
5. **Ongoing**: Review email metrics monthly

## Support Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [SendGrid Setup Guide](https://docs.sendgrid.com/)
- [Email Deliverability Guide](https://postmarkapp.com/guides/email-deliverability)
- [Supabase Discord](https://discord.supabase.com)

## Common Questions

**Q: Can I use Gmail SMTP?**
A: Yes, but not recommended. Limited to 500 emails/day and requires app passwords.

**Q: How long do confirmation links last?**
A: 24 hours by default. Configurable in Supabase settings.

**Q: Can users request a new confirmation email?**
A: Yes, implement a "Resend confirmation" feature using Supabase Auth API.

**Q: What if a user's email bounces?**
A: Supabase will mark the email as bounced. Monitor bounce rates in your email provider.

**Q: Can I disable email for some users?**
A: Yes, create users via Admin API with `email_confirm: true` parameter.
