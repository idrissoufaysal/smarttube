import { NextResponse } from 'next/server';

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

// In-memory store (Note: In a serverless environment like Vercel, this memory is ephemeral 
// and will reset on cold starts or across different edges. For a production-ready solution, 
// consider Vercel KV or Upstash Redis).
const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Checks if the request has exceeded the rate limit.
 * @param req The incoming request
 * @param limit Maximum number of requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns NextResponse with 429 status if rate limited, null otherwise
 */
export function checkRateLimit(
  req: Request,
  limit: number = 20,
  windowMs: number = 60 * 1000
) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return null;
  }

  if (record.count >= limit) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429 }
    );
  }

  record.count += 1;
  return null;
}
