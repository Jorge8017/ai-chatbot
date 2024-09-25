import React, { useState } from 'react';
import MessagingInterface from './components/MessagingInterface';
import ToggleButtonIcon from './components/ToggleButtonIcon';
import './App.css';

function App() {
  const [chatOpen, setChatOpen] = useState(false);

  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  return (
    <div className="App">
      <div 
        className={`toggle-button ${chatOpen ? 'open' : ''}`} 
        onClick={toggleChat}
      >
        <ToggleButtonIcon />
      </div>
      {chatOpen && <MessagingInterface onClose={toggleChat} />}
    </div>
  );
}

export default App;