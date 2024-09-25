import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, getConversationHistory, saveConversationHistory } from '../api/openaiService';
import './MessagingInterface.css';
import newSendIcon from '../assets/newSendIcon.svg';
import loadingIcon from '../assets/loading.svg';
import dropdownIcon from '../assets/dropdown-icon.svg';
import threeDotIcon from '../assets/three-dot-icon.svg';
import emailIcon from '../assets/email-icon.svg';
import FAQTags from './FAQTags';

const MessagingInterface = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await getConversationHistory();
      if (history.length > 0) {
        setMessages(history);
      } else {
        showWelcomeMessage();
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      saveConversationHistory(messages);
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showWelcomeMessage = () => {
    const lastVisit = localStorage.getItem('lastVisit');
    const now = new Date().getTime();
    const oneHour = 60 * 60 * 1000;

    let welcomeMessage;
    if (!lastVisit || now - parseInt(lastVisit) > oneHour) {
      welcomeMessage = !lastVisit
        ? "Welcome to Daddy's Deals! How can I assist you today?"
        : "Welcome back to Daddy's Deals! What can I help you with?";
    } else {
      welcomeMessage = "Hello again! How can I help you?";
    }
    
    setMessages([{ role: 'assistant', content: welcomeMessage }]);
    localStorage.setItem('lastVisit', now.toString());
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(input, messages);
      setMessages(prevMessages => [...prevMessages, response]);
      setError(null);
    } catch (error) {
      console.error('Error sending message:', error.message);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    saveConversationHistory([]);
    setIsMenuOpen(false);
    showWelcomeMessage();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleTagClick = (tag) => {
    setInput(tag);
    handleSend();
  };

  const handleDealClick = (deal) => {
    const dealUrl = `https://daddysdeals.co.za/product/?p=${deal.id}/`;
    window.open(dealUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEmailIconClick = (e, deal) => {
    e.stopPropagation();
    setSelectedDeal(deal);
    setShowEmailForm(true);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDeal || !userEmail) {
      setError('Please select a deal and enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/send-deal-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          deal: selectedDeal,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: `Great! The deal has been sent to ${userEmail}. Check your inbox!` }
      ]);
      setSelectedDeal(null);
      setUserEmail('');
      setShowEmailForm(false);
    } catch (error) {
      console.error('Error sending email:', error);
      setError(`Failed to send email: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (msg, index) => {
    if (msg.type === 'deals') {
      return (
        <div key={index} className="message bot">
          <span>{msg.content}</span>
          <div className="deal-suggestions">
            {msg.deals && msg.deals.length > 0 ? (
              msg.deals.map((deal, dealIndex) => (
                <div 
                  key={dealIndex} 
                  className="deal" 
                  onClick={() => handleDealClick(deal)}
                >
                  <img 
                    src={deal.images && deal.images.length > 0 ? deal.images[0].src : 'placeholder-image-url'} 
                    alt={deal.name || 'Deal image'} 
                  />
                  <div className="deal-info">
                    <h4>{deal.name || 'Unnamed deal'}</h4>
                    <div className="deal-prices">
                      <span className="price">R{deal.sale_price || deal.regular_price || 'N/A'}</span>
                      {deal.sale_price && <span className="old-price">R{deal.regular_price}</span>}
                    </div>
                  </div>
                  <button className="email-icon" onClick={(e) => handleEmailIconClick(e, deal)}>
                    <img src={emailIcon} alt="Email this deal" />
                  </button>
                </div>
              ))
            ) : (
              <p>No deals available at the moment.</p>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div key={index} className={`message ${msg.role}`}>
          <span>{msg.content}</span>
        </div>
      );
    }
  };

  return (
    <div className="messaging-interface">
      <div className="header">
        <img src="https://daddysdeals.co.za/wp-content/uploads/2024/01/final_logo-2.png" alt="Daddy's Deals Logo" />
        <div className="header-buttons" ref={menuRef}>
          <button className="menu-btn" onClick={toggleMenu}>
            <img src={threeDotIcon} alt="Menu" className="three-dot-icon" />
          </button>
          {isMenuOpen && (
            <div className="menu-dropdown">
              <button onClick={handleClearHistory}>Clear History</button>
            </div>
          )}
          <button className="close-btn" onClick={onClose}>
            <img src={dropdownIcon} alt="Close" className="dropdown-icon" />
          </button>
        </div>
      </div>
      <div className="messages">
        {messages.map((msg, index) => renderMessage(msg, index))}
        {isLoading && (
          <div className="message bot loading">
            <img src={loadingIcon} alt="Loading..." className="loading-icon" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      {showEmailForm && (
        <form className="email-form" onSubmit={handleEmailSubmit}>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Deal'}
          </button>
          <button type="button" onClick={() => setShowEmailForm(false)}>Cancel</button>
        </form>
      )}
      <FAQTags onTagClick={handleTagClick} />
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
        />
        <button onClick={handleSend} disabled={isLoading}>
          <img src={newSendIcon} alt="Send" />
        </button>
      </div>
    </div>
  );
};

export default MessagingInterface;