const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    icon: {
      type: String,
      default: 'Folder',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Collection', collectionSchema);
