import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [backendAlive, setBackendAlive] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Explorer states
  const [questions, setQuestions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [filters, setFilters] = useState({
    company: '',
    role: '',
    category: '',
    topic: '',
    difficulty: '',
    search: ''
  });

  // Predictor states
  const [predictCo, setPredictCo] = useState('Google');
  const [predictRole, setPredictRole] = useState('Software Engineer');
  const [prediction, setPrediction] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState('');

  // Scraper states
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeSuccess, setScrapeSuccess] = useState('');
  const [scrapeError, setScrapeError] = useState('');
  const [scrapedQuestions, setScrapedQuestions] = useState([]);

  // Manual submission states
  const [customForm, setCustomForm] = useState({
    title: '',
    company: '',
    role: '',
    category: 'Coding',
    topic: 'General Coding',
    difficulty: 'Medium',
    content: '',
    frequency: 3
  });
  const [submittingCustom, setSubmittingCustom] = useState(false);
  const [customSuccess, setCustomSuccess] = useState(false);

  // Detail Modal state
  const [activeQuestion, setActiveQuestion] = useState(null);

  // Test backend status and pull dashboard statistics
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setBackendAlive(true);
      } else {
        setBackendAlive(false);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setBackendAlive(false);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch paginated explorer questions
  const fetchQuestions = async (page = 1) => {
    setLoadingQuestions(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', 8);
      if (filters.company) queryParams.append('company', filters.company);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.topic) queryParams.append('topic', filters.topic);
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
      if (filters.search) queryParams.append('search', filters.search);

      const res = await fetch(`${API_BASE}/api/questions?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setTotalPages(data.pagination.total_pages);
        setCurrentPage(data.pagination.current_page);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Run predictions
  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    if (!predictCo || !predictRole) return;
    setPredictLoading(true);
    setPredictError('');
    setPrediction(null);
    try {
      const res = await fetch(`${API_BASE}/api/predict?company=${encodeURIComponent(predictCo)}&role=${encodeURIComponent(predictRole)}`);
      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      } else {
        const errData = await res.json();
        setPredictError(errData.detail || "Prediction calculations failed.");
      }
    } catch (err) {
      setPredictError("Server is offline or unreachable.");
    } finally {
      setPredictLoading(false);
    }
  };

  // Trigger web scraping
  const handleScrape = async (e) => {
    e.preventDefault();
    if (!scrapeUrl) return;
    setScrapeLoading(true);
    setScrapeSuccess('');
    setScrapeError('');
    setScrapedQuestions([]);
    try {
      const res = await fetch(`${API_BASE}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      });
      if (res.ok) {
        const data = await res.json();
        setScrapeSuccess(data.message);
        setScrapedQuestions(data.scraped_questions || []);
        setScrapeUrl('');
        fetchStats(); // update dashboard statistics
      } else {
        const errData = await res.json();
        setScrapeError(errData.detail || "Failed to process target site.");
      }
    } catch (err) {
      setScrapeError("Network connectivity problem.");
    } finally {
      setScrapeLoading(false);
    }
  };

  // Submit custom logs
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setSubmittingCustom(true);
    setCustomSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/api/custom-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customForm)
      });
      if (res.ok) {
        setCustomSuccess(true);
        setCustomForm({
          title: '',
          company: customForm.company,
          role: customForm.role,
          category: 'Coding',
          topic: 'General Coding',
          difficulty: 'Medium',
          content: '',
          frequency: 3
        });
        fetchStats();
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmittingCustom(false);
    }
  };

  // Quick reset filters
  const resetFilters = () => {
    setFilters({
      company: '',
      role: '',
      category: '',
      topic: '',
      difficulty: '',
      search: ''
    });
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'explorer') {
      fetchQuestions(currentPage);
    }
  }, [activeTab, currentPage, filters]);

  // Handle standard filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <div style={styles.headerGlowCircle}></div>
          <svg style={styles.headerLogo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span className="title-glow" style={styles.headerTitle}>PrepAI</span>
          <span style={styles.headerSubtitle}>Interview Question Pattern Analyzer</span>
        </div>
        <div style={styles.headerMeta}>
          <div style={styles.statusIndicator}>
            <div style={{
              ...styles.statusDot, 
              backgroundColor: backendAlive ? 'var(--success)' : 'var(--danger)',
              boxShadow: backendAlive ? '0 0 8px var(--success)' : '0 0 8px var(--danger)'
            }}></div>
            <span style={styles.statusText}>{backendAlive ? "AI Engines Online" : "Connecting to Engine..."}</span>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Navigation Tabs */}
        <nav style={styles.navBar}>
          <button 
            className="btn" 
            style={activeTab === 'dashboard' ? styles.activeTabBtn : styles.tabBtn} 
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className="btn" 
            style={activeTab === 'predictor' ? styles.activeTabBtn : styles.tabBtn} 
            onClick={() => {
              setActiveTab('predictor');
              if (!prediction) handlePredict();
            }}
          >
            Pattern Predictor
          </button>
          <button 
            className="btn" 
            style={activeTab === 'explorer' ? styles.activeTabBtn : styles.tabBtn} 
            onClick={() => setActiveTab('explorer')}
          >
            Question Explorer
          </button>
          <button 
            className="btn" 
            style={activeTab === 'submitter' ? styles.activeTabBtn : styles.tabBtn} 
            onClick={() => setActiveTab('submitter')}
          >
            Scrape & Contribute
          </button>
        </nav>

        {/* Tab 1: Dashboard Panel */}
        {activeTab === 'dashboard' && (
          <div style={styles.tabContent}>
            {loadingStats ? (
              <div style={styles.loadingContainer}>
                <div className="spinner"></div>
                <p>Loading analytics and metrics...</p>
              </div>
            ) : !stats ? (
              <div className="glass-card" style={styles.errorCard}>
                <h3>Database Seeding Required</h3>
                <p style={{marginTop: '8px', color: 'var(--text-muted)'}}>
                  We were unable to connect to the statistics backend. Please confirm the Python server is running on port 8000.
                </p>
                <button className="btn btn-primary" style={{marginTop: '16px'}} onClick={fetchStats}>
                  Retry Connection
                </button>
              </div>
            ) : (
              <div style={styles.dashboardGrid}>
                {/* Stats Blocks */}
                <div style={styles.metricsGrid}>
                  <div className="glass-card" style={styles.metricCard}>
                    <div style={styles.metricIconBox}>📊</div>
                    <div>
                      <h4 style={styles.metricVal}>{stats.total_questions}</h4>
                      <p style={styles.metricLabel}>Total Questions</p>
                    </div>
                  </div>
                  <div className="glass-card" style={styles.metricCard}>
                    <div style={styles.metricIconBox}>🏢</div>
                    <div>
                      <h4 style={styles.metricVal}>{stats.total_companies}</h4>
                      <p style={styles.metricLabel}>Companies Tracked</p>
                    </div>
                  </div>
                  <div className="glass-card" style={styles.metricCard}>
                    <div style={styles.metricIconBox}>👨‍💻</div>
                    <div>
                      <h4 style={styles.metricVal}>{stats.total_roles}</h4>
                      <p style={styles.metricLabel}>Job Roles</p>
                    </div>
                  </div>
                  <div className="glass-card" style={styles.metricCard}>
                    <div style={styles.metricIconBox}>🧠</div>
                    <div>
                      <h4 style={styles.metricVal}>{stats.total_topics}</h4>
                      <p style={styles.metricLabel}>Core NLP Topics</p>
                    </div>
                  </div>
                </div>

                {/* Subgrid with Charts */}
                <div style={styles.chartsGrid}>
                  {/* Category & Difficulty Chart */}
                  <div className="glass-card">
                    <h3 style={styles.cardHeading}>Frequency Distribution</h3>
                    
                    <div style={{marginTop: '18px'}}>
                      <p style={styles.chartSubtitle}>Category Weights</p>
                      {Object.entries(stats.category_breakdown).map(([cat, val]) => (
                        <div key={cat} style={styles.progressRow}>
                          <div style={styles.progressLabels}>
                            <span>{cat}</span>
                            <span>{val} reports</span>
                          </div>
                          <div style={styles.progressBarBg}>
                            <div style={{
                              ...styles.progressBarFill, 
                              width: `${Math.min(100, (val / Math.max(...Object.values(stats.category_breakdown))) * 100)}%`,
                              background: cat === 'Coding' ? 'var(--primary)' : cat === 'System Design' ? 'var(--secondary)' : 'var(--accent)'
                            }}></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{marginTop: '24px'}}>
                      <p style={styles.chartSubtitle}>Difficulty Ratio</p>
                      <div style={styles.difficultyMeter}>
                        {Object.entries(stats.difficulty_breakdown).map(([diff, val]) => {
                          const total = Object.values(stats.difficulty_breakdown).reduce((a, b) => a + b, 0) || 1;
                          const pct = Math.round((val / total) * 100);
                          return (
                            <div 
                              key={diff} 
                              style={{
                                ...styles.diffSeg,
                                width: `${pct}%`,
                                backgroundColor: diff === 'Easy' ? 'var(--success)' : diff === 'Medium' ? 'var(--warning)' : 'var(--danger)'
                              }}
                              title={`${diff}: ${pct}%`}
                            >
                              {pct > 15 ? `${diff} (${pct}%)` : ''}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Top Target Companies */}
                  <div className="glass-card">
                    <h3 style={styles.cardHeading}>Aggregated Activity by Company</h3>
                    <div style={styles.companyBarChart}>
                      {stats.top_companies.map((co) => {
                        const maxVal = stats.top_companies[0]?.c || 1;
                        const pctHeight = (co.c / maxVal) * 85;
                        return (
                          <div key={co.company} style={styles.companyBarCol}>
                            <div style={styles.companyBarOuter}>
                              <div style={{
                                ...styles.companyBarInner, 
                                height: `${pctHeight}%`
                              }}>
                                <span style={styles.companyBarVal}>{co.c}</span>
                              </div>
                            </div>
                            <span style={styles.companyBarLabel}>{co.company}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Study Planner Hero Banner */}
                <div className="glass-card" style={styles.heroBanner}>
                  <div style={styles.heroTextSide}>
                    <span style={styles.heroBadge}>RECOMMENDED FLOW</span>
                    <h2 style={styles.heroTitle}>Predict Custom Interview Patterns</h2>
                    <p style={styles.heroDesc}>
                      Select a company and a targeted role. Our backend NLP engine analyzes related questions, 
                      calculates term weightings with TF-IDF, and estimates category probabilities to build your optimal study focus path.
                    </p>
                    <button className="btn btn-accent" onClick={() => {
                      setActiveTab('predictor');
                      handlePredict();
                    }}>
                      Open Predictor Dashboard &rarr;
                    </button>
                  </div>
                  <div style={styles.heroGraphicSide}>
                    <svg viewBox="0 0 100 100" style={styles.heroGraphic}>
                      <defs>
                        <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="var(--secondary)" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="38" fill="none" stroke="url(#circleGrad)" strokeWidth="1.5" strokeDasharray="5, 3" />
                      <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                      <line x1="50" y1="12" x2="50" y2="88" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <line x1="12" y1="50" x2="88" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      {/* Dots */}
                      <circle cx="50" cy="22" r="4" fill="var(--primary)" />
                      <circle cx="28" cy="68" r="5" fill="var(--secondary)" />
                      <circle cx="72" cy="62" r="3" fill="var(--accent)" />
                      <path d="M 40,50 L 48,56 L 62,44" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pattern Predictor Panel */}
        {activeTab === 'predictor' && (
          <div style={styles.tabContent}>
            <div style={styles.predictorContainer}>
              {/* Form Sidebar */}
              <div className="glass-card" style={styles.predictorSidebar}>
                <h3 style={styles.cardHeading}>Prediction Parameters</h3>
                <p style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px'}}>
                  Enter your target company and role below to generate historical trends and topic probabilities.
                </p>
                <form onSubmit={handlePredict}>
                  <div className="form-group">
                    <label className="form-label">Target Company</label>
                    <select 
                      className="form-select" 
                      value={predictCo}
                      onChange={(e) => setPredictCo(e.target.value)}
                    >
                      <option value="Google">Google</option>
                      <option value="Meta">Meta</option>
                      <option value="Amazon">Amazon</option>
                      <option value="Netflix">Netflix</option>
                      <option value="Microsoft">Microsoft</option>
                      <option value="Apple">Apple</option>
                      <option value="Uber">Uber</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Target Role</label>
                    <select 
                      className="form-select" 
                      value={predictRole}
                      onChange={(e) => setPredictRole(e.target.value)}
                    >
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="DevOps">DevOps Engineer</option>
                      <option value="Data Scientist">Data Scientist</option>
                      <option value="Product Manager">Product Manager</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{width: '100%', marginTop: '10px'}}
                    disabled={predictLoading}
                  >
                    {predictLoading ? "Analyzing patterns..." : "Generate Study Guide"}
                  </button>
                </form>
              </div>

              {/* Main Report Column */}
              <div style={styles.predictorReport}>
                {predictLoading && (
                  <div className="glass-card" style={styles.reportLoader}>
                    <div className="spinner"></div>
                    <h3 style={{marginTop: '16px'}}>Executing NLP Frequency Model</h3>
                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px'}}>
                      Tokenizing keywords, fetching comparative term document frequencies, and scoring relevance thresholds...
                    </p>
                  </div>
                )}

                {predictError && (
                  <div className="glass-card" style={styles.errorCard}>
                    <h3>Calculations Unsuccessful</h3>
                    <p style={{marginTop: '8px', color: 'var(--text-muted)'}}>{predictError}</p>
                  </div>
                )}

                {!predictLoading && !predictError && prediction && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                    
                    {/* Header Summary */}
                    <div className="glass-card" style={styles.reportHeaderCard}>
                      <div style={styles.reportMetaHeader}>
                        <div>
                          <span style={styles.reportBadge}>PREDICTIVE STUDY REPORT</span>
                          <h2 style={styles.reportTitle}>{prediction.company} &bull; {prediction.role}</h2>
                        </div>
                        <div style={styles.sampleCountBox}>
                          <span style={styles.sampleCountVal}>{prediction.total_questions_analyzed}</span>
                          <span style={styles.sampleCountLbl}>Matched Logs</span>
                        </div>
                      </div>

                      {prediction.fallback_applied && (
                        <div style={styles.fallbackAlert}>
                          <span style={styles.fallbackBadge}>Notice</span>
                          <span style={styles.fallbackText}>{prediction.fallback_reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Left & Right Breakdown */}
                    <div style={styles.reportMiddleGrid}>
                      {/* Topic Predictions */}
                      <div className="glass-card" style={{flex: 1.3}}>
                        <h3 style={styles.cardHeading}>Predicted Topic Weighting</h3>
                        <p style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px'}}>
                          Relevance weights are calculated by scaling keyword frequencies against corporate focus distributions.
                        </p>
                        
                        <div style={styles.predictedTopicList}>
                          {prediction.predicted_topics.map((t) => (
                            <div key={t.topic} style={styles.topicRow}>
                              <div style={styles.topicHeaderInfo}>
                                <span style={styles.topicName}>{t.topic}</span>
                                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                  <span style={{
                                    ...styles.trendBadge,
                                    backgroundColor: t.trend === 'High Frequency' ? 'rgba(239,68,68,0.1)' : t.trend === 'Rising' ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.05)',
                                    color: t.trend === 'High Frequency' ? 'var(--danger)' : t.trend === 'Rising' ? 'var(--secondary)' : 'var(--text-muted)',
                                    border: t.trend === 'High Frequency' ? '1px solid rgba(239,68,68,0.2)' : t.trend === 'Rising' ? '1px solid rgba(6,182,212,0.2)' : '1px solid var(--border-color)',
                                  }}>
                                    {t.trend}
                                  </span>
                                  <span style={styles.topicPct}>{t.importance}% weight</span>
                                </div>
                              </div>
                              <div style={styles.progressBarBg}>
                                <div style={{
                                  ...styles.progressBarFill, 
                                  width: `${t.importance}%`,
                                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)'
                                }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary Distributions & Keywords */}
                      <div style={{flex: 0.9, display: 'flex', flexDirection: 'column', gap: '24px'}}>
                        <div className="glass-card" style={{flex: 1}}>
                          <h3 style={styles.cardHeading}>Key NLP Phrases</h3>
                          <p style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px'}}>
                            TF-IDF terms extracted specifically from this role's historical dataset.
                          </p>
                          <div style={styles.keywordTagsContainer}>
                            {prediction.keywords.map((word) => (
                              <span key={word} style={styles.keywordTag}>{word}</span>
                            ))}
                            {prediction.keywords.length === 0 && (
                              <span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No specific terms found.</span>
                            )}
                          </div>
                        </div>

                        <div className="glass-card" style={{flex: 1.2}}>
                          <h3 style={styles.cardHeading}>Target Category Ratio</h3>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px'}}>
                            {Object.entries(prediction.category_distribution).map(([cat, pct]) => (
                              <div key={cat} style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                <div style={{
                                  width: '12px', 
                                  height: '12px', 
                                  borderRadius: '3px',
                                  backgroundColor: cat === 'Coding' ? 'var(--primary)' : cat === 'System Design' ? 'var(--secondary)' : 'var(--accent)'
                                }}></div>
                                <span style={{fontSize: '0.85rem', flex: 1}}>{cat}</span>
                                <span style={{fontSize: '0.85rem', fontWeight: 600}}>{pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Study Advice */}
                    <div className="glass-card" style={styles.adviceCard}>
                      <div style={styles.adviceIcon}>💡</div>
                      <div>
                        <h4 style={{fontSize: '1rem', fontWeight: 600, color: 'var(--secondary)'}}>Smart Study Guide Advice</h4>
                        <p style={styles.adviceText}>{prediction.study_advice}</p>
                      </div>
                    </div>

                    {/* Recommended Questions */}
                    <div className="glass-card">
                      <h3 style={styles.cardHeading}>High-Yield Interview Questions to Practice</h3>
                      <p style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px'}}>
                        These questions are selected based on high report frequencies for {prediction.company}.
                      </p>
                      
                      <div style={styles.recommendedList}>
                        {prediction.recommended_questions.map((q) => (
                          <div 
                            key={q.id} 
                            style={styles.recommendedCard}
                            onClick={() => setActiveQuestion(q)}
                          >
                            <div style={styles.recommendedCardHeader}>
                              <span className={`badge badge-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                              <span className="badge-category">{q.category}</span>
                            </div>
                            <h4 style={styles.recommendedTitle}>{q.title}</h4>
                            <div style={styles.recommendedCardFooter}>
                              <span style={styles.recommendedTopicName}>{q.topic}</span>
                              <span style={styles.reportedCount}>🎯 {q.frequency} frequency reports</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Question Explorer Panel */}
        {activeTab === 'explorer' && (
          <div style={styles.tabContent}>
            {/* Filter Hub */}
            <div className="glass-card" style={styles.filterHub}>
              <div style={styles.searchBarBox}>
                <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search questions by title, keywords or content..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  style={{paddingLeft: '44px'}}
                />
              </div>

              <div style={styles.dropdownFiltersGrid}>
                <div style={{flex: 1}}>
                  <select 
                    className="form-select"
                    value={filters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                  >
                    <option value="">All Companies</option>
                    {stats?.filters?.companies?.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{flex: 1}}>
                  <select 
                    className="form-select"
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    <option value="">All Roles</option>
                    {stats?.filters?.roles?.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div style={{flex: 1}}>
                  <select 
                    className="form-select"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="Coding">Coding</option>
                    <option value="System Design">System Design</option>
                    <option value="Behavioral">Behavioral</option>
                  </select>
                </div>

                <div style={{flex: 1}}>
                  <select 
                    className="form-select"
                    value={filters.difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  >
                    <option value="">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <button className="btn btn-secondary" onClick={resetFilters}>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div style={{marginTop: '24px'}}>
              {loadingQuestions ? (
                <div style={styles.loadingContainer}>
                  <div className="spinner"></div>
                  <p>Querying questions database...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="glass-card" style={styles.emptyCard}>
                  <h3>No matching interview questions</h3>
                  <p style={{marginTop: '8px', color: 'var(--text-muted)'}}>
                    Try adjusting your filters, modifying search keywords, or scraping a new page to load it into PrepAI.
                  </p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div style={styles.questionsGrid}>
                    {questions.map((q) => (
                      <div 
                        key={q.id} 
                        className="glass-card" 
                        style={styles.questionListItem}
                        onClick={() => setActiveQuestion(q)}
                      >
                        <div style={styles.questionItemTop}>
                          <div style={{display: 'flex', gap: '8px'}}>
                            <span style={styles.companyPill}>{q.company}</span>
                            <span className="badge-category">{q.category}</span>
                          </div>
                          <span className={`badge badge-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                        </div>
                        <h3 style={styles.questionItemTitle}>{q.title}</h3>
                        <p style={styles.questionItemExcerpt}>
                          {q.content.length > 120 ? q.content.slice(0, 117) + "..." : q.content}
                        </p>
                        <div style={styles.questionItemBottom}>
                          <div style={styles.tagGroup}>
                            <span style={styles.roleTag}>{q.role}</span>
                            <span style={styles.topicTag}>{q.topic}</span>
                          </div>
                          <span style={styles.freqTag}>🎯 {q.frequency} reports</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={styles.paginationRow}>
                      <button 
                        className="btn btn-secondary" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      >
                        &larr; Prev
                      </button>
                      <span style={styles.paginationText}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button 
                        className="btn btn-secondary" 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      >
                        Next &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Scrape & Submit Panel */}
        {activeTab === 'submitter' && (
          <div style={styles.tabContent}>
            <div style={styles.splitFormsLayout}>
              
              {/* Form 1: Crawler/Importer */}
              <div className="glass-card" style={{flex: 1}}>
                <h2 style={styles.sectionHeading}>URL Scraping Crawler</h2>
                <p style={{color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '18px'}}>
                  Enter an interview experience blog post URL, public question board page, or simulated path. 
                  Our parser crawls the DOM, extracts lists/paragraphs matching interview question heuristics, and structures them into the database automatically.
                </p>

                <form onSubmit={handleScrape} style={{marginBottom: '20px'}}>
                  <div className="form-group">
                    <label className="form-label">Target Page URL</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. https://example-interviews.com/google-swe-experience"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{width: '100%', marginTop: '6px'}}
                    disabled={scrapeLoading}
                  >
                    {scrapeLoading ? "Parsing Webpage..." : "Run Web Scraper"}
                  </button>
                </form>

                {scrapeSuccess && (
                  <div style={styles.successBox}>
                    <p style={{fontWeight: 600}}>{scrapeSuccess}</p>
                    <div style={{marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                      {scrapedQuestions.map((q, idx) => (
                        <div key={idx} style={styles.scrapedItemRow}>
                          <span className={`badge badge-${q.difficulty.toLowerCase()}`} style={{fontSize: '0.65rem', padding: '2px 6px'}}>{q.difficulty}</span>
                          <span style={styles.scrapedItemTitle}>{q.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scrapeError && (
                  <div style={styles.errorBox}>
                    <p>{scrapeError}</p>
                  </div>
                )}
              </div>

              {/* Form 2: Manual Submitter */}
              <div className="glass-card" style={{flex: 1}}>
                <h2 style={styles.sectionHeading}>Submit Custom Question</h2>
                <p style={{color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '18px'}}>
                  Submit an interview question you've recently encountered or heard from peers to expand the knowledge base.
                </p>

                <form onSubmit={handleCustomSubmit}>
                  <div style={{display: 'flex', gap: '16px'}}>
                    <div className="form-group" style={{flex: 1}}>
                      <label className="form-label">Company</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Google, Meta"
                        value={customForm.company}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, company: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                      <label className="form-label">Job Role</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Software Engineer"
                        value={customForm.role}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, role: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div style={{display: 'flex', gap: '16px'}}>
                    <div className="form-group" style={{flex: 1}}>
                      <label className="form-label">Category</label>
                      <select 
                        className="form-select"
                        value={customForm.category}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="Coding">Coding</option>
                        <option value="System Design">System Design</option>
                        <option value="Behavioral">Behavioral</option>
                      </select>
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                      <label className="form-label">Difficulty</label>
                      <select 
                        className="form-select"
                        value={customForm.difficulty}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, difficulty: e.target.value }))}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div style={{display: 'flex', gap: '16px'}}>
                    <div className="form-group" style={{flex: 1}}>
                      <label className="form-label">Core NLP Topic</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Dynamic Programming, Scalability"
                        value={customForm.topic}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, topic: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                      <label className="form-label">Frequency Reports</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        min="1"
                        max="100"
                        value={customForm.frequency}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, frequency: parseInt(e.target.value) || 1 }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Question Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Implement a circular buffer queue"
                      value={customForm.title}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Question Text & Constraints</label>
                    <textarea 
                      className="form-textarea" 
                      rows="4"
                      placeholder="Paste the full question context, inputs, outputs, and edge cases here..."
                      value={customForm.content}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, content: e.target.value }))}
                      required
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-accent" 
                    style={{width: '100%', marginTop: '6px'}}
                    disabled={submittingCustom}
                  >
                    {submittingCustom ? "Submitting..." : "Submit Question Details"}
                  </button>
                </form>

                {customSuccess && (
                  <div style={{...styles.successBox, marginTop: '16px'}}>
                    <p style={{fontWeight: 600}}>Question submitted successfully and integrated into NLP calculations!</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Detail Modal Component */}
      {activeQuestion && (
        <div style={styles.modalOverlay} onClick={() => setActiveQuestion(null)}>
          <div className="glass-card" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <span style={styles.modalCompany}>{activeQuestion.company}</span>
                <span className={`badge badge-${activeQuestion.difficulty.toLowerCase()}`}>{activeQuestion.difficulty}</span>
                <span className="badge-category">{activeQuestion.category}</span>
              </div>
              <button style={styles.modalCloseBtn} onClick={() => setActiveQuestion(null)}>&times;</button>
            </div>
            
            <h2 style={styles.modalTitle}>{activeQuestion.title}</h2>
            
            <div style={styles.modalMetaInfo}>
              <div style={styles.modalMetaItem}>
                <span style={styles.modalMetaLabel}>Target Role:</span>
                <span style={styles.modalMetaValue}>{activeQuestion.role}</span>
              </div>
              <div style={styles.modalMetaItem}>
                <span style={styles.modalMetaLabel}>Categorized Topic:</span>
                <span style={styles.modalMetaValue}>{activeQuestion.topic}</span>
              </div>
              <div style={styles.modalMetaItem}>
                <span style={styles.modalMetaLabel}>Reported Frequency:</span>
                <span style={styles.modalMetaValue}>🎯 {activeQuestion.frequency} candidates</span>
              </div>
            </div>

            <hr style={styles.modalSeparator} />

            <div style={styles.modalBody}>
              <h4 style={{fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Question Prompt</h4>
              <p style={styles.modalText}>{activeQuestion.content}</p>
            </div>

            <div style={styles.modalFooter}>
              <button className="btn btn-secondary" onClick={() => setActiveQuestion(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 40px',
    borderBottom: '1px solid var(--border-color)',
    background: 'rgba(10, 14, 26, 0.8)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    position: 'relative'
  },
  headerGlowCircle: {
    position: 'absolute',
    width: '32px',
    height: '32px',
    backgroundColor: 'var(--primary)',
    filter: 'blur(20px)',
    opacity: 0.6,
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: -1
  },
  headerLogo: {
    width: '28px',
    height: '28px',
    color: 'var(--secondary)',
    filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.3))'
  },
  headerTitle: {
    fontSize: '1.45rem',
    fontWeight: '800',
    letterSpacing: '-0.02em'
  },
  headerSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    borderLeft: '1px solid var(--border-color)',
    paddingLeft: '12px',
    marginLeft: '4px',
    marginTop: '2px'
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.03)',
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid var(--border-color)'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  statusText: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    letterSpacing: '0.02em'
  },
  navBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '28px',
    background: 'rgba(17, 24, 44, 0.4)',
    padding: '6px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    alignSelf: 'flex-start',
    width: 'fit-content'
  },
  tabBtn: {
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    padding: '8px 18px',
    borderRadius: '7px'
  },
  activeTabBtn: {
    background: 'var(--bg-hover)',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    padding: '8px 18px',
    borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: 'var(--shadow-sm)'
  },
  tabContent: {
    animation: 'fadeIn 0.4s ease-out'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    gap: '16px',
    color: 'var(--text-muted)'
  },
  errorCard: {
    textAlign: 'center',
    padding: '40px',
    maxWidth: '550px',
    margin: '40px auto'
  },
  emptyCard: {
    textAlign: 'center',
    padding: '60px 40px',
    color: 'var(--text-muted)'
  },
  dashboardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px'
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    padding: '20px'
  },
  metricIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    border: '1px solid var(--border-color)'
  },
  metricVal: {
    fontSize: '1.8rem',
    fontWeight: '800',
    fontFamily: 'var(--font-title)',
    lineHeight: 1.2
  },
  metricLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 500
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '24px'
  },
  cardHeading: {
    fontSize: '1.15rem',
    fontFamily: 'var(--font-title)',
    fontWeight: '700',
    letterSpacing: '-0.01em',
    marginBottom: '8px'
  },
  chartSubtitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
    marginBottom: '12px'
  },
  progressRow: {
    marginBottom: '12px'
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.82rem',
    marginBottom: '4px',
    fontWeight: 500
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.8s ease'
  },
  difficultyMeter: {
    display: 'flex',
    height: '24px',
    borderRadius: '6px',
    overflow: 'hidden',
    marginTop: '8px'
  },
  diffSeg: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#000',
    transition: 'width 0.8s ease'
  },
  companyBarChart: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '220px',
    marginTop: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--border-color)'
  },
  companyBarCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: '14%'
  },
  companyBarOuter: {
    height: '160px',
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  companyBarInner: {
    width: '28px',
    background: 'linear-gradient(180deg, var(--secondary) 0%, rgba(6,182,212,0.15) 100%)',
    borderRadius: '6px 6px 0 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '4px',
    boxShadow: '0 0 10px rgba(6,182,212,0.15)',
    position: 'relative',
    transition: 'height 0.8s ease'
  },
  companyBarVal: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#fff',
    position: 'absolute',
    top: '-20px'
  },
  companyBarLabel: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
    textAlign: 'center',
    whiteSpace: 'nowrap'
  },
  heroBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '36px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(6,182,212,0.07) 100%)',
    border: '1px solid rgba(99,102,241,0.15)',
    position: 'relative',
    overflow: 'hidden'
  },
  heroTextSide: {
    flex: 1.5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px',
    zIndex: 2
  },
  heroBadge: {
    background: 'rgba(99,102,241,0.15)',
    color: '#a5b4fc',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '4px 10px',
    borderRadius: '4px'
  },
  heroTitle: {
    fontSize: '1.8rem',
    fontFamily: 'var(--font-title)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    lineHeight: 1.2
  },
  heroDesc: {
    fontSize: '0.92rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    marginBottom: '8px'
  },
  heroGraphicSide: {
    flex: 0.8,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  heroGraphic: {
    width: '180px',
    height: '180px',
    filter: 'drop-shadow(0 0 15px rgba(99,102,241,0.2))'
  },
  predictorContainer: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start'
  },
  predictorSidebar: {
    flex: 0.9,
    position: 'sticky',
    top: '100px'
  },
  predictorReport: {
    flex: 2.1
  },
  reportLoader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 40px',
    textAlign: 'center'
  },
  reportHeaderCard: {
    background: 'linear-gradient(135deg, rgba(17,24,44,0.85) 0%, rgba(10,14,26,0.9) 100%)'
  },
  reportMetaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reportBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--secondary)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
  },
  reportTitle: {
    fontSize: '2rem',
    fontFamily: 'var(--font-title)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginTop: '4px'
  },
  sampleCountBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    padding: '10px 18px',
    borderRadius: '10px'
  },
  sampleCountVal: {
    fontSize: '1.6rem',
    fontWeight: 800,
    fontFamily: 'var(--font-title)',
    color: 'var(--secondary)'
  },
  sampleCountLbl: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    fontWeight: 500
  },
  fallbackAlert: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginTop: '16px',
    padding: '8px 14px',
    borderRadius: '8px',
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.15)'
  },
  fallbackBadge: {
    background: 'var(--warning)',
    color: '#000',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase'
  },
  fallbackText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)'
  },
  reportMiddleGrid: {
    display: 'flex',
    gap: '24px'
  },
  predictedTopicList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '14px'
  },
  topicRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  topicHeaderInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  topicName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-main)'
  },
  topicPct: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--secondary)'
  },
  trendBadge: {
    fontSize: '0.65rem',
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: '12px'
  },
  keywordTagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px'
  },
  keywordTag: {
    background: 'rgba(6,182,212,0.08)',
    color: '#22d3ee',
    border: '1px solid rgba(6,182,212,0.2)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 500
  },
  adviceCard: {
    display: 'flex',
    gap: '18px',
    background: 'rgba(99,102,241,0.05)',
    borderLeft: '4px solid var(--primary)'
  },
  adviceIcon: {
    fontSize: '1.6rem',
    marginTop: '-2px'
  },
  adviceText: {
    fontSize: '0.92rem',
    color: 'var(--text-main)',
    lineHeight: 1.6,
    marginTop: '6px'
  },
  recommendedList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginTop: '12px'
  },
  recommendedCard: {
    background: 'rgba(10,14,26,0.4)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '12px'
  },
  recommendedCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  recommendedTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    lineHeight: 1.4,
    color: '#fff'
  },
  recommendedCardFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    paddingTop: '8px'
  },
  recommendedTopicName: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  reportedCount: {
    fontSize: '0.72rem',
    color: 'var(--secondary)',
    fontWeight: 500
  },
  filterHub: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  searchBarBox: {
    position: 'relative',
    width: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '16px',
    height: '16px',
    color: 'var(--text-muted)'
  },
  dropdownFiltersGrid: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  questionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  questionListItem: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '240px',
    padding: '20px'
  },
  questionListItem: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '240px',
    padding: '20px'
  },
  questionItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  companyPill: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    color: 'var(--text-main)',
    fontWeight: 600
  },
  questionItemTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    lineHeight: 1.4,
    color: '#fff',
    marginBottom: '8px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  questionItemExcerpt: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
    marginBottom: 'auto',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  questionItemBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    paddingTop: '12px',
    marginTop: '12px'
  },
  tagGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  roleTag: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 500
  },
  topicTag: {
    fontSize: '0.75rem',
    color: '#a5b4fc',
    fontWeight: 500
  },
  freqTag: {
    fontSize: '0.75rem',
    color: 'var(--secondary)',
    fontWeight: 600
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '24px',
    marginTop: '28px'
  },
  paginationText: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: 500
  },
  splitFormsLayout: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start'
  },
  sectionHeading: {
    fontSize: '1.35rem',
    fontFamily: 'var(--font-title)',
    fontWeight: 700,
    marginBottom: '10px'
  },
  successBox: {
    background: 'rgba(16,185,129,0.06)',
    border: '1px solid rgba(16,185,129,0.2)',
    padding: '14px',
    borderRadius: '8px',
    color: 'var(--success)',
    fontSize: '0.85rem'
  },
  scrapedItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '6px'
  },
  scrapedItemTitle: {
    fontSize: '0.8rem',
    color: 'var(--text-main)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '280px'
  },
  errorBox: {
    background: 'rgba(239,68,68,0.06)',
    border: '1px solid rgba(239,68,68,0.2)',
    padding: '12px',
    borderRadius: '8px',
    color: 'var(--danger)',
    fontSize: '0.85rem'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 13, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.25s ease-out'
  },
  modalContent: {
    width: '100%',
    maxWidth: '650px',
    padding: '30px',
    boxShadow: 'var(--shadow-lg)',
    animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px'
  },
  modalCompany: {
    fontSize: '0.9rem',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border-color)',
    padding: '3px 10px',
    borderRadius: '5px'
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '2rem',
    cursor: 'pointer',
    lineHeight: 0.5,
    padding: '4px'
  },
  modalTitle: {
    fontSize: '1.45rem',
    fontFamily: 'var(--font-title)',
    fontWeight: 800,
    lineHeight: 1.3,
    marginBottom: '16px'
  },
  modalMetaInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    background: 'rgba(255,255,255,0.02)',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    marginBottom: '20px'
  },
  modalMetaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  modalMetaLabel: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
    textTransform: 'uppercase'
  },
  modalMetaValue: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-main)'
  },
  modalSeparator: {
    border: 'none',
    borderTop: '1px solid var(--border-color)',
    marginBottom: '20px'
  },
  modalBody: {
    marginBottom: '28px'
  },
  modalText: {
    fontSize: '0.95rem',
    color: 'var(--text-main)',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end'
  }
};

export default App;
