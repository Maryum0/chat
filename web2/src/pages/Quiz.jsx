import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Award } from 'lucide-react';
import { recordQuizResult, recordWeakPoint } from '../store/studyStore';
import './Quiz.css';

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const scoreRef = useRef(0); // track score synchronously for the save call

  const parsedData = location.state?.data;
  const fileName = location.state?.fileName || 'Unknown';
  
  const defaultQuestions = [
    {
      questionText: 'What is the powerhouse of the cell?',
      answerOptions: [
        { answerText: 'Nucleus', isCorrect: false },
        { answerText: 'Mitochondria', isCorrect: true },
        { answerText: 'Ribosome', isCorrect: false },
        { answerText: 'Endoplasmic Reticulum', isCorrect: false },
      ],
    },
    {
      questionText: 'Which process converts light energy into chemical energy?',
      answerOptions: [
        { answerText: 'Cellular Respiration', isCorrect: false },
        { answerText: 'Fermentation', isCorrect: false },
        { answerText: 'Photosynthesis', isCorrect: true },
        { answerText: 'Glycolysis', isCorrect: false },
      ],
    },
    {
      questionText: 'What is the primary function of DNA?',
      answerOptions: [
        { answerText: 'Energy storage', isCorrect: false },
        { answerText: 'Protein synthesis', isCorrect: false },
        { answerText: 'Genetic information storage', isCorrect: true },
        { answerText: 'Structural support', isCorrect: false },
      ],
    },
  ];

  const questions = (parsedData && parsedData.length > 0) ? parsedData : defaultQuestions;

  const handleAnswerOptionClick = (isCorrect, index) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    if (isCorrect) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else {
      // Record weak point if the question has an associated term
      if (questions[currentQuestion].term) {
        recordWeakPoint(questions[currentQuestion].term);
      }
    }

    setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        const nextQuestion = currentQuestion + 1;
        if (nextQuestion < questions.length) {
          setCurrentQuestion(nextQuestion);
          setSelectedAnswer(null);
        } else {
          // Quiz complete — save to store
          const xp = recordQuizResult(fileName, scoreRef.current, questions.length);
          setXpEarned(xp);
          setShowScore(true);
        }
        setIsAnimating(false);
      }, 300);
    }, 1000);
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  return (
    <div className="quiz-container animation-fade-in">
      <div className="quiz-card glass-card">
        {showScore ? (
          <div className="score-section">
            <Award className="award-icon" size={64} />
            <h2>Quiz Completed!</h2>
            <p>You scored {score} out of {questions.length}</p>
            <p className="accuracy-text">{Math.round((score / questions.length) * 100)}% Accuracy</p>
            <div className="score-bar-bg">
              <div 
                className="score-bar-fill" 
                style={{ width: `${(score / questions.length) * 100}%` }}
              ></div>
            </div>
            <p className="xp-gain">+ {xpEarned} XP Gained</p>
            <button className="btn btn-primary" onClick={handleFinish}>
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className={`question-section ${isAnimating ? 'fade-out' : 'fade-in'}`}>
            <div className="quiz-header">
              <span className="question-count">
                Question {currentQuestion + 1}<span>/{questions.length}</span>
              </span>
              <div className="progress-bg">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="question-text">
              <h3>{questions[currentQuestion].questionText}</h3>
            </div>
            
            <div className="answer-section">
              {questions[currentQuestion].answerOptions.map((answerOption, index) => {
                let buttonClass = 'answer-btn';
                let Icon = null;
                
                if (selectedAnswer !== null) {
                  if (answerOption.isCorrect) {
                    buttonClass += ' correct';
                    Icon = CheckCircle;
                  } else if (selectedAnswer === index) {
                    buttonClass += ' incorrect';
                    Icon = XCircle;
                  }
                }

                return (
                  <button 
                    key={index}
                    className={buttonClass} 
                    onClick={() => handleAnswerOptionClick(answerOption.isCorrect, index)}
                    disabled={selectedAnswer !== null}
                  >
                    <span className="answer-text">{answerOption.answerText}</span>
                    {Icon && <Icon className="answer-icon" size={20} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
