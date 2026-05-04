import Order from "../models/order.model.js";
import ServiceBooking from "../models/serviceBooking.model.js";
import Review from "../models/review.model.js";
import User from "../models/user.model.js";

const round2 = (value) => Math.round(value * 100) / 100;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const calculateConsistencyScore = (ratings) => {
  if (!ratings.length) return 0;
  if (ratings.length === 1) return 65;

  const avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  const variance =
    ratings.reduce((sum, value) => sum + (value - avg) ** 2, 0) / ratings.length;
  const stdDev = Math.sqrt(variance);

  // Lower standard deviation means higher consistency.
  const normalized = 100 - stdDev * 30;
  return clamp(round2(normalized), 0, 100);
};

export const recalculateUserReputation = async (userId) => {
  const [reviews, deliveredOrdersCount, completedBookingsCount] = await Promise.all([
    Review.find({ reviewee: userId }).select("rating"),
    Order.countDocuments({ seller: userId, status: "delivered" }),
    ServiceBooking.countDocuments({ provider: userId, status: "completed" }),
  ]);

  const completedTransactions = deliveredOrdersCount + completedBookingsCount;
  const ratings = reviews.map((item) => item.rating);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
      : 0;
  const consistencyScore = calculateConsistencyScore(ratings);

  // Weighted dynamic score:
  // 1) Rating quality (50%), 2) completed transaction volume (25%),
  // 3) performance consistency (25%).
  const ratingComponent = (avgRating / 5) * 50;
  const transactionComponent = clamp(Math.log10(completedTransactions + 1) * 25, 0, 25);
  const consistencyComponent = (consistencyScore / 100) * 25;

  const reputationScore = clamp(
    round2(ratingComponent + transactionComponent + consistencyComponent),
    0,
    100
  );

  await User.findByIdAndUpdate(userId, {
    reputationScore,
    totalCompletedTransactions: completedTransactions,
  });

  return {
    reputationScore,
    totalCompletedTransactions: completedTransactions,
    averageRating: round2(avgRating),
    consistencyScore,
    reviewCount: ratings.length,
  };
};
