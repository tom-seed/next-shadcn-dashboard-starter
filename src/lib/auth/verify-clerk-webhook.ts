import { createHmac, timingSafeEqual } from 'crypto';

const HEADER_ID = 'svix-id';
const HEADER_TIMESTAMP = 'svix-timestamp';
const HEADER_SIGNATURE = 'svix-signature';

export class ClerkWebhookError extends Error {}

function getSecretBuffer() {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    throw new ClerkWebhookError('Missing CLERK_WEBHOOK_SECRET');
  }

  const trimmed = secret.startsWith('whsec_') ? secret.slice(6) : secret;

  try {
    return Buffer.from(trimmed, 'base64');
  } catch (error) {
    throw new ClerkWebhookError('Invalid CLERK_WEBHOOK_SECRET');
  }
}

export function verifyClerkWebhook(
  headers: Headers,
  payload: string
): { id: string; timestamp: string } {
  const id = headers.get(HEADER_ID);
  const timestamp = headers.get(HEADER_TIMESTAMP);
  const signatureHeader = headers.get(HEADER_SIGNATURE);

  if (!id || !timestamp || !signatureHeader) {
    throw new ClerkWebhookError('Missing Svix signature headers');
  }

  const secret = getSecretBuffer();
  const computed = createHmac('sha256', secret)
    .update(`${id}.${timestamp}.${payload}`)
    .digest('base64');

  const segments = signatureHeader
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const signatures: string[] = [];
  let pendingVersion: string | null = null;

  for (const segment of segments) {
    if (segment.includes('=')) {
      const [version, value] = segment.split('=', 2);
      if (version === 'v1' && value) {
        signatures.push(value);
      }
      pendingVersion = null;
      continue;
    }

    if (segment.startsWith('v')) {
      pendingVersion = segment;
      continue;
    }

    if (pendingVersion === 'v1') {
      signatures.push(segment);
      pendingVersion = null;
    }
  }

  if (signatures.length === 0) {
    throw new ClerkWebhookError('No v1 signature in header');
  }

  const expectedBuffer = Buffer.from(computed);

  const isValid = signatures.some((signature) => {
    try {
      const providedBuffer = Buffer.from(signature);
      return (
        providedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(providedBuffer, expectedBuffer)
      );
    } catch {
      return false;
    }
  });

  if (!isValid) {
    throw new ClerkWebhookError('Invalid webhook signature');
  }

  return { id, timestamp };
}
