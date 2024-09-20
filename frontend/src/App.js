import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import LoginForm from './components/LoginForm'; 
import Profile from './components/Profile';
import AddChannelForm from './components/AddChannelForm'; 
import './App.css';

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddChannelForm, setShowAddChannelForm] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setLoggedIn(true);
    }
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('access_token', token);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setLoggedIn(false);
    window.location.href = '/login';
  };

  const handleProfileToggle = () => {
    setShowProfile(!showProfile);
  };

  const handleProfileClose = () => {
    setShowProfile(false);
  };

  const handleAddChannelClick = () => {
    setShowAddChannelForm(true);
  };

  const handleAddChannelClose = () => {
    setShowAddChannelForm(false);
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  return (
    <Router>
      <div className="app-container">
        {!loggedIn ? (
          <LoginForm onLogin={handleLogin} />
        ) : (
          <>
            <Navbar onLogout={handleLogout} onProfileToggle={handleProfileToggle} />
            <div className="App-content">
              <Sidebar onAddChannelClick={handleAddChannelClick} onSelectChat={handleSelectChat} />
              {selectedChat && <Chat selectedChat={selectedChat} />}
              {showAddChannelForm && <AddChannelForm onClose={handleAddChannelClose} />}
            </div>
            {showProfile && <Profile onClose={handleProfileClose} />}
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
