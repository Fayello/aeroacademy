import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

const SALT_ROUNDS = 10;
const ENCRYPTION_KEY =
  process.env.LAB_ENCRYPTION_KEY ||
  'aeroacademy-labs-default-key-change-in-production-32b!';

if (!process.env.LAB_ENCRYPTION_KEY) {
  console.warn(
    '[SECURITY] LAB_ENCRYPTION_KEY not set — using default key. Lab credentials are NOT secure in production!',
  );
}
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim();
}

export async function hashAnswer(answer: string): Promise<string> {
  return bcrypt.hash(normalizeAnswer(answer), SALT_ROUNDS);
}

export async function verifyAnswer(
  answer: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(normalizeAnswer(answer), hash);
}

export function encryptData(plaintext: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_KEY, 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptData(ciphertext: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_KEY, 32);
  const [ivHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function encryptCredentials(credentials: unknown[]): string {
  return encryptData(JSON.stringify(credentials));
}

export function decryptCredentials(encrypted: string): Prisma.JsonValue {
  return JSON.parse(decryptData(encrypted)) as Prisma.JsonValue;
}
