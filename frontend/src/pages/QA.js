import React, { useState, useRef, useEffect } from 'react';
import { processQA, submitFeedback } from '../services/api';

const QA = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: '您好！我是化工知识库助手，请问有什么可以帮助您的吗？',
      time: '刚刚'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('answer');
  const [loading, setLoading] = useState(false);

  const chatMessagesRef = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      type: 'user',
      content: inputValue,
      time: '刚刚'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      const response = await processQA(currentQuestion);
      const botMessage = {
        type: 'bot',
        content: response.answer,
        time: '刚刚',
        sources: response.sources
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error processing QA:', error);
      const errorMessage = {
        type: 'bot',
        content: '抱歉，处理您的问题时出现了错误。请稍后重试。',
        time: '刚刚'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1><i className="fas fa-question-circle"></i> QA测试与反馈 QA Testing & Evaluation</h1>
        <p className="subtitle">测试问答质量、反馈优化建议</p>
      </header>

      <div className="qa-container">
        {/* 左侧：问答输入区 */}
        <div className="qa-input-section">
          <div className="chat-container">
            <div className="chat-header">
              <h3><i className="fas fa-comments"></i> 智能问答</h3>
              <div className="chat-stats">
                <span className="stat-item">
                  <i className="fas fa-clock"></i> 平均响应: --
                </span>
                <span className="stat-item">
                  <i className="fas fa-check-circle"></i> 成功率: --
                </span>
              </div>
            </div>
            
            <div className="chat-messages" ref={chatMessagesRef}>
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  <div className="message-avatar">
                    <i className={`fas fa-${message.type === 'user' ? 'user' : 'robot'}`}></i>
                  </div>
                  <div className="message-content">
                    <p>{message.content}</p>
                    <div className="message-time">{message.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <div className="input-container">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="请输入您的问题..."
                  rows="3"
                />
                <button className="send-btn" onClick={sendMessage}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
              <div className="input-actions">
                <button className="btn-small">
                  <i className="fas fa-microphone"></i> 语音输入
                </button>
                <button className="btn-small">
                  <i className="fas fa-image"></i> 图片识别
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：答案分析区 */}
        <div className="qa-analysis-section">
          <div className="analysis-tabs">
            <button 
              className={`tab-btn ${activeTab === 'answer' ? 'active' : ''}`}
              onClick={() => setActiveTab('answer')}
            >
              答案分析
            </button>
            <button 
              className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
            >
              反馈评分
            </button>
            <button 
              className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
              onClick={() => setActiveTab('sources')}
            >
              来源追踪
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'answer' && (
              <div className="tab-pane active">
                <div className="answer-analysis">
                  <h4><i className="fas fa-lightbulb"></i> 答案组成分析</h4>
                  <div className="answer-sources">
                    <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                      暂无答案分析数据
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="tab-pane active">
                <div className="feedback-section">
                  <h4><i className="fas fa-star"></i> 答案评分</h4>
                  <div className="rating-section">
                    <div className="stars">
                      <i className="far fa-star"></i>
                      <i className="far fa-star"></i>
                      <i className="far fa-star"></i>
                      <i className="far fa-star"></i>
                      <i className="far fa-star"></i>
                    </div>
                    <span className="rating-text">-- / 5.0</span>
                  </div>
                  
                  <div className="satisfaction-question">
                    <h4>是否满意?</h4>
                    <div className="satisfaction-buttons">
                      <button className="btn-satisfaction satisfied">
                        <i className="fas fa-thumbs-up"></i> 满意
                      </button>
                      <button className="btn-satisfaction unsatisfied">
                        <i className="fas fa-thumbs-down"></i> 不满意
                      </button>
                    </div>
                  </div>
                  
                  <div className="feedback-suggestions">
                    <h4>反馈建议</h4>
                    <div className="feedback-form">
                      <textarea placeholder="请提供您的反馈意见..."></textarea>
                    </div>
                  </div>
                  
                  <button className="btn-primary submit-feedback">
                    提交反馈
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="tab-pane active">
                <div className="sources-section">
                  <h4><i className="fas fa-search"></i> 检索内容高亮</h4>
                  <div className="retrieval-highlight">
                    <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                      暂无检索高亮数据
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QA; 