import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  name?: string;
}

export function signToken(payload: JWTPayload): string {
  // JWT_EXPIRES_IN comes from env as a plain string ("7d"), which does not
  // narrow to jsonwebtoken's StringValue template type on its own.
  const options = { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions;
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string | null): JWTPayload | null {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

