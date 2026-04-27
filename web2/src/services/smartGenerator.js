/**
 * Smart local study content generator.
 * OVERHAULED: Uses a scoring and ranking engine for high-fidelity extraction.
 * ENHANCED: Context-aware adaptation, multi-doc search, and user correction overrides.
 */

// --- Constants & Config ---

const EMPHASIS_KEYWORDS = [
  'important', 'crucial', 'essential', 'fundamental', 'key', 'notable', 'significant',
  'clearly', 'evidently', 'remember', 'must', 'primary', 'major', 'result', 'conclude',
  'therefore', 'consequently', 'however', 'moreover', 'furthermore', 'summary'
];

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'and','but','or','nor','so','yet','for','in','on','at','to','of','by',
  'with','from','into','about','what','which','who','how','when','where','why',
  'this','that','these','those', 'it','its','i','we','you','he','she','they',
  'me','him','her','us','them','my','your','his','our','their','can','not','also'
]);

// --- Core Engine Helpers ---

function smartTokenize(text) {
  if (!text) return [];
  const clean = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
  return clean
    .split(/(?<=[.?!])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 25 && s.length < 500);
}

function scoreSentence(sentence, profile = null) {
  let score = 0;
  const low = sentence.toLowerCase();
  
  for (const kw of EMPHASIS_KEYWORDS) if (low.includes(kw)) score += 3;
  const words = sentence.split(/\W+/).filter(w => w.length > 2);
  for (let i = 1; i < words.length; i++) if (/[A-Z]/.test(words[i][0])) score += 2;
  if (sentence.length > 60 && sentence.length < 160) score += 2;
  if (/\d+%|\d+ |first|second|third/.test(low)) score += 2;

  if (profile) {
    const interests = Object.keys(profile.interests || {});
    interests.forEach(topic => { if (low.includes(topic)) score += 5; });
    const weakPoints = profile.weakPoints || [];
    weakPoints.forEach(term => { if (low.includes(term)) score += 10; });
  }
  return score;
}

// --- Intelligence Upgrades ---

/**
 * Resolves pronouns in a question based on previous context.
 * Example: "What is the Mitochondria?" -> "Tell me more about it" (it = Mitochondria)
 */
function resolveContext(question, history = []) {
  const pronouns = [' it ', ' that ', ' this ', ' they ', ' its '];
  const needsContext = pronouns.some(p => ` ${question.toLowerCase()} `.includes(p)) || question.split(' ').length < 4;

  if (needsContext && history.length > 0) {
    // Look back at previous bot and user messages to find a subject
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      // Heuristic: The last capitalized word or quoted word in a previous message is often the subject
      const matches = msg.text.match(/[A-Z][a-z]{3,}/g);
      if (matches && matches.length > 0) {
        return `${question} (regarding ${matches[matches.length - 1]})`;
      }
    }
  }
  return question;
}

// --- Public API Modules ---

export function extractDefinitions(rawText, profile = null) {
  const sentences = smartTokenize(rawText);
  const results = [];
  const linkers = [' is ', ' are ', ' refers to ', ' means ', ' known as ', ' is defined as '];
  const corrections = profile?.userCorrections || {};

  for (const sentence of sentences) {
    for (const link of linkers) {
      const parts = sentence.split(new RegExp(link, 'i'));
      if (parts.length >= 2) {
        let termCandidate = parts[0].trim().split(' ').slice(-4).join(' ');
        const cleanTerm = termCandidate.replace(/^(the|a|an|finally|remember|note|etc)\s+/i, '').replace(/^[,.:;!]\s*/, '').trim();
        const definition = parts.slice(1).join(link).trim();

        if (cleanTerm.length > 2 && cleanTerm.length < 50) {
          // CHECK FOR CORRECTION OVERRIDE
          const termKey = cleanTerm.toLowerCase();
          const finalDef = corrections[termKey] || definition;

          results.push({
            term: cleanTerm.charAt(0).toUpperCase() + cleanTerm.slice(1),
            definition: finalDef,
            full: sentence,
            score: scoreSentence(sentence, profile) + (corrections[termKey] ? 20 : 5)
          });
          break;
        }
      }
    }
  }

  const seen = new Set();
  return results.filter(d => {
    const k = d.term.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a,b) => b.score - a.score).slice(0, 40);
}

