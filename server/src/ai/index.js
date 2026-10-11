import { env } from '../config/env.js';
import * as stub from './stubProvider.js';

// Every AI call in the app goes through this module. A provider is a module that
// exports the four functions below with the same inputs and outputs as the stub.
// To integrate the real AI: add e.g. ./realProvider.js, register it here, and set
// AI_PROVIDER in server/.env. Nothing outside this folder needs to change.
//
//   suggestTopics({ questions, topics })
//     -> [{ number, topicId | null, confidence 0..1 }]
//   readAnswerSheet({ imagePath, questionCount, optionCount })
//     -> null when the sheet cannot be read, otherwise
//        [{ number, selected: index | null, confidence 0..1 }]
//   explainMistake({ question, selected, topic })
//     -> string shown to the student under a wrong answer
//   summarizeWeakness({ studentName, topics })
//     -> string study plan built from the ranked topic stats
const providers = { stub };

const provider = providers[env.aiProvider];
if (!provider) {
  throw new Error(`Unknown AI_PROVIDER "${env.aiProvider}". Available: ${Object.keys(providers).join(', ')}`);
}

export const { suggestTopics, readAnswerSheet, explainMistake, summarizeWeakness } = provider;
