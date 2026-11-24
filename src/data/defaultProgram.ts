import type { AppSettings, Exercise, ExerciseCategory, SessionFeeling } from '../types';

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  ben: 'Ben',
  bal: 'Bål',
  rorlighet: 'Rörlighet',
  ovrigt: 'Övrigt',
};

export const FEELING_META: Record<
  SessionFeeling,
  { label: string; shortLabel: string; description: string; colorClass: string }
> = {
  great: {
    label: 'Riktigt bra',
    shortLabel: 'Toppen',
    description: 'Stabilt, starkt och helt utan besvär',
    colorClass: 'feeling-great',
  },
  good: {
    label: 'Kändes okej',
    shortLabel: 'Okej',
    description: 'Bra träning, kändes tryggt och kontrollerat',
    colorClass: 'feeling-good',
  },
  'mild-ache': {
    label: 'Lite känning',
    shortLabel: 'Känning',
    description: 'Lätt trötthet eller mild känning — håll koll',
    colorClass: 'feeling-mild',
  },
  discomfort: {
    label: 'Fick besvär',
    shortLabel: 'Besvär',
    description: 'Hör av dig till Jannis på Fysiohuset om besvären kvarstår',
    colorClass: 'feeling-discomfort',
  },
};

export const JANNIS_PROGRAM_TIPS = {
  clinic: 'Fysiohuset Göteborg',
  physio: 'Jannis',
  frequency: '2–3 ggr/vecka',
  summary:
    '30–60 sekunder/övning med AMRAP (As Many Reps As Possible). Vila 30–60 sekunder. Växla mellan övningar för benen och för bålen — 2 set/ben och 2–3 set totalt för bålen i början.',
  caution: 'Viktigt att det känns okej — hör av dig till fysioterapeuten om du får besvär.',
};

export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'wall-single-leg-squat',
    name: 'Benböj vid vägg (ett ben)',
    shortName: 'Benböj vid vägg',
    category: 'ben',
    description:
      'Vid väggen med två händer som trycker mot väggen. Stå med all vikt på främre foten eller ta lite hjälp av bakre foten i marken. Gör benböj med huvudet nära väggen, sätet bakåt och knät framåt. Tryck dig själv upp hela vägen upp på ett ben.',
    cues: [
      'Två händer trycker aktivt mot väggen',
      'All vikt på främre foten (eller lätt stöd av bakre foten)',
      'Huvudet nära väggen, sätet bakåt och knät framåt',
      'Tryck dig hela vägen upp på ett ben',
    ],
    enabled: true,
    timerMode: 'time',
    durationSeconds: 45,
    reps: 10,
    secondsPerRep: 4,
    sets: 2,
    unilateral: true,
    sideSwapSeconds: 8,
    restSeconds: 45,
    illustrationUrl: './exercises/wall-squat.jpg',
    note: 'AMRAP i 30–60 sek per ben med kontrollerat tempo.',
  },
  {
    id: 'bear-crawl',
    name: 'Krypa på alla fyra',
    shortName: 'Krypa alla fyra',
    category: 'bal',
    description:
      'Krypa på alla fyra framåt, bakåt och i sidled. Långsamt och kontrollerat. Knäna nära marken. Håll ihop magen och svanka inte. Långsamt är jobbigare och ger bättre träning. Motsatt hand och fot som flyttas.',
    cues: [
      'Knäna svävande nära marken hela tiden',
      'Håll ihop magen — svanka inte',
      'Flytta motsatt hand och fot samtidigt',
      'Långsamt och kontrollerat: framåt, bakåt och i sidled',
    ],
    enabled: true,
    timerMode: 'time',
    durationSeconds: 45,
    reps: 12,
    secondsPerRep: 4,
    sets: 2,
    unilateral: false,
    sideSwapSeconds: 8,
    restSeconds: 45,
    illustrationUrl: './exercises/bear-crawl.jpg',
    note: 'Långsamt är jobbigare och ger bättre träning för bålen.',
  },
  {
    id: 'forward-reverse-lunge',
    name: 'Utfallssteg (framåt & bakåt)',
    shortName: 'Utfallssteg',
    category: 'ben',
    description:
      'Gör utfallssteg — testa varianten där du kliver framåt och sedan direkt bakåt med samma fot i en sammanhängande, kontrollerad rörelse.',
    cues: [
      'Kliv framåt och direkt bakåt med samma fot',
      'Håll stabil bål och kontrollerat tempo',
      'Mjuk landning och starkt frånskjut',
    ],
    enabled: true,
    timerMode: 'time',
    durationSeconds: 45,
    reps: 10,
    secondsPerRep: 4,
    sets: 2,
    unilateral: true,
    sideSwapSeconds: 8,
    restSeconds: 45,
    illustrationUrl: './exercises/forward-reverse-lunge.jpg',
    note: 'AMRAP i 30–60 sek per sida. Byt ben vid signalen.',
  },
  {
    id: 'bear-to-crab',
    name: 'Alla fyra → Omvänd position',
    shortName: 'Omvänd växling',
    category: 'bal',
    description:
      'Från alla fyra med knäna nära marken, byt sakta till omvänd position med sätet nära marken och magen uppåt. Håll ihop magen med sakta och kontrollerade förflyttningar.',
    cues: [
      'Starta på alla fyra med knäna nära golvet',
      'Rotera långsamt över till omvänd position (magen uppåt)',
      'Håll sätet nära marken och spänn bålen',
      'Växla tillbaka lika långsamt och kontrollerat',
    ],
    enabled: true,
    timerMode: 'time',
    durationSeconds: 45,
    reps: 8,
    secondsPerRep: 5,
    sets: 1,
    unilateral: false,
    sideSwapSeconds: 8,
    restSeconds: 45,
    illustrationUrl: './exercises/bear-to-crab.jpg',
    note: '1–2 set i början så bålen inte blir överbelastad (2–3 bålset totalt/pass).',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  audioMode: 'voice-and-sound',
  countdownBeeps: true,
  halfwayCue: true,
  prepSeconds: 5,
  interleaveLegCore: true,
  weeklyGoal: 3,
};
