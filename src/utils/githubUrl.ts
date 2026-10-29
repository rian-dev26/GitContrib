/**
 * Utility untuk memvalidasi dan mem-parse URL repository GitHub publik.
 */

export interface GitHubUrlValidationResult {
  isValid: boolean;
  error?: string;
  owner?: string;
  repo?: string;
  cleanUrl?: string;
  normalizedUrl?: string;
}

export function validateGitHubRepoUrl(rawUrl: string): GitHubUrlValidationResult {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'URL repository GitHub wajib diisi.',
    };
  }

  // Normalisasi jika tanpa protokol
  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return {
      isValid: false,
      error: 'Format URL tidak valid. Gunakan format yang benar seperti https://github.com/owner/repository.',
    };
  }

  // Hostname harus github.com
  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== 'github.com' && hostname !== 'www.github.com') {
    return {
      isValid: false,
      error: 'URL bukan dari GitHub. GitContrib saat ini hanya mendukung repository GitHub publik.',
    };
  }

  // Pathname harus memiliki format /owner/repo atau /owner/repo/ atau /owner/repo.git
  const pathParts = parsed.pathname
    .split('/')
    .filter(Boolean)
    .map((p) => p.replace(/\.git$/i, ''));

  if (pathParts.length < 2) {
    return {
      isValid: false,
      error: 'URL harus menyertakan nama pemilik (owner) dan nama repository. Contoh: https://github.com/owner/repository.',
    };
  }

  const [owner, repo] = pathParts;

  // Validasi karakter nama owner dan repo GitHub
  const githubNamePattern = /^[a-zA-Z0-9_.-]+$/;
  if (!githubNamePattern.test(owner) || !githubNamePattern.test(repo)) {
    return {
      isValid: false,
      error: 'Nama pemilik atau repository mengandung karakter yang tidak valid.',
    };
  }

  const cleanUrl = `https://github.com/${owner}/${repo}`;

  return {
    isValid: true,
    owner,
    repo,
    cleanUrl,
    normalizedUrl: cleanUrl,
  };
}
