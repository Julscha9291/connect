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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // Standardmäßig verborgen

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setLoggedIn(true);
    }

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarVisible(false); // Sidebar standardmäßig schließen bei kleinen Bildschirmen
      } else {
        setIsSidebarVisible(true); // Sidebar öffnen bei größeren Bildschirmen
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initiale Überprüfung der Fenstergröße

    return () => {
      window.removeEventListener('resize', handleResize); // Aufräumen des Event Listeners
    };
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
    if (window.innerWidth < 768) {
      setIsSidebarVisible(false); // Sidebar schließen, wenn auf kleinem Bildschirm
    }
  };

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
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
              unreadCount={unreadCount}
              setUnreadCount={setUnreadCount}
            />
            <div className="App-content">
              <button 
                className="toggle-sidebar-button" 
                onClick={toggleSidebar}
              >
                {isSidebarVisible ? 'Close menu' : 'Open menu'}
              </button>
  
              <Sidebar 
                className={isSidebarVisible ? '' : 'hidden'} 
                onAddChannelClick={handleAddChannelClick} 
                onSelectChat={handleSelectChat} 
              />
  
              {/* Dunkle Überlagerung */}
              <div className={`modal-overlay ${isSidebarVisible ? 'active' : ''}`} onClick={toggleSidebar}></div>
  
              <div className={`chat-window ${isSidebarVisible ? 'chat-narrow' : 'chat-full-width'}`}>
                {selectedChat ? (
                  <Chat
                    key={selectedChat.id}
                    selectedChat={selectedChat}
                    setUnreadCount={setUnreadCount}
                    onProfileToggle={handleProfileToggle}
                  />
                ) : (
                  <div className="no-chat-message">Bitte wähle einen Chat aus.</div>
                )}
              </div>
  
              {showAddChannelForm && <AddChannelForm onClose={handleAddChannelClose} />}
            </div>
  
            {showProfile && (
              <>
                <div className="modal-overlay" onClick={handleProfileClose}></div>
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
