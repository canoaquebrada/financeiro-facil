const rateLimitMap = new Map();

const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, data] of rateLimitMap.entries()) {
    if (now - data.windowStart > data.windowMs) {
      rateLimitMap.delete(key);
    }
  }
}

export function rateLimit({ windowMs = 60 * 1000, max = 5 } = {}) {
  return (identifier) => {
    cleanup();

    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    const data = rateLimitMap.get(key);

    if (!data || now - data.windowStart > windowMs) {
      rateLimitMap.set(key, { windowStart: now, count: 1, windowMs });
      return { success: true, remaining: max - 1 };
    }

    if (data.count >= max) {
      return { success: false, remaining: 0, resetMs: windowMs - (now - data.windowStart) };
    }

    data.count++;
    return { success: true, remaining: max - data.count };
  };
}

export const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
export const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 3 });
