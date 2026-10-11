// Marks are always computed here from the stored answer key, never taken from the client or the AI.
export function gradeAnswers(paper, selections) {
  const answers = paper.questions.map((question, index) => {
    const raw = selections?.[index];
    const selected = Number.isInteger(raw) && raw >= 0 && raw < paper.optionCount ? raw : null;
    return {
      number: question.number,
      selected,
      isCorrect: selected !== null && selected === question.correctOption,
      topicId: question.topicId,
    };
  });

  const total = answers.length;
  const score = answers.filter((a) => a.isCorrect).length;
  const percentage = total ? Math.round((score / total) * 1000) / 10 : 0;

  return { answers, score, total, percentage };
}
