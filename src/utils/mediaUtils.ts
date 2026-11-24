/**
 * Parses common YouTube URL formats (watch?v=, youtu.be/, shorts/, embed/)
 * into a privacy-friendly embed URL. Returns null if not a YouTube link.
 */
export function getYouTubeEmbedUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '');
    let videoId: string | null = null;

    if (host === 'youtu.be') {
      videoId = url.pathname.slice(1).split('/')[0] || null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v');
      } else if (url.pathname.startsWith('/shorts/')) {
        videoId = url.pathname.split('/')[2] || null;
      } else if (url.pathname.startsWith('/embed/')) {
        videoId = url.pathname.split('/')[2] || null;
      }
    }

    if (videoId && /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
    }
  } catch {
    return null;
  }

  return null;
}

export function isDirectVideoUrl(rawUrl?: string): boolean {
  if (!rawUrl) return false;
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(rawUrl.trim());
}

/**
 * Compresses an uploaded image file on an offscreen canvas so it safely fits in localStorage.
 */
export function compressImageFile(
  file: File,
  maxWidth = 900,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Kunde inte läsa bildfilen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Ogiltigt bildformat.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
