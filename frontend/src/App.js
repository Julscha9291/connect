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
  const [unreadCount, setUnreadCount] = useState(0); // Hier hinzufügen
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  

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
            <Navbar
              onLogout={handleLogout}
              onProfileToggle={handleProfileToggle}
              unreadCount={unreadCount} // Hier übergeben
              setUnreadCount={setUnreadCount} // Hier übergeben
            />
            <div className="App-content">
              <button 
                className="toggle-sidebar-button" 
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              >
                {isSidebarVisible ? 'Close menu' : 'open menu'}
              </button>
              {isSidebarVisible && (
                  <Sidebar onAddChannelClick={handleAddChannelClick} onSelectChat={handleSelectChat} />
                )}
                <div className={`chat ${isSidebarVisible ? 'chat-narrow' : 'chat-full-width'}`}>
              {selectedChat && <Chat selectedChat={selectedChat} setUnreadCount={setUnreadCount} onProfileToggle={handleProfileToggle}/>} {/* Hier übergeben */}
              {showAddChannelForm && <AddChannelForm onClose={handleAddChannelClose} />}
              </div>
            </div>
            {showProfile && (
                <>
                  <div className="modal-overlay" onClick={handleProfileClose}></div> {/* Hintergrund abdunkeln */}
                  <div className="modal-content">
                    <Profile onClose={handleProfileClose} />
                  </div>
                </>
              )}
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
