const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const ALLOWED_DOWNLOAD_PROTOCOLS = new Set(["http:", "https:", "data:", "blob:"]);

export function toSafeHref(value: string | null | undefined, fallback = "#") {
  if (!value) {
    return fallback;
  }

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsed = new URL(value);
    return ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function toSafeDownloadHref(value: string | null | undefined, fallback = "#") {
  if (!value) {
    return fallback;
  }

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsed = new URL(value);
    return ALLOWED_DOWNLOAD_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function getSafeDisplayUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }

    return {
      href: parsed.toString(),
      origin: `${parsed.protocol}//`,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
    };
  } catch {
    return null;
  }
}
