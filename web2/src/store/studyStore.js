/**
 * StudyStore: Lightweight localStorage-based state manager.
 * Tracks quiz results, flashcard sessions, uploaded PDFs, XP, and streaks.
 */

const STORE_KEY = 'studybot_data';

const defaultStore = {
  totalXP: 0,
  level: 1,
  quizResults: [],       // [{ date, fileName, score, total, accuracy }]
  flashcardResults: [],  // [{ date, fileName, mastered, total }]
  sessions: [],          // [{ date, fileName, flashcardCount, quizCount }]
  weeklyScores: [],      // [{ day, score }] - last 7 days
  studyDates: [],        // ISO date strings for streak tracking
  learningProfile: {
    interests: {},       // { topic: score }
    weakPoints: [],      // [term]
    userCorrections: {}, // { term: definition }
  },
  globalKnowledge: [],   // [{ fileName, text }]
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...defaultStore, ...JSON.parse(raw) } : { ...defaultStore };
  } catch {
    return { ...defaultStore };
  }
}

function save(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

// --- Public API ---

export function getStore() {
  return load();
}

export function clearStore() {
  localStorage.removeItem(STORE_KEY);
}

/** Called when a PDF is uploaded and analyzed */
export function recordSession(fileName, flashcardCount, quizCount) {
  const store = load();
  const today = new Date().toISOString().split('T')[0];

  store.sessions.unshift({ date: today, fileName, flashcardCount, quizCount });
  // Keep last 20 sessions
  store.sessions = store.sessions.slice(0, 20);

  // Mark today as a study day for streak calculation
  if (!store.studyDates.includes(today)) {
    store.studyDates.push(today);
  }

  save(store);
}

/** Called when a quiz is completed */
export function recordQuizResult(fileName, score, total) {
  const store = load();
  const today = new Date().toISOString().split('T')[0];
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  const xpGained = score * 50;

  store.quizResults.unshift({ date: today, fileName: fileName || 'Unknown', score, total, accuracy });
  store.quizResults = store.quizResults.slice(0, 50);

  // Update total XP
  store.totalXP = (store.totalXP || 0) + xpGained;
  store.level = Math.floor(store.totalXP / 500) + 1;

  // Update study date
  if (!store.studyDates.includes(today)) {
    store.studyDates.push(today);
  }

  // Update this week's daily scores
  updateWeeklyScores(store, today, accuracy);

  save(store);
  return xpGained;
}

/** Called when a flashcard deck is completed */
export function recordFlashcardResult(fileName, mastered, total) {
  const store = load();
  const today = new Date().toISOString().split('T')[0];
  const xpGained = mastered * 20;

  store.flashcardResults.unshift({ date: today, fileName: fileName || 'Unknown', mastered, total });
  store.flashcardResults = store.flashcardResults.slice(0, 50);

  store.totalXP = (store.totalXP || 0) + xpGained;
  store.level = Math.floor(store.totalXP / 500) + 1;

  if (!store.studyDates.includes(today)) {
    store.studyDates.push(today);
  }

  save(store);
  return xpGained;
}

/** Updates user interests based on keywords found in chat questions */
export function updateInterests(keywords) {
  const store = load();
  if (!store.learningProfile) store.learningProfile = { interests: {}, weakPoints: [] };
  
  keywords.forEach(kw => {
    const term = kw.toLowerCase();
    store.learningProfile.interests[term] = (store.learningProfile.interests[term] || 0) + 1;
  });
  
  save(store);
}

/** Records a concept the user struggled with in a quiz */
export function recordWeakPoint(term) {
  const store = load();
  if (!store.learningProfile) store.learningProfile = { interests: {}, weakPoints: [] };
  
  const cleanTerm = term.toLowerCase();
  if (!store.learningProfile.weakPoints.includes(cleanTerm)) {
    store.learningProfile.weakPoints.push(cleanTerm);
    // Keep last 20 weak points
    if (store.learningProfile.weakPoints.length > 20) {
      store.learningProfile.weakPoints.shift();
    }
  }
  
  save(store);
}

/** Records PDF text globally for multi-doc search (last 5 docs) */
export function recordGlobalText(fileName, text) {
  const store = load();
  if (!store.globalKnowledge) store.globalKnowledge = [];
  
  // Remove if already exists (to update)
  store.globalKnowledge = store.globalKnowledge.filter(d => d.fileName !== fileName);
  
  // Add to front
  store.globalKnowledge.unshift({ fileName, text });
  
  // Keep last 5
  store.globalKnowledge = store.globalKnowledge.slice(0, 5);
  
  save(store);
}

/** Saves a user-provided correction for a term */
export function saveCorrection(term, definition) {
  const store = load();
  if (!store.learningProfile.userCorrections) store.learningProfile.userCorrections = {};
  
  store.learningProfile.userCorrections[term.toLowerCase()] = definition;
  save(store);
}

/** Returns the full learning profile */
export function getLearningProfile() {
  const store = load();
  const profile = store.learningProfile || { interests: {}, weakPoints: [], userCorrections: {} };
  return {
    ...profile,
    globalKnowledge: store.globalKnowledge || []
  };
}



function updateWeeklyScores(store, today, score) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[new Date(today).getDay()];

  const existing = store.weeklyScores.find(d => d.name === dayName);
  if (existing) {
    // Average with existing score
    existing.score = Math.round((existing.score + score) / 2);
  } else {
    store.weeklyScores.push({ name: dayName, score });
  }
  // Keep at most one entry per day name (7 days)
  store.weeklyScores = store.weeklyScores.slice(-7);
}

/** Compute current study streak in days */
export function getStreak(studyDates) {
  if (!studyDates || studyDates.length === 0) return 0;
  const sorted = [...new Set(studyDates)].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let current = new Date(today);

  for (const dateStr of sorted) {
    const d = new Date(dateStr);
    const diff = Math.round((current - d) / (1000 * 60 * 60 * 24));
    if (diff <= 1) {
      streak++;
      current = d;
    } else {
      break;
    }
  }
  return streak;
}

/** Compute overall accuracy across all quiz results */
export function getOverallAccuracy(quizResults) {
  if (!quizResults || quizResults.length === 0) return 0;
  const avg = quizResults.reduce((sum, r) => sum + r.accuracy, 0) / quizResults.length;
  return Math.round(avg);
}

/** Total cards mastered from all flashcard sessions */
export function getTotalMastered(flashcardResults) {
  if (!flashcardResults || flashcardResults.length === 0) return 0;
  return flashcardResults.reduce((sum, r) => sum + r.mastered, 0);
}

/** XP needed for next level */
export function getXPForLevel(level) {
  return level * 500;
}
