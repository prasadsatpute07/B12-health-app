/**
 * Builds Flo-style insight screens between questions (every 3 answers).
 * Explains why the last questions matter using real question + insight copy.
 */

const HERO_ROTATION = [
  { emoji: '✨', tag: 'Momentum' },
  { emoji: '🧠', tag: 'Insight' },
  { emoji: '💚', tag: 'Clarity' },
  { emoji: '🌿', tag: 'Balance' },
  { emoji: '🔬', tag: 'Science' },
  { emoji: '☀️', tag: 'Energy' },
];

export function buildInterstitialContent(blockEnd, questions) {
  const start = blockEnd - 3;
  const slice = questions.slice(start, blockEnd);
  const blockIndex = Math.floor(blockEnd / 3) - 1;
  const hero = HERO_ROTATION[blockIndex % HERO_ROTATION.length];

  return {
    heroEmoji: hero.emoji,
    heroTag: hero.tag,
    blockEnd,
    title: `${blockEnd} questions in`,
    subtitle: 'Here’s why those last three answers matter — and how they sharpen your B12 wellness picture.',
    items: slice.map((q) => ({
      category: q.category,
      questionPreview:
        q.question.length > 76 ? `${q.question.slice(0, 73)}…` : q.question,
      significance:
        q.insight ||
        'This signal helps us weight patterns linked to vitamin B12–related health.',
    })),
    closing:
      'Take a moment if you need it. There’s no timer — continue when you’re ready.',
  };
}
