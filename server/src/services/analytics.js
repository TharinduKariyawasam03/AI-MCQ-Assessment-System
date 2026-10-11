const MIN_ANSWERS = 3;
const WEAK_ERROR_RATE = 0.4;

const round1 = (n) => Math.round(n * 10) / 10;

export function average(numbers) {
  if (!numbers.length) return 0;
  return round1(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
}

// topicId -> { name, theory, className } for every topic of the given classes
export function buildTopicMap(classes) {
  const map = new Map();
  for (const cls of classes) {
    for (const topic of cls.topics) {
      map.set(topic._id.toString(), { name: topic.name, theory: topic.theory, className: cls.name });
    }
  }
  return map;
}

// Ranks topics by error rate for ONE student. Recent papers weigh more: the oldest
// submission counts 0.5, the newest 1.0. Blank answers count as wrong.
export function studentTopicStats(submissions, topicMap) {
  const ordered = [...submissions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const stats = new Map();

  ordered.forEach((submission, index) => {
    const weight = ordered.length > 1 ? 0.5 + 0.5 * (index / (ordered.length - 1)) : 1;
    for (const answer of submission.answers) {
      const id = answer.topicId?.toString();
      if (!id || !topicMap.has(id)) continue;
      const entry = stats.get(id) || { attempted: 0, wrong: 0, weightedTotal: 0, weightedWrong: 0 };
      entry.attempted += 1;
      entry.weightedTotal += weight;
      if (!answer.isCorrect) {
        entry.wrong += 1;
        entry.weightedWrong += weight;
      }
      stats.set(id, entry);
    }
  });

  return [...stats.entries()]
    .map(([topicId, s]) => {
      const errorRate = s.weightedWrong / s.weightedTotal;
      return {
        topicId,
        ...topicMap.get(topicId),
        attempted: s.attempted,
        wrong: s.wrong,
        errorRate: Math.round(errorRate * 100),
        isWeak: s.attempted >= MIN_ANSWERS && errorRate >= WEAK_ERROR_RATE,
      };
    })
    .sort((a, b) => b.errorRate - a.errorRate || b.attempted - a.attempted);
}

// Unweighted accuracy per topic across many students' submissions.
export function groupTopicAccuracy(submissions, topicMap) {
  const stats = new Map();
  for (const submission of submissions) {
    for (const answer of submission.answers) {
      const id = answer.topicId?.toString();
      if (!id || !topicMap.has(id)) continue;
      const entry = stats.get(id) || { attempted: 0, correct: 0 };
      entry.attempted += 1;
      if (answer.isCorrect) entry.correct += 1;
      stats.set(id, entry);
    }
  }

  return [...stats.entries()]
    .map(([topicId, s]) => ({
      topicId,
      name: topicMap.get(topicId).name,
      attempted: s.attempted,
      accuracy: Math.round((s.correct / s.attempted) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function questionStats(paper, submissions) {
  return paper.questions.map((question, index) => {
    const optionCounts = Array(paper.optionCount).fill(0);
    let correct = 0;
    let blank = 0;
    for (const submission of submissions) {
      const answer = submission.answers[index];
      if (!answer || answer.selected === null) blank += 1;
      else optionCounts[answer.selected] += 1;
      if (answer?.isCorrect) correct += 1;
    }
    return {
      number: question.number,
      text: question.text,
      correctOption: question.correctOption,
      optionCounts,
      blank,
      accuracy: submissions.length ? Math.round((correct / submissions.length) * 100) : 0,
    };
  });
}
