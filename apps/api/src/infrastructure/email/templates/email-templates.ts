export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const escapeHtml = (s: string): string =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:#ffffff;border-radius:8px;padding:32px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#6b7280;text-align:center;">
        Back2u &mdash; reuniting people with their lost belongings.
      </p>
    </div>
  </body>
</html>`;
}

const p = (text: string): string =>
  `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#374151;">${escapeHtml(text)}</p>`;

const button = (url: string, label: string): string =>
  `<p style="margin:24px 0;"><a href="${escapeHtml(url)}" style="background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;display:inline-block;">${escapeHtml(label)}</a></p>`;

export function welcomeEmail(name: string): EmailTemplate {
  const subject = 'Welcome to Back2u';
  const text = `Hi ${name}, welcome to Back2u! Report lost items, list found ones, and help reunite people with their belongings.`;
  return {
    subject,
    text,
    html: layout(subject, p(`Hi ${name},`) + p('Welcome to Back2u! Report lost items, list found ones, and help reunite people with their belongings.')),
  };
}

export function matchAlertEmail(name: string, itemTitle: string, matchUrl: string): EmailTemplate {
  const subject = `Possible match for "${itemTitle}"`;
  const text = `Hi ${name}, we found a possible match for "${itemTitle}". Review it here: ${matchUrl}`;
  return {
    subject,
    text,
    html: layout(subject, p(`Hi ${name},`) + p(`We found a possible match for "${itemTitle}".`) + button(matchUrl, 'Review match')),
  };
}

export function chatNotificationEmail(name: string, threadUrl: string): EmailTemplate {
  const subject = 'New message on Back2u';
  const text = `Hi ${name}, you have a new message. Open the conversation: ${threadUrl}`;
  return {
    subject,
    text,
    html: layout(subject, p(`Hi ${name},`) + p('You have a new message waiting for you.') + button(threadUrl, 'Open conversation')),
  };
}

export function passwordResetEmail(name: string, resetUrl: string): EmailTemplate {
  const subject = 'Reset your Back2u password';
  const text = `Hi ${name}, use this link to reset your password: ${resetUrl} — if you did not request this, ignore this email.`;
  return {
    subject,
    text,
    html: layout(
      subject,
      p(`Hi ${name},`) + p('Use the button below to reset your password. If you did not request this, you can ignore this email.') + button(resetUrl, 'Reset password'),
    ),
  };
}

export function tagScanContactEmail(ownerName: string, finderMessage: string, replyUrl: string): EmailTemplate {
  const subject = 'Someone scanned your Back2u tag';
  const text = `Hi ${ownerName}, someone scanned your tag and says: "${finderMessage}". Reply here: ${replyUrl}`;
  return {
    subject,
    text,
    html: layout(
      subject,
      p(`Hi ${ownerName},`) + p('Someone scanned your Back2u tag and left you a message:') + p(`"${finderMessage}"`) + button(replyUrl, 'Reply'),
    ),
  };
}

export function expiryReminderEmail(name: string, itemTitle: string, itemUrl: string): EmailTemplate {
  const subject = `Your listing "${itemTitle}" expires soon`;
  const text = `Hi ${name}, your listing "${itemTitle}" expires in 3 days. Renew it here: ${itemUrl}`;
  return {
    subject,
    text,
    html: layout(
      subject,
      p(`Hi ${name},`) + p(`Your listing "${itemTitle}" expires in 3 days. Renew it to keep it visible.`) + button(itemUrl, 'View listing'),
    ),
  };
}

export function urgentExpiryReminderEmail(name: string, itemTitle: string, itemUrl: string): EmailTemplate {
  const subject = `Final notice: "${itemTitle}" expires tomorrow`;
  const text = `Hi ${name}, your listing "${itemTitle}" expires tomorrow. Renew it now: ${itemUrl}`;
  return {
    subject,
    text,
    html: layout(
      subject,
      p(`Hi ${name},`) + p(`Your listing "${itemTitle}" expires tomorrow. This is your final reminder — renew it now to keep it visible.`) + button(itemUrl, 'Renew now'),
    ),
  };
}

export function genericEmail(name: string, subject: string, body: string): EmailTemplate {
  const text = `Hi ${name}, ${body}`;
  return {
    subject,
    text,
    html: layout(subject, p(`Hi ${name},`) + p(body)),
  };
}
