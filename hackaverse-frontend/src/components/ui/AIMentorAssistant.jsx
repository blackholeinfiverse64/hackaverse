import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';

const AIMentorAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: 'Hello! I\'m HackaAgent, your AI assistant for the Hackaverse platform. I can help you with:\n\n• Coding questions and debugging\n• Project ideas and planning\n• Hackathon strategies\n• Technical guidance\n• Best practices\n\nWhat would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call the backend API for AI response
      const response = await apiService.post('/agent/', {
        message: inputMessage
      });

      const aiMessage = {
        type: 'ai',
        content: response.data.response || 'I\'m sorry, I couldn\'t process your request right now. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please check your connection and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      <div
        className="fixed z-50"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 50
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-violet to-cyan flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all duration-300 group animate-pulse"
        >
          <i className="uil uil-robot text-2xl group-hover:animate-bounce"></i>
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="glass-card rounded-2xl border shadow-2xl animate-slideIn flex flex-col"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '400px',
            maxWidth: '90vw',
            maxHeight: '600px',
            zIndex: 50,
            // Prevent browser from moving the chat window on input focus
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
            // Ensure the chat window stays in viewport
            contain: 'layout style paint'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-violet to-cyan rounded-full flex items-center justify-center">
                <i className="uil uil-robot text-white text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold text-white">HackaAgent</h3>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs text-success">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-muted hover:text-white transition-colors"
            >
              <i className="uil uil-times"></i>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'ai' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-violet to-cyan rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="uil uil-robot text-white text-xs"></i>
                  </div>
                )}

                <div className={`max-w-[75%] ${msg.type === 'user' ? 'order-first' : ''}`}>
                  <div className={`p-3 rounded-xl text-sm ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-cyan to-violet text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                  <div className={`text-xs text-text-muted mt-1 ${
                    msg.type === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>

                {msg.type === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan to-violet rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="uil uil-user text-white text-xs"></i>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-violet to-cyan rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="uil uil-robot text-white text-xs"></i>
                </div>
                <div className="bg-white/10 border border-white/20 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-cyan rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-text-muted text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10 chat-input-container" style={{ flexShrink: 0 }}>
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="form-control flex-1 text-sm resize-none min-h-[40px] max-h-20"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="btn-primary w-11 h-11 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="uil uil-message"></i>
              </button>
            </div>
            <div className="text-xs text-text-muted mt-2">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIMentorAssistant;