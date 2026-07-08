import { ROLE_RANK } from '../src/models/Workspace.js';
import { requireRole } from '../src/middleware/workspaceAccess.js';

describe('RBAC role hierarchy', () => {
  test('owner > admin > member', () => {
    expect(ROLE_RANK.owner).toBeGreaterThan(ROLE_RANK.admin);
    expect(ROLE_RANK.admin).toBeGreaterThan(ROLE_RANK.member);
  });
});

describe('requireRole middleware', () => {
  const run = (userRole, minRole) => {
    const req = { workspaceRole: userRole };
    let error = null;
    requireRole(minRole)(req, {}, (err) => {
      error = err || null;
    });
    return error;
  };

  test('allows equal role', () => {
    expect(run('admin', 'admin')).toBeNull();
  });

  test('allows higher role', () => {
    expect(run('owner', 'member')).toBeNull();
  });

  test('rejects lower role with 403', () => {
    const err = run('member', 'admin');
    expect(err).not.toBeNull();
    expect(err.statusCode).toBe(403);
  });

  test('rejects unknown role', () => {
    const err = run(undefined, 'member');
    expect(err).not.toBeNull();
    expect(err.statusCode).toBe(403);
  });
});
