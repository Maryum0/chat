import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RefreshCw, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { recordFlashcardResult } from '../store/studyStore';
import './Flashcards.css';

export default function Flashcards() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const parsedData = location.state?.data;
  const fileName = location.state?.fileName || 'Unknown';
  
  const defaultCards = [
    { front: 'Mitochondria', back: 'The powerhouse of the cell, where cellular respiration occurs.', status: 'unseen' },
    { front: 'Photosynthesis', back: 'Process by which plants convert light energy into chemical energy.', status: 'unseen' },
    { front: 'Ribosome', back: 'The cellular machinery responsible for making proteins.', status: 'unseen' },
    { front: 'DNA', back: 'Deoxyribonucleic acid, the molecule that carries genetic information.', status: 'unseen' },
  ];
  
  const [cards, setCards] = useState((parsedData && parsedData.length > 0) ? parsedData : defaultCards);

  const [finished, setFinished] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleStatus = (status) => {
    const updatedCards = [...cards];
    updatedCards[currentIndex].status = status;
    setCards(updatedCards);

    setIsFlipped(false);
    
    // Give time for flip back animation before changing card
    setTimeout(() => {
      const nextUnseen = updatedCards.findIndex((c, idx) => idx > currentIndex && c.status === 'unseen');
      
      if (nextUnseen !== -1) {
        setCurrentIndex(nextUnseen);
      } else {
        const anyUnseen = updatedCards.findIndex(c => c.status === 'unseen');
        if (anyUnseen !== -1) {
          setCurrentIndex(anyUnseen);
        } else {
          // Deck finished — save to store
          const mastered = updatedCards.filter(c => c.status === 'got_it').length;
          recordFlashcardResult(fileName, mastered, updatedCards.length);
          setFinished(true);
        }
      }
    }, 300);
  };

  const stats = {
    gotIt: cards.filter(c => c.status === 'got_it').length,
    review: cards.filter(c => c.status === 'review').length,
    unseen: cards.filter(c => c.status === 'unseen').length,
    total: cards.length
  };

  if (finished) {
    return (
      <div className="flashcards-container animation-fade-in">
        <div className="flashcards-summary glass-card">
          <h2>Deck Finished!</h2>
          <div className="stats-grid">
            <div className="stat-box success">
              <span className="stat-number">{stats.gotIt}</span>
              <span className="stat-label">Mastered</span>
            </div>
            <div className="stat-box warning">
              <span className="stat-number">{stats.review}</span>
              <span className="stat-label">Needs Review</span>
            </div>
          </div>
          <div className="summary-actions">
            <button className="btn btn-outline" onClick={() => {
              setCards(cards.map(c => ({...c, status: c.status === 'review' ? 'unseen' : c.status})));
              setCurrentIndex(cards.findIndex(c => c.status === 'review') >= 0 ? cards.findIndex(c => c.status === 'review') : 0);
              setFinished(false);
            }}>
              Review Weak Cards
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards-container animation-fade-in">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Back
      </button>
      
      <div className="flashcard-header">
        <span className="card-counter">Card {currentIndex + 1} of {cards.length}</span>
        <div className="progress-bars">
          <div className="progress-segment success" style={{flex: stats.gotIt || 0}}></div>
          <div className="progress-segment warning" style={{flex: stats.review || 0}}></div>
          <div className="progress-segment neutral" style={{flex: stats.unseen || 1}}></div>
        </div>
      </div>

      <div className="scene">
        <div className={`card ${isFlipped ? 'is-flipped' : ''}`} onClick={handleFlip}>
          <div className="card-face card-front glass-card">
            <h3>{cards[currentIndex].front}</h3>
            <span className="flip-hint"><RefreshCw size={16} /> Click to flip</span>
          </div>
          <div className="card-face card-back glass-card">
            <p>{cards[currentIndex].back}</p>
          </div>
        </div>
      </div>

      <div className={`card-actions ${isFlipped ? 'visible' : ''}`}>
        <button className="action-btn review" onClick={() => handleStatus('review')}>
          <XCircle size={24} /> Needs Review
        </button>
        <button className="action-btn got-it" onClick={() => handleStatus('got_it')}>
          <CheckCircle size={24} /> Got It
        </button>
      </div>
    </div>
  );
}
