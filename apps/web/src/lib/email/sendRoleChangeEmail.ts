/**
 * Role-change notification email — STUB.
 *
 * This file is intentionally not wired up yet. It exists so the Zoho/nodemailer
 * migration has a single, obvious place to land.
 *
 * MIGRATION CHECKLIST (for whoever picks this up):
 *  1. `npm install nodemailer @types/nodemailer`.
 *  2. Add env vars:
 *       SMTP_HOST=smtp.zoho.com
 *       SMTP_PORT=587
 *       SMTP_USER=noreply@dialektoz.com
 *       SMTP_PASS=<Zoho App Password>
 *  3. Implement the `sendRoleChangeEmail` function below using nodemailer.
 *  4. Import and call it from src/app/admin/actions.ts → setUserRole, replacing
 *     the console.log placeholder there.
 *  5. Update src/lib/email/config.ts → flip USE_CUSTOM_SMTP_FROM = true.
 */

import { SENDER_FROM, SUPPORT_EMAIL } from './config'

export interface RoleChangeEmailParams {
  to: string
  firstName?: string | null
  oldRole: string
  newRole: string
}

export async function sendRoleChangeEmail(params: RoleChangeEmailParams): Promise<void> {
  // Intentional no-op until Zoho/nodemailer is wired up. See file header.
  void params
  void SENDER_FROM
  void SUPPORT_EMAIL
  return
}
