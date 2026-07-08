import mongoose from 'mongoose';

export const ROLES = ['owner', 'admin', 'member'];

// Role hierarchy for permission checks — higher number = more privilege.
export const ROLE_RANK = { member: 1, admin: 2, owner: 3 };

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLES, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
    integrations: {
      slack: {
        connected: { type: Boolean, default: false },
        defaultChannel: { type: String },
      },
      jira: {
        connected: { type: Boolean, default: false },
        projectKey: { type: String },
      },
    },
  },
  { timestamps: true }
);

/** Returns the role of a user in this workspace, or null if not a member. */
workspaceSchema.methods.roleOf = function roleOf(userId) {
  const id = String(userId);
  const member = this.members.find((m) => String(m.user) === id);
  return member ? member.role : null;
};

export const Workspace = mongoose.model('Workspace', workspaceSchema);
