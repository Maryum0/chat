import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Paperclip, FileText, Bot, BookOpen, ChevronRight } from 'lucide-react';
import './Chat.css';

import { extractTextFromPDF, getPageCount } from '../utils/pdfParser';
import { generateFlashcards, generateQuiz, generateSummary, answerQuestion } from '../services/smartGenerator';
import { recordSession, updateInterests, getLearningProfile, saveCorrection, recordGlobalText } from '../store/studyStore';

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Hello! Upload a study PDF and I will generate flashcards, a quiz, and a summary for you. 📚 After that, you can ask me anything about the document!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const [pdfText, setPdfText] = useState(''); // stores full extracted text for Q&A

  // Page range picker state
  const [pendingFile, setPendingFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [showPagePicker, setShowPagePicker] = useState(false);

  const fileInputRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showPagePicker]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const questionText = input;
    setInput('');

    // Train the bot: Update interests
    const keywords = questionText.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    updateInterests(keywords);

    // CHECK FOR USER CORRECTION: "Actually, X is Y" or "No, X means Y"
    const correctionMatch = questionText.match(/^(?:Actually|No|Correction)[,:]?\s+(.+?)\s+(?:is|means|refers to)\s+(.+)$/i);
    if (correctionMatch) {
      const term = correctionMatch[1].trim();
      const definition = correctionMatch[2].trim();
      saveCorrection(term, definition);
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: `✅ Knowledge Updated! I've memorized that "${term}" is: ${definition}. I will use this in all future study materials.`
      }]);
      return;
    }

    // If we have a loaded PDF or global knowledge, answer from it
    const profile = getLearningProfile();
    if (pdfText || (profile.globalKnowledge && profile.globalKnowledge.length > 0)) {
      setIsTyping(true);
      setTimeout(() => {
        // Collect last 5 messages for context
        const history = messages.slice(-5);
        const answer = answerQuestion(questionText, pdfText || '', profile, history);
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            type: 'bot',
            text: answer || "I couldn't find relevant information in my knowledge base. Try rephrasing!",
            isAnswer: true
          }
        ]);
      }, 800);
    } else {
      simulateBotResponse();
    }
  };

  // STEP 1: User selects a file → get page count, show page picker
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // reset input so same file can be re-selected
    if (!file || file.type !== 'application/pdf') {
      setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: 'Please upload a valid PDF file.' }]);
      return;
    }

    setCurrentFileName(file.name);
    setMessages(prev => [...prev, {
      id: Date.now(), type: 'user-file',
      text: `📄 ${file.name}`
    }]);

    try {
      const count = await getPageCount(file);
      setTotalPages(count);
      setStartPage(1);
      setEndPage(count);
      setPendingFile(file);
      setShowPagePicker(true);
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: 'Could not read the PDF. Please ensure it is a valid PDF file.' }]);
    }
  };

  // STEP 2: User confirms page range → analyze
  const handleAnalyze = async () => {
    if (!pendingFile) return;
    setShowPagePicker(false);

    const rangeLabel = startPage === 1 && endPage === totalPages
      ? 'all pages'
      : `pages ${startPage}–${endPage}`;

    setMessages(prev => [...prev, {
      id: Date.now(), type: 'bot',
      text: `Got it! Analyzing "${pendingFile.name}" (${rangeLabel})...`
    }]);
    setIsTyping(true);

    try {
      const text = await extractTextFromPDF(pendingFile, startPage, endPage);
      const profile = getLearningProfile();
      
      const flashcards = generateFlashcards(text, profile);
      const quiz = generateQuiz(text, profile);
      const summary = generateSummary(text, profile);

      // Store PDF text for later Q&A and persist globally
      setPdfText(text);
      setCurrentFileName(pendingFile.name);
      recordSession(pendingFile.name, flashcards.length, quiz.length);
      recordGlobalText(pendingFile.name, text);
      setIsTyping(false);

      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: `✅ Done! From ${rangeLabel} of "${pendingFile.name}" I generated ${flashcards.length} flashcards and a ${quiz.length}-question quiz.`,
        actions: [
          { label: '📋 View Summary', path: '/summary', data: summary },
          { label: '🧠 Start Quiz', path: '/quiz', data: quiz, fileName: pendingFile.name },
          { label: '🗂️ Flashcards', path: '/flashcards', data: flashcards, fileName: pendingFile.name }
        ]
      }]);
      setPendingFile(null);
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: 'Sorry, I had trouble reading that PDF. Please ensure it has readable text layers (not a scanned image).' }]);
    }
  };

  const simulateBotResponse = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(), type: 'bot',
        text: 'Great question! Upload a PDF so I can generate study materials tailored to your notes.'
      }]);
    }, 1500);
  };

  return (
    <div className="chat-layout animation-fade-in">
      <aside className="chat-sidebar glass-card">
        <h3>Study Sessions</h3>
        <ul className="session-list">
          <li className="active"><Bot size={18} /> Current Session</li>
          <li><FileText size={18} /> Previous PDFs</li>
        </ul>
      </aside>

      <main className="chat-main glass-card">
        <div className="chat-history no-scrollbar">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.type}`}>
              <div className="message-bubble">
                {msg.text}
                {msg.actions && (
                  <div className="message-actions">
                    {msg.actions.map(action => (
                      <button
                        key={action.path}
                        className="btn btn-outline btn-sm action-link"
                        onClick={() => navigate(action.path, { state: { data: action.data, fileName: action.fileName } })}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Page Range Picker — shown inline in the chat */}
          {showPagePicker && (
            <div className="message bot">
              <div className="message-bubble page-picker-bubble">
                <div className="page-picker-header">
                  <BookOpen size={20} />
                  <span>
                    <strong>{pendingFile?.name}</strong> has <strong>{totalPages} pages</strong>.
                    Which pages would you like to analyze?
                  </span>
                </div>
                <div className="page-picker-controls">
                  <div className="page-input-group">
                    <label htmlFor="start-page">From page</label>
                    <input
                      id="start-page"
                      type="number"
                      min={1}
                      max={totalPages}
                      value={startPage}
                      onChange={e => setStartPage(Math.max(1, Math.min(parseInt(e.target.value) || 1, endPage)))}
                    />
                  </div>
                  <span className="page-separator">to</span>
                  <div className="page-input-group">
                    <label htmlFor="end-page">Page</label>
                    <input
                      id="end-page"
                      type="number"
                      min={startPage}
                      max={totalPages}
                      value={endPage}
                      onChange={e => setEndPage(Math.min(totalPages, Math.max(parseInt(e.target.value) || totalPages, startPage)))}
                    />
                  </div>
                  <button className="btn btn-outline" onClick={() => { setStartPage(1); setEndPage(totalPages); }}>
                    All Pages
                  </button>
                </div>
                <p className="page-picker-summary">
                  Will extract {endPage - startPage + 1} page{endPage - startPage !== 0 ? 's' : ''} ({startPage} – {endPage} of {totalPages})
                </p>
                <button className="btn btn-primary analyze-btn" onClick={handleAnalyze}>
                  Analyze Selected Pages <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="message bot">
              <div className="message-bubble typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="chat-input-area">
          <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} accept="application/pdf" />
          <button className="icon-btn" onClick={() => fileInputRef.current?.click()} aria-label="Upload File">
            <Paperclip />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question or upload notes..."
          />
          <button className="btn btn-primary" onClick={handleSend} aria-label="Send Message"><Send size={18} /></button>
        </div>
      </main>
    </div>
  );
}
