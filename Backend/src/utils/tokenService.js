import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from '../config/redis.js';

const ACCESS_TOKEN_TTL = 15 * 60; // 15m seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7d seconds

const redis = getRedisClient();

export const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = async (userId) => {
  const tokenId = uuidv4();
  const jti = `rt:${userId}:${tokenId}`;
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const refreshToken = jwt.sign({ sub: userId, jti }, refreshSecret, { expiresIn: '7d' });

  await redis.set(jti, 'valid', 'EX', REFRESH_TOKEN_TTL);
  return { refreshToken, jti };
};

export const rotateRefreshToken = async (oldJti, userId) => {
  // Invalidate old token
  if (oldJti) {
    await redis.del(oldJti);
  }
  return generateRefreshToken(userId);
};

export const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

export const verifyRefreshToken = async (token) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const decoded = jwt.verify(token, refreshSecret);
  // If Redis is disabled, skip jti lookup and accept token signature only
  if (redis && redis.__disabled) return decoded;
  const status = await redis.get(decoded.jti);
  if (status !== 'valid') {
    throw new Error('Invalid refresh token');
  }
  return decoded;
};

export const revokeAllRefreshTokensForUser = async (userId) => {
  // Pattern delete for all refresh tokens of user
  const pattern = `rt:${userId}:*`;
  const stream = redis.scanStream({ match: pattern, count: 100 });
  const keys = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (resultKeys) => keys.push(...resultKeys));
    stream.on('end', async () => {
      if (keys.length) await redis.del(keys);
      resolve(keys.length);
    });
    stream.on('error', reject);
  });
};

export default {
  signAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeAllRefreshTokensForUser
};


