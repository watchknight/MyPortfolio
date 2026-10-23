/**
 * Safe, cross-browser clipboard copy with fallback to document.execCommand('copy').
 * Handles sandbox restrictions, missing permissions, and non-secure contexts gracefully.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const fallbackCopy = (): boolean => {
    try {
      if (typeof document === 'undefined') return false;
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  };

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }

  return fallbackCopy();
}
