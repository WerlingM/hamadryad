import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const BCRYPT_ROUNDS = 12;

export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
}

function getSecret(key: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[key];
  if (!value) throw new Error(`Environment variable ${key} is not set`);
  return value;
}

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export function signAccessToken(
  payload: Omit<AccessTokenPayload, "type">
): string {
  return jwt.sign(
    { ...payload, type: "access" },
    getSecret("JWT_SECRET"),
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"] }
  );
}

export function signRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: "refresh" },
    getSecret("JWT_REFRESH_SECRET"),
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "30d") as jwt.SignOptions["expiresIn"] }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(
    token,
    getSecret("JWT_SECRET")
  ) as AccessTokenPayload;
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(
    token,
    getSecret("JWT_REFRESH_SECRET")
  ) as RefreshTokenPayload;
  if (payload.type !== "refresh") throw new Error("Invalid token type");
  return payload;
}
