import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Target, Award, Calendar, Zap, BookOpen, Flame } from 'lucide-react';
import {
  getStore,
  getStreak,
  getOverallAccuracy,
  getTotalMastered,
  getXPForLevel,
} from '../store/studyStore';
import './Dashboard.css';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);

  useEffect(() => {
    setStore(getStore());
  }, []);

  if (!store) return null;

  const streak = getStreak(store.studyDates);
  const accuracy = getOverallAccuracy(store.quizResults);
  const mastered = getTotalMastered(store.flashcardResults);
  const xpForNextLevel = getXPForLevel(store.level || 1);
  const xpProgress = Math.min(((store.totalXP || 0) % 500) / 500, 1);
  const totalQuizzes = store.quizResults.length;
  const totalSessions = store.sessions.length;

  // Build chart data: last 7 days with scores
  const chartData = DAY_ORDER.map(day => {
    const entry = (store.weeklyScores || []).find(s => s.name === day);
    return { name: day, score: entry ? entry.score : 0 };
  });

  const hasData = totalSessions > 0;

  return (
    <div className="dashboard animation-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="font-display">Your Studies</h1>
          <p className="text-muted">
            {streak > 0
              ? `🔥 You're on a ${streak}-day streak! Keep it up.`
              : 'Upload a PDF from the Chat to get started!'}
          </p>
        </div>
        <div className="level-badge glass-card">
          <div className="level-info">
            <span className="level-title">Level {store.level || 1} Scholar</span>
            <span className="level-xp">{store.totalXP || 0} / {xpForNextLevel} XP</span>
          </div>
          <div className="xp-bar-bg">
            <div className="xp-bar-fill" style={{ width: `${xpProgress * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-icon"><Target className="text-primary" size={24} /></div>
          <div>
            <h3>Overall Accuracy</h3>
            <p className="stat-value">{hasData ? `${accuracy}%` : '—'}</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon"><Award className="text-secondary" size={24} /></div>
          <div>
            <h3>Cards Mastered</h3>
            <p className="stat-value">{hasData ? mastered : '—'}</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon"><Flame className="text-accent" size={24} /></div>
          <div>
            <h3>Study Streak</h3>
            <p className="stat-value">{streak > 0 ? `${streak} days` : '0 days'}</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon"><Zap style={{ color: '#f59e0b' }} size={24} /></div>
          <div>
            <h3>Total XP</h3>
            <p className="stat-value">{store.totalXP || 0}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Chart */}
        <div className="chart-container glass-card">
          <h3>Weekly Performance Trend</h3>
          <div className="chart-wrapper">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--primary)' }}
                    formatter={(value) => [`${value}%`, 'Accuracy']}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <BookOpen size={40} />
                <p>Complete a quiz to see your performance trend here.</p>
                <button className="btn btn-primary" onClick={() => navigate('/chat')}>Upload a PDF</button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="recent-materials glass-card">
          <h3>Recent Sessions</h3>
          {store.sessions.length === 0 ? (
            <div className="empty-sessions">
              <p>No study sessions yet. Upload a PDF in Chat to get started!</p>
              <button className="btn btn-outline" onClick={() => navigate('/chat')}>Go to Chat</button>
            </div>
          ) : (
            <ul className="material-list">
              {store.sessions.slice(0, 5).map((session, idx) => {
                // Find matching quiz result for this file
                const quizResult = store.quizResults.find(r => r.fileName === session.fileName);
                const fcResult = store.flashcardResults.find(r => r.fileName === session.fileName);
                const label = quizResult
                  ? `${quizResult.accuracy}% accuracy on quiz`
                  : `${session.flashcardCount} flashcards • ${session.quizCount} questions`;

                return (
                  <li key={idx}>
                    <div className="material-info">
                      <h4 title={session.fileName}>
                        {session.fileName.length > 28
                          ? session.fileName.slice(0, 25) + '...'
                          : session.fileName}
                      </h4>
                      <p>{label}</p>
                    </div>
                    <button
                      className="btn btn-outline"
                      onClick={() => navigate('/quiz')}
                    >
                      Retry Quiz
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Quiz History */}
      {store.quizResults.length > 0 && (
        <div className="quiz-history glass-card">
          <h3>Quiz History</h3>
          <table className="history-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {store.quizResults.slice(0, 8).map((r, idx) => (
                <tr key={idx}>
                  <td title={r.fileName}>{r.fileName.length > 25 ? r.fileName.slice(0, 22) + '...' : r.fileName}</td>
                  <td>{r.score}/{r.total}</td>
                  <td>
                    <span className={`accuracy-pill ${r.accuracy >= 70 ? 'good' : r.accuracy >= 40 ? 'medium' : 'low'}`}>
                      {r.accuracy}%
                    </span>
                  </td>
                  <td>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
