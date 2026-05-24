/**
 * Email configuration — centralized so we can swap providers without hunting through the codebase.
 *
 * CURRENT STATE: All transactional auth emails (signup confirm, password reset, invite,
 * change email) flow through Supabase Auth using Supabase's built-in SMTP relay.
 * That relay has a hard cap of ~2 emails/hour and sends from `noreply@mail.app.supabase.io`.
 *
 * MIGRATION TO ZOHO (planned):
 * 1. Configure custom SMTP in Supabase Dashboard → Authentication → Emails → SMTP Settings
 *    using the noreply@dialektoz.com Zoho mailbox + App Password.
 * 2. Flip USE_CUSTOM_SMTP_FROM = true below to surface the Zoho sender in any UI hint
 *    we may show ("you'll receive an email from noreply@dialektoz.com").
 * 3. For app-level emails we send directly (e.g. role-change notifications via nodemailer),
 *    set EMAIL_FROM env var to noreply@dialektoz.com.
 *
 * Until then: every place that imports SENDER_FROM gets the Supabase fallback,
 * and we don't have to change call sites once we migrate.
 */

const USE_CUSTOM_SMTP_FROM = true

export const SENDER_FROM = USE_CUSTOM_SMTP_FROM
  ? 'Dialektoz <noreply@dialektoz.com>'
  : 'Dialektoz <noreply@mail.app.supabase.io>'

export const SUPPORT_EMAIL = 'angel@dialektoz.com'
