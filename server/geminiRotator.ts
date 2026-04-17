import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

/**
 * farmintel Gemini Key Rotator
 * ─────────────────────────────────────────────────────────────
 * Holds a pool of API keys. On any quota / rate-limit error,
 * it automatically advances to the next key and retries the
 * same request.  All keys are tried before giving up.
 */

const getKeys = (): string[] => {
  const envKeys = process.env.GEMINI_KEYS || "";
  if (envKeys) return envKeys.split(",").map(k => k.trim()).filter(k => k.length > 0);
  
  // Fallback to single key if that's all we have
  const singleKey = process.env.GEMINI_API_KEY || "";
  return singleKey ? [singleKey] : [];
};

const API_KEYS = getKeys();

// Rate-limit error indicators from the Gemini SDK / HTTP layer
const QUOTA_ERRORS = [
  "429",
  "quota",
  "rate limit",
  "resource_exhausted",
  "resource exhausted",
  "too many requests",
  "grpc status code: 8",
];

function isQuotaError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  return QUOTA_ERRORS.some(q => msg.includes(q));
}

class GeminiRotator {
  private currentIndex = 0;
  private exhausted   = false;

  get keyCount()     { return API_KEYS.length; }
  get activeKeyNum() { return this.currentIndex + 1; }      // 1-indexed for logging

  private rotate(): boolean {
    if (this.currentIndex >= API_KEYS.length - 1) {
      this.exhausted = true;
      return false;
    }
    this.currentIndex++;
    console.warn(`[GeminiRotator] Key ${this.currentIndex} exhausted → switching to key ${this.currentIndex + 1}`);
    return true;
  }

  /** Reset to first key (call e.g. once per hour to try cheapest key again) */
  reset() {
    this.currentIndex = 0;
    this.exhausted    = false;
    console.info("[GeminiRotator] Reset to key 1");
  }

  private getModel(modelName = "gemini-flash-latest"): GenerativeModel {
    const ai = new GoogleGenerativeAI(API_KEYS[this.currentIndex]);
    return ai.getGenerativeModel({ model: modelName });
  }

  /**
   * Generate content with automatic key rotation on quota errors.
   * @param parts  Array of prompt strings / parts (same as model.generateContent())
   * @param model  Gemini model name (default: "gemini-flash-latest")
   */
  async generateContent(parts: string[], model = "gemini-flash-latest"): Promise<string> {
    let lastError: unknown;

    // Try every available key, starting from current
    for (let attempt = this.currentIndex; attempt < API_KEYS.length; attempt++) {
      try {
        const m = this.getModel(model);
        const result = await m.generateContent(parts);
        const text   = result.response.text();
        // Success — log which key served the request
        console.info(`[GeminiRotator] ✓ served by key ${this.currentIndex + 1}`);
        return text;
      } catch (err) {
        lastError = err;
        if (isQuotaError(err)) {
          const hasNext = this.rotate();
          if (!hasNext) break;    // all keys exhausted
          // loop continues with new this.currentIndex
        } else {
          // Non-quota error (bad prompt, network etc.) — throw immediately
          throw err;
        }
      }
    }

    // All keys exhausted
    console.error("[GeminiRotator] All API keys are rate-limited or exhausted.");
    throw new Error(`All ${API_KEYS.length} Gemini API keys are currently rate-limited. Please try again later.`);
  }
}

// Export a singleton so all routes share the same key state & rotation position
export const gemini = new GeminiRotator();
