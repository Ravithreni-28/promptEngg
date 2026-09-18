const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Untitled Prompt',
      trim: true,
    },
    originalPrompt: {
      type: String,
      required: true,
    },
    task: { type: String, default: '' },
    context: { type: String, default: '' },
    desiredOutputFormat: { type: String, default: '' },
    tone: { type: String, default: '' },
    targetAudience: { type: String, default: '' },
    creativityLevel: { type: String, default: 'Balanced' },

    promptScores: {
      clarity: { type: Number, default: 0 },
      specificity: { type: Number, default: 0 },
      context: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
      suggestions: [{ type: String }],
    },

    variations: [
      {
        technique: { type: String, required: true },
        optimizedPrompt: { type: String, required: true },
        why: { type: String },
        expectedUseCase: { type: String },
      },
    ],

    selectedPrompt: { type: String, default: '' },
    technique: { type: String, default: 'Standard' },

    responses: [
      {
        technique: { type: String },
        promptText: { type: String },
        responseText: { type: String },
        model: { type: String },
        scores: {
          relevance: { type: Number, default: 0 },
          completeness: { type: Number, default: 0 },
          clarity: { type: Number, default: 0 },
          structure: { type: Number, default: 0 },
          instructionFollowing: { type: Number, default: 0 },
          overall: { type: Number, default: 0 },
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    responseScores: {
      relevance: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
      instructionFollowing: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },

    recommendedPrompt: {
      technique: { type: String },
      promptText: { type: String },
      promptScore: { type: Number },
      responseScore: { type: Number },
      finalScore: { type: Number },
      rationale: [{ type: String }],
    },

    finalScore: { type: Number, default: 0 },
    favorite: { type: Boolean, default: false, index: true },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      default: null,
      index: true,
    },
    version: { type: Number, default: 1 },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

promptSchema.index({ originalPrompt: 'text', title: 'text', technique: 'text', tags: 'text' });

module.exports = mongoose.model('Prompt', promptSchema);
