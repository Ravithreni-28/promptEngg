const mongoose = require('mongoose');

const promptVersionSchema = new mongoose.Schema(
  {
    promptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prompt',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    promptText: {
      type: String,
      required: true,
    },
    technique: {
      type: String,
      default: 'Standard',
    },
    promptScores: {
      type: Object,
      default: {},
    },
    changeSummary: {
      type: String,
      default: 'Prompt updated',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PromptVersion', promptVersionSchema);
