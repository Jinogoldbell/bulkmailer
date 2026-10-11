const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    error: { type: String },
  },
  { _id: false }
);

const mailSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true },
    isHtml: { type: Boolean, default: false },
    recipients: [recipientSchema],
    totalRecipients: { type: Number, required: true },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    // sending -> sent (all ok) | partial (some failed) | failed (none delivered)
    status: { type: String, enum: ['sending', 'sent', 'partial', 'failed'], default: 'sending', index: true },
    error: { type: String },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

mailSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Mail', mailSchema);
