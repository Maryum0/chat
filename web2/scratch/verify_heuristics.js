import { generateQuiz, generateFlashcards, generateSummary } from '../src/services/smartGenerator.js';

const sampleText = `
Biology is the natural science that studies life and living organisms.
Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy.
The Mitochondrion is often referred to as the powerhouse of the cell.
Cellular Respiration is the set of metabolic reactions and processes that take place in the cells of organisms to convert biochemical energy from nutrients into ATP.

Important Note: The nucleus contains the majority of the cell's genetic material.
Remember: ATP is the primary energy currency of the cell.
Finally, evolution is the change in the heritable characteristics of biological populations over successive generations.
It is crucial to understand that homeostasis is the state of steady internal, physical, and chemical conditions maintained by living systems.
`;

console.log("--- QUIZ ---");
const quiz = generateQuiz(sampleText);
console.log(JSON.stringify(quiz.slice(0, 2), null, 2));

console.log("\n--- FLASHCARDS ---");
const flashcards = generateFlashcards(sampleText);
console.log(JSON.stringify(flashcards.slice(0, 3), null, 2));

console.log("\n--- SUMMARY ---");
const summary = generateSummary(sampleText);
console.log(JSON.stringify(summary, null, 2));