export function answerQuestion(question, mainPdfText, profile = null, history = []) {
  const resolvedQuestion = resolveContext(question, history);
  
  // Collect all text from current PDF + Global Knowledge
  let totalContext = [{ name: 'Current', text: mainPdfText }];
  if (profile?.globalKnowledge) {
    totalContext = [...totalContext, ...profile.globalKnowledge];
  }

  const qLow = resolvedQuestion.toLowerCase();
  // Check for direct definition if question is "What is [X]?"
  if (qLow.startsWith('what is ') || qLow.startsWith('define ')) {
    const term = qLow.replace(/what is |define |the |a /g, '').trim();
    if (profile?.userCorrections?.[term]) {
      return `Confidence Level: High (User-Trained)\n\n${profile.userCorrections[term]}`;
    }
  }

  const qWords = resolvedQuestion.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
  if (qWords.length === 0) return "I need more specific keywords to search the document hub.";

  let bestMatches = [];
  for (const doc of totalContext) {
    const sents = smartTokenize(doc.text);
    const scored = sents.map(s => {
      const sLow = s.toLowerCase();
      let score = 0;
      qWords.forEach(kw => {
        if (sLow.includes(kw)) score += 5;
        else if (kw.length > 5 && sLow.includes(kw.slice(0, -2))) score += 2;
      });
      return { s, score, doc: doc.name };
    });
    bestMatches = [...bestMatches, ...scored.filter(x => x.score > 0)];
  }

  const top = bestMatches.sort((a,b) => b.score - a.score).slice(0, 3);
  if (!top.length) return "I couldn't find a clear answer in my cross-document knowledge base.";

  const sourceFiles = [...new Set(top.map(t => t.doc))].filter(d => d !== 'Current');
  let response = Array.from(new Set(top.map(t => t.s))).join(' ');
  
  if (sourceFiles.length > 0) {
    response += `\n\n(Information cross-referenced from: ${sourceFiles.join(', ')})`;
  }

  return response;
}

export function generateSummary(rawText, profile = null) {
  const rawLines = rawText.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 1);
  let sections = [];
  let currentSection = { title: 'General Overview', text: '' };

  for (const line of rawLines) {
    const isHeading = (/^\d+(\.\d+)*\s+[A-Z]/.test(line) || (line.length < 60 && !/[.?!]$/.test(line) && line === line.toUpperCase()) || (line.length < 50 && !/[.?!]$/.test(line) && line.split(' ').length < 8 && /^[A-Z]/.test(line)));
    if (isHeading) {
      if (currentSection.text.length > 100) sections.push(currentSection);
      currentSection = { title: line, text: '' };
    } else currentSection.text += ' ' + line;
  }
  sections.push(currentSection);

  return sections.map(sec => {
    const sents = smartTokenize(sec.text);
    const scoredSents = sents.map(s => ({ s, score: scoreSentence(s, profile) })).sort((a,b) => b.score - a.score).slice(0, 5).map(x => x.s);
    return { title: sec.title, points: scoredSents.length > 0 ? scoredSents : [sec.text.slice(0, 200) + '...'] };
  });
}

export function generateFlashcards(rawText, profile = null) {
  const defs = extractDefinitions(rawText, profile);
  const flashcards = defs.map(d => ({ front: d.term, back: d.definition, status: 'unseen' }));
  
  if (flashcards.length < 25) {
    const scored = smartTokenize(rawText).map(s => ({ s, score: scoreSentence(s, profile) })).sort((a,b) => b.score - a.score);
    for (const item of scored) {
      if (flashcards.length >= 30) break;
      if (!defs.some(d => item.s.includes(d.term))) flashcards.push({ front: "Concept / Note", back: item.s, status: 'unseen' });
    }
  }
  return flashcards;
}

export function generateQuiz(rawText, profile = null) {
  const defs = extractDefinitions(rawText, profile);
  if (defs.length < 3) return generateFallbackQuiz(rawText, profile);

  return defs.slice(0, 20).map((d, i) => {
    const otherDefs = defs.filter((_, idx) => idx !== i);
    const distractors = otherDefs.sort(() => 0.5 - Math.random()).slice(0, 3);
    const type = i % 2;
    if (type === 0) return { term: d.term, questionText: `What is the definition of "${d.term}"?`, answerOptions: [{ answerText: d.definition, isCorrect: true }, ...distractors.map(dist => ({ answerText: dist.definition, isCorrect: false }))].sort(() => 0.5 - Math.random()) };
    else return { term: d.term, questionText: `Which concept is described here: "${d.definition.slice(0, 150)}..."?`, answerOptions: [{ answerText: d.term, isCorrect: true }, ...distractors.map(dist => ({ answerText: dist.term, isCorrect: false }))].sort(() => 0.5 - Math.random()) };
  });
}

function generateFallbackQuiz(rawText, profile = null) {
  const sents = smartTokenize(rawText).map(s => ({ s, score: scoreSentence(s, profile) })).sort((a,b) => b.score - a.score).slice(0, 15);
  return sents.map(item => {
    const words = item.s.split(' ').filter(w => w.length > 6);
    const target = words[0] || "Answer";
    return { questionText: `Complete the key point: "${item.s.replace(target, '_______')}"`, answerOptions: [{ answerText: target, isCorrect: true }, { answerText: "None of the above", isCorrect: false }, { answerText: "Not in document", isCorrect: false }, { answerText: "Irrelevant", isCorrect: false }].sort(() => 0.5 - Math.random()) };
  });
}
