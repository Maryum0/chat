import { Link, useNavigate } from 'react-router-dom';
import { Upload, Brain, TrendingUp, Zap } from 'lucide-react';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home animation-fade-in">
      <section className="hero">
        <h1 className="font-display gradient-text">Upload your notes.<br/>Learn smarter.</h1>
        <p className="hero-subtitle">Transform your PDFs into interactive flashcards, quizzes, and adaptive learning sessions powered by AI.</p>
        <div className="cta-group">
          <Link to="/chat" className="btn btn-primary btn-glow">Start Studying <Zap size={18} /></Link>
          <Link to="/dashboard" className="btn btn-secondary">View Dashboard</Link>
        </div>
      </section>

      <section className="features">
        <div className="feature-card glass-card clickable" onClick={() => navigate('/chat')}>
          <div className="icon-wrapper"><Upload className="text-secondary" /></div>
          <h3>Instant Parsing</h3>
          <p>Drop your PDF and watch our AI extract key concepts, definitions, and questions in seconds.</p>
        </div>
        <div className="feature-card glass-card clickable" onClick={() => navigate('/quiz')}>
          <div className="icon-wrapper"><Brain className="text-primary" /></div>
          <h3>Adaptive Quizzes</h3>
          <p>Our engine learns your weak spots and tailors practice sessions to maximize retention.</p>
        </div>
        <div className="feature-card glass-card clickable" onClick={() => navigate('/dashboard')}>
          <div className="icon-wrapper"><TrendingUp className="text-accent" /></div>
          <h3>Track Progress</h3>
          <p>Visualize your mastery over time with detailed analytics and study streaks.</p>
        </div>
      </section>
    </div>
  );
}
