import mongoose from 'mongoose';

export const MEETING_STATUS = ['uploaded', 'processing', 'completed', 'failed'];

const actionItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    assignee: { type: String, trim: true },
    dueDate: { type: String, trim: true }, // free-form / ISO, extracted from transcript
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['open', 'done'], default: 'open' },
    jira: {
      issueKey: { type: String },
      url: { type: String },
    },
  },
  { timestamps: true }
);

const meetingSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true },
    participants: { type: [String], default: [] },
    meetingDate: { type: Date, default: Date.now },

    // Source media
    source: {
      type: { type: String, enum: ['upload', 'transcript'], default: 'upload' },
      filename: { type: String },
      mimeType: { type: String },
      sizeBytes: { type: Number },
      storageKey: { type: String }, // local path or S3 key
    },

    status: { type: String, enum: MEETING_STATUS, default: 'uploaded', index: true },
    processingError: { type: String },

    // AI outputs
    transcript: { type: String },
    summary: { type: String },
    keyDecisions: { type: [String], default: [] },
    topics: { type: [String], default: [] },
    actionItems: { type: [actionItemSchema], default: [] },

    // Vector-store bookkeeping
    embedded: { type: Boolean, default: false },
    chunkCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

meetingSchema.index({ workspace: 1, createdAt: -1 });
meetingSchema.index({ title: 'text', summary: 'text' });

export const Meeting = mongoose.model('Meeting', meetingSchema);
