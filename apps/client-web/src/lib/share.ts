export interface ShareContent {
  title?: string;
  text?: string;
  url: string;
}

/**
 * Share a link using the Web Share API when available, falling back to copying
 * the link to the clipboard. Returns the channel used so callers can give
 * feedback. A user-cancelled native share resolves as 'cancelled'.
 */
export async function shareLink(content: ShareContent): Promise<'shared' | 'copied' | 'cancelled'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(content);
      return 'shared';
    } catch (e) {
      // The user dismissed the native share sheet — do not fall back.
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // Otherwise fall through to the clipboard path below.
    }
  }
  const payload = content.text ? `${content.text}\n${content.url}` : content.url;
  await navigator.clipboard.writeText(payload);
  return 'copied';
}
