import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import LoginForm from './components/LoginForm'; 
import Profile from './components/Profile';
import AddChannelForm from './components/AddChannelForm'; 
import Footer from './components/Footer'; 

import './App.css';

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddChannelForm, setShowAddChannelForm] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); 
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setLoggedIn(true);
    }

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarVisible(false); 
      } else {
        setIsSidebarVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); 

    return () => {
      window.removeEventListener('resize', handleResize); 
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

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);

    if (window.innerWidth < 768) {
      setIsSidebarVisible(false); 
    }
  };
  
  const openChat = async (channelId) => {
    const chatData = await fetchChatDetails(channelId); 
    
    if (chatData) {
      handleSelectChat({
        type: 'channel',  
        data: {
          id: chatData.id,
          name: chatData.name,
          members: chatData.members,
          description: chatData.description,
          is_private: chatData.is_private || false, 
          created_at: chatData.created_at,  
          creator: chatData.creator
        }
      });
    } else {
    }
  };
  
  // API-Aufruf, um die Chat-Daten zu holen
  const fetchChatDetails = async (channelId) => {
    try {
      const token = localStorage.getItem('access_token'); 
  
      const response = await fetch(`${process.env.REACT_APP_API_URL}api/channels/${channelId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen des Channels');
      }
  
      const chatData = await response.json();
      return chatData;
    } catch (error) {
    }
  };

  const formatMessage = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
  
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            {part}
          </a>
        );
      }
      return part;
    });
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
              notifications={notifications}
              setNotifications={setNotifications} 
              openChat = {openChat}
              toggleSidebar={toggleSidebar}
              
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
              <div className={`modal-overlay ${isSidebarVisible ? 'active' : ''}`} onClick={toggleSidebar}></div>
  
              <div className={`chat-window ${isSidebarVisible ? 'chat-narrow' : 'chat-full-width'}`}>
                {selectedChat ? (
                  <Chat
                    key={selectedChat.id}
                    selectedChat={selectedChat}
                    setUnreadCount={setUnreadCount}
                    onProfileToggle={handleProfileToggle}
                    notifications={notifications}
                    setNotifications={setNotifications} 
                    formatMessage= {formatMessage}
                  />
                ) : (
                  <div className="no-chat-message">Please select a channel or chat</div>
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
              <Footer></Footer>
      </div>

    </Router>
    
  );
}

export default App;
