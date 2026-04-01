/**
 * Standard API response helpers
 */
const sendSuccess = (res, data = {}, statusCode = 200) => {
  res.status(statusCode).json({ success: true, ...data });
};

const sendError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ success: false, error: message });
};

/**
 * Compute the age group label from numeric age
 * Matches the RN app's age group buckets in questions.js
 */
const getAgeGroup = (age) => {
  if (age >= 15 && age <= 24) return '15-24';
  if (age >= 25 && age <= 40) return '25-40';
  if (age >= 41 && age <= 60) return '41-60';
  if (age > 60) return '60+';
  return 'all';
};

/**
 * Compute diet penalty score matching the RN app's scoring logic
 */
const getDietPenalty = (dietType) => {
  const penalties = { vegan: 12, vegetarian: 8, pescatarian: 4, omnivore: 0 };
  return penalties[dietType] || 0;
};

/**
 * Throw a formatted HTTP error (caught by errorHandler middleware)
 */
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { sendSuccess, sendError, getAgeGroup, getDietPenalty, createError };
