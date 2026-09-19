import { jwtVerify, SignJWT } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'campusgrid-secret-key-30219'
);

export async function verifyTokenEdge(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as { id: string; name: string; email: string; role: 'ADMIN' | 'VIEWER' };
  } catch {
    return null;
  }
}

export async function signTokenEdge(payload: { id: string; name: string; email: string; role: 'ADMIN' | 'VIEWER' }) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

