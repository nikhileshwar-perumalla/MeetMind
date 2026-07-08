import { signToken, verifyToken } from '../src/utils/token.js';

describe('JWT tokens', () => {
  const user = { _id: '507f1f77bcf86cd799439011', email: 'a@b.com', name: 'Ada' };

  test('round-trips sign → verify', () => {
    const token = signToken(user);
    const payload = verifyToken(token);
    expect(payload.sub).toBe(user._id);
    expect(payload.email).toBe(user.email);
    expect(payload.name).toBe(user.name);
  });

  test('rejects tampered tokens', () => {
    const token = signToken(user);
    const tampered = token.slice(0, -2) + 'xx';
    expect(() => verifyToken(tampered)).toThrow();
  });

  test('rejects garbage input', () => {
    expect(() => verifyToken('not-a-jwt')).toThrow();
  });
});
