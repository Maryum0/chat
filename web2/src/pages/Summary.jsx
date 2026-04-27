import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import './Summary.css';

export default function Summary() {
  const navigate = useNavigate();
  const location = useLocation();
  const summaryData = location.state?.data;

  // Fallback data in case user navigates directly without state
  const defaultSummary = [
    {
      title: 'Introduction to Core Concepts',
      points: [
        'Photosynthesis is the fundamental process used by plants to harness energy.',
        'Mitochondria provides the necessary cellular energy for the rest of the functions.'
      ]
    },
    {
      title: 'Structural Integrity',
      points: [
        'The cell wall provides robust protection for plant cells.',
        'The membrane is semi-permeable allowing selective transfer.'
      ]
    }
  ];

  const outline = (summaryData && summaryData.length > 0) ? summaryData : defaultSummary;

  return (
    <div className="summary-container animation-fade-in">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Back
      </button>

      <div className="summary-header">
        <FileText size={40} className="summary-icon" />
        <h2>Document Outline</h2>
        <p className="text-muted">Key headings and main points extracted from your material.</p>
      </div>

      <div className="outline-content">
        {outline.map((section, idx) => (
          <div key={idx} className="outline-section glass-card">
            <h3 className="section-title">{section.title}</h3>
            <ul className="section-points">
              {section.points.map((point, pIdx) => (
                <li key={pIdx}>
                  <CheckCircle size={16} className="point-icon" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="summary-footer">
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
