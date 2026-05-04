import mongoose from "mongoose";

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

const extractObjectId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value.trim();
  if (typeof value.toHexString === "function") return value.toHexString();
  if (value._id) return extractObjectId(value._id);
  if (value.$oid) return extractObjectId(value.$oid);
  return null;
};

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
      edited: {
        type: Boolean,
        default: false,
      },
      deleted: {
        type: Boolean,
        default: false,
      },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true, _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    contextType: {
      type: String,
      enum: ["product", "service", "general"],
      default: "general",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [messageSchema],
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ contextType: 1, product: 1, service: 1 });

conversationSchema.pre("validate", function (next) {
  if (!Array.isArray(this.participants)) {
    this.participants = [];
  }

  const participantIds = this.participants.map(extractObjectId);
  const hasInvalidParticipant = participantIds.some(
    (id) => !id || !objectIdPattern.test(id)
  );

  if (hasInvalidParticipant) {
    return next(new Error("Conversation contains an invalid participant id"));
  }

  const uniqueParticipantIds = [...new Set(participantIds)];
  this.participants = uniqueParticipantIds.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  next();
});

export default mongoose.model("Conversation", conversationSchema);
