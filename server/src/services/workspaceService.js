import { Workspace } from '../models/Workspace.js';
import { User } from '../models/User.js';

/** Turns a name into a URL-safe, collision-resistant slug. */
function slugify(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace';
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Ensures a user has at least one workspace. Called on first sign-up / OAuth.
 * Returns the user's default workspace.
 */
export async function ensurePersonalWorkspace(user) {
  if (user.defaultWorkspace) {
    const existing = await Workspace.findById(user.defaultWorkspace);
    if (existing) return existing;
  }

  const name = `${user.name.split(' ')[0]}'s Workspace`;
  const workspace = await Workspace.create({
    name,
    slug: slugify(name),
    owner: user._id,
    members: [{ user: user._id, role: 'owner' }],
  });

  user.defaultWorkspace = workspace._id;
  await user.save();
  return workspace;
}

/** Creates a new workspace owned by the given user. */
export async function createWorkspace(user, name) {
  const workspace = await Workspace.create({
    name,
    slug: slugify(name),
    owner: user._id,
    members: [{ user: user._id, role: 'owner' }],
  });
  return workspace;
}

/** Lists workspaces the user is a member of. */
export async function listUserWorkspaces(userId) {
  return Workspace.find({ 'members.user': userId }).sort({ createdAt: 1 });
}

/** Adds (or updates the role of) a member by email. Returns the workspace. */
export async function addMemberByEmail(workspace, email, role) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return { error: 'No user found with that email' };

  const existing = workspace.members.find((m) => String(m.user) === String(user._id));
  if (existing) {
    existing.role = role;
  } else {
    workspace.members.push({ user: user._id, role });
  }
  await workspace.save();
  return { workspace };
}
