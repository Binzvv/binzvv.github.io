import type { PolicyId } from '../core/policy';

/*
 * Illustrative content for the experiment. These are conceptual examples of
 * how a behavioural policy could change an agent's output. They are not
 * measured research findings.
 */

export const CONSTANTS = {
  person: [
    ['Runner, 34', 'Half marathon in 6 weeks'],
    ['Sleep', '5 h 40 min · second short night'],
    ['Recovery', 'HRV below baseline'],
  ],
  intent: '“I’ve got 40 minutes this evening. What should I do?”',
  intelligence: 'Same model · same data · same capability',
} as const;

export type FactorId = 'goal' | 'consistency' | 'recovery' | 'risk' | 'feel';

export const FACTORS: Record<FactorId, string> = {
  goal: 'Goal progress',
  consistency: 'Consistency',
  recovery: 'Sleep & recovery',
  risk: 'Injury risk',
  feel: 'How it feels',
};

export interface Policy {
  id: PolicyId;
  name: string;
  principle: string;
  decision: string;
  /** Short form, used on the hypothesis scene. */
  short: string;
  priorities: [FactorId, number][];
  action: { title: string; meta: string; follow: string };
  refuses: string;
  explanation: string;
}

export const POLICIES: Record<PolicyId, Policy> = {
  A: {
    id: 'A',
    name: 'Performance',
    principle: 'Progress toward the goal comes first.',
    decision: 'Run the session.',
    short: 'Run the session.',
    priorities: [
      ['goal', 0.94],
      ['consistency', 0.76],
      ['risk', 0.4],
      ['recovery', 0.3],
      ['feel', 0.14],
    ],
    action: { title: 'Intervals · 6 × 800 m', meta: 'Today 18:30 · 38 min', follow: 'Reminder at 18:00' },
    refuses: 'Skipping a key session',
    explanation: 'Six weeks out, a missed key session costs more than one hard evening.',
  },
  B: {
    id: 'B',
    name: 'Recovery',
    principle: 'Protect the body before the plan.',
    decision: 'Don’t run tonight.',
    short: 'Don’t run tonight.',
    priorities: [
      ['recovery', 0.95],
      ['risk', 0.82],
      ['consistency', 0.36],
      ['goal', 0.22],
      ['feel', 0.18],
    ],
    action: { title: 'Mobility · 20 min', meta: 'Wind-down at 22:00', follow: 'Intervals moved to Thursday' },
    refuses: 'The interval session',
    explanation: 'Two short nights in a row. Training on this fatigue raises the risk and blunts the gain.',
  },
  C: {
    id: 'C',
    name: 'Instinct',
    principle: 'Trust the feeling over the numbers.',
    decision: 'Go out. No plan.',
    short: 'Go out. No plan.',
    priorities: [
      ['feel', 0.93],
      ['recovery', 0.55],
      ['consistency', 0.38],
      ['risk', 0.3],
      ['goal', 0.12],
    ],
    action: { title: 'Easy run · river loop', meta: 'Open-ended · pace hidden', follow: 'No targets tonight' },
    refuses: 'Pace and targets',
    explanation: 'You’ve hit every target this month. Tonight, how it feels matters more than the plan.',
  },
};
