import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const FROM = { email: "clearmyplate@back9.co.nz", name: "ClearMyPlate" }
const BASE_URL = "https://www.clearmyplate.app"

function inviteEmailHtml(inviteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to ClearMyPlate</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F3EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#4A7C6F;border-radius:16px 16px 0 0;padding:32px 40px;">
              <img
                src="${BASE_URL}/images/Clear%20My%20Plate%20Logo%20Horizontal%20Lockup.svg"
                alt="ClearMyPlate"
                width="160"
                style="display:block;height:auto;"
              />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-left:1px solid #DDD9D1;border-right:1px solid #DDD9D1;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1C2B27;line-height:1.3;">
                You've been invited! 🎉
              </h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6B7B77;">
                Someone has added you to their household on ClearMyPlate — so you can view
                their weekly meal plan and grocery list together.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#6B7B77;">
                Click the button below to accept the invite. If you don't have an account yet,
                you'll be prompted to create a free one — it only takes a minute.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="background-color:#4A7C6F;border-radius:100px;padding:14px 32px;">
                    <a
                      href="${inviteUrl}"
                      style="display:inline-block;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;"
                    >
                      Accept invite →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;line-height:1.6;color:#9CA3AF;">
                Or copy this link into your browser:<br />
                <a href="${inviteUrl}" style="color:#4A7C6F;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#EAE8E3;border-radius:0 0 16px 16px;border:1px solid #DDD9D1;border-top:none;padding:24px 40px;" align="center">
              <p style="margin:0 0 8px;font-size:12px;color:#6B7B77;">
                If you weren't expecting this invite, you can safely ignore this email.
              </p>
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                &copy; ${new Date().getFullYear()} ClearMyPlate &mdash; Wellington, New Zealand
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendInviteEmail(toEmail: string, token: string): Promise<void> {
  const inviteUrl = `${BASE_URL}/invite/${token}`
  await sgMail.send({
    to:      toEmail,
    from:    FROM,
    subject: "You've been invited to a household on ClearMyPlate 🎉",
    html:    inviteEmailHtml(inviteUrl),
  })
}
