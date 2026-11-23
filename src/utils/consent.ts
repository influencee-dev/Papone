export interface CookieConsentState {
  necessari: boolean;
  statistici: boolean;
  marketing: boolean;
  sceltaCompletata: boolean;
  updatedAt?: number;
  expiresAt?: number;
  policyVersion?: string;
}

export const CONSENT_STORAGE_KEY = "papone_cookie_consent";
export const CONSENT_COOKIE_NAME = "papone_cookie_consent";
export const CONSENT_POLICY_VERSION = "2026-11-23";
export const CONSENT_DURATION_MS = 180 * 24 * 60 * 60 * 1000; // 6 mesi (180 giorni)
export const CONSENT_DURATION_SECONDS = 180 * 24 * 60 * 60; // 15552000 secondi

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: (...args: unknown[]) => void;
    };
    _fbq?: unknown;
    [key: string]: unknown;
  }
}

export const DEFAULT_CONSENT: CookieConsentState = {
  necessari: true,
  statistici: false,
  marketing: false,
  sceltaCompletata: false,
};

function readConsentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.split("=").slice(1).join("="));
  } catch {
    return null;
  }
}

export function loadStoredConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY) || readConsentCookie();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CookieConsentState;
    if (!parsed || !parsed.sceltaCompletata) return null;
    if (parsed.policyVersion !== CONSENT_POLICY_VERSION) return null;
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }
    return {
      necessari: true,
      statistici: Boolean(parsed.statistici),
      marketing: Boolean(parsed.marketing),
      sceltaCompletata: true,
      updatedAt: parsed.updatedAt,
      expiresAt: parsed.expiresAt,
      policyVersion: parsed.policyVersion,
    };
  } catch {
    return null;
  }
}

export function persistConsentChoice(
  statistici: boolean,
  marketing: boolean
): CookieConsentState {
  const now = Date.now();
  const state: CookieConsentState = {
    necessari: true,
    statistici,
    marketing,
    sceltaCompletata: true,
    updatedAt: now,
    expiresAt: now + CONSENT_DURATION_MS,
    policyVersion: CONSENT_POLICY_VERSION,
  };

  if (typeof window !== "undefined") {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
    const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
      serialized
    )}; max-age=${CONSENT_DURATION_SECONDS}; path=/; SameSite=Lax${secureFlag}`;
  }

  return state;
}

export function updateGoogleConsentMode(consent: CookieConsentState): void {
  if (typeof window === "undefined" || !consent.sceltaCompletata) return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }

  window.gtag("consent", "update", {
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
    analytics_storage: consent.statistici ? "granted" : "denied",
    personalization_storage: consent.marketing ? "granted" : "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  });
}

function injectScriptOnce(id: string, src: string, onLoad?: () => void): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) {
    onLoad?.();
    return;
  }
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  if (onLoad) {
    script.onload = onLoad;
  }
  document.head.appendChild(script);
}

/**
 * Carica gli script di Google Analytics, Google Ads e Meta Pixel
 * ESCLUSIVAMENTE dopo che l'utente ha espresso consenso esplicito alla rispettiva categoria.
 */
export function syncThirdPartyScripts(consent: CookieConsentState): void {
  if (typeof window === "undefined" || !consent.sceltaCompletata) return;

  const gaId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
  const gadsId = (import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined)?.trim();
  const gtmId = (import.meta.env.VITE_GTM_ID as string | undefined)?.trim();
  const metaPixelId = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim();

  // Gestione Google Analytics 4 (categoria: Statistici)
  if (gaId) {
    window[`ga-disable-${gaId}`] = !consent.statistici;
    if (consent.statistici) {
      injectScriptOnce(
        "papone-ga4-script",
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`,
        () => {
          window.gtag?.("js", new Date());
          window.gtag?.("config", gaId, { anonymize_ip: true });
        }
      );
    }
  }

  // Gestione Google Ads (categoria: Marketing)
  if (gadsId) {
    if (consent.marketing) {
      injectScriptOnce(
        "papone-gads-script",
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gadsId)}`,
        () => {
          window.gtag?.("js", new Date());
          window.gtag?.("config", gadsId);
        }
      );
    }
  }

  // Gestione Google Tag Manager (solo se almeno una categoria opzionale è consentita)
  if (gtmId && (consent.statistici || consent.marketing)) {
    if (!document.getElementById("papone-gtm-script")) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      injectScriptOnce(
        "papone-gtm-script",
        `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
      );
    }
  }

  // Gestione Meta Pixel (categoria: Marketing)
  if (metaPixelId) {
    if (consent.marketing) {
      if (!window.fbq) {
        const fbqFn = function (...args: unknown[]) {
          if (fbqFn.callMethod) {
            fbqFn.callMethod(...args);
          } else {
            fbqFn.queue?.push(args);
          }
        } as NonNullable<Window["fbq"]>;
        fbqFn.push = fbqFn;
        fbqFn.loaded = true;
        fbqFn.version = "2.0";
        fbqFn.queue = [];
        window.fbq = fbqFn;
        window._fbq = fbqFn;
      }
      window.fbq("consent", "grant");
      injectScriptOnce(
        "papone-meta-pixel-script",
        "https://connect.facebook.net/en_US/fbevents.js",
        () => {
          if (!window["papone_meta_pixel_initialized"]) {
            window["papone_meta_pixel_initialized"] = true;
            window.fbq?.("init", metaPixelId);
            window.fbq?.("track", "PageView");
          }
        }
      );
    } else if (window.fbq) {
      window.fbq("consent", "revoke");
    }
  }
}
