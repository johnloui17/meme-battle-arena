export function buildResetEmail(resetUrl: string): { subject: string; text: string; html: string } {
  const subject = "Reset your Meme Battle Arena entry pass";
  const text = [
    "Someone requested a password reset for your Meme Battle Arena account.",
    "",
    `Reset your password: ${resetUrl}`,
    "",
    "This link expires in 60 minutes. If you didn't request this, you can ignore this email.",
  ].join("\n");
  const html = `
    <p>Someone requested a password reset for your Meme Battle Arena account.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>This link expires in 60 minutes. If you didn't request this, you can ignore this email.</p>
  `.trim();
  return { subject, text, html };
}
