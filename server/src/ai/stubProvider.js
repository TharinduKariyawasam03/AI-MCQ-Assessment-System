// Phase 1 stand-in for the AI. Deterministic, no network calls.

const STOP_WORDS = new Set(['with', 'from', 'that', 'this', 'what', 'which', 'when', 'into', 'will', 'have', 'their', 'there', 'than', 'then', 'they', 'them', 'does', 'were', 'been', 'each', 'such', 'only', 'also', 'more', 'most', 'some', 'between']);

function keywords(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
  );
}

// Picks the topic whose name and theory note share the most words with the question.
export async function suggestTopics({ questions, topics }) {
  const topicWords = topics.map((topic) => ({
    id: topic._id.toString(),
    name: keywords(topic.name),
    theory: keywords(topic.theory),
  }));

  return questions.map((question) => {
    const words = keywords(`${question.text} ${question.options.join(' ')}`);
    let best = null;
    let bestScore = 0;
    for (const topic of topicWords) {
      let score = 0;
      for (const word of words) {
        if (topic.name.has(word)) score += 3;
        else if (topic.theory.has(word)) score += 1;
      }
      if (score > bestScore) {
        best = topic.id;
        bestScore = score;
      }
    }
    return { number: question.number, topicId: best, confidence: Math.min(1, bestScore / 6) };
  });
}

// The stub cannot read images, so the student fills in the bubble grid.
export async function readAnswerSheet() {
  return null;
}

export async function explainMistake({ question, topic }) {
  if (question.explanation) return question.explanation;
  if (topic?.theory) return topic.theory;
  return '';
}

export async function summarizeWeakness({ topics }) {
  const weak = topics.filter((topic) => topic.isWeak).slice(0, 3);
  if (!topics.length) return 'Submit your first answer sheet to see which topics to revise.';
  if (!weak.length) return 'No weak topics so far. Keep practising to stay on track.';
  const names = weak.map((topic) => `${topic.name} (${topic.errorRate}% wrong)`).join(', ');
  return `Revise these first: ${names}. Read the theory note for each, then retry the questions you got wrong.`;
}
