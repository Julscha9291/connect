import React, { useState, useEffect, useRef } from 'react';
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
  const [notifications, setNotifications] = useState([]);



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

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  const handleSelectChat = (chat) => {
    console.log('handleSelectChat aufgerufen mit chat:', chat); // Überprüfe, welche Daten übergeben werden
    setSelectedChat(chat);
  
    if (window.innerWidth < 768) {
      setIsSidebarVisible(false); // Sidebar schließen, wenn auf kleinem Bildschirm
    }
  };
  
  // Funktion, um über Benachrichtigungen zu einem Chat zu wechseln
  const openChat = async (channelId) => {
    console.log('openChat aufgerufen mit channelId:', channelId); // Überprüfe, ob die Funktion aufgerufen wird
    const chatData = await fetchChatDetails(channelId); // Hole die vollständigen Daten
    console.log('chatData:', chatData); // Überprüfe, welche Daten abgerufen wurden
    
    if (chatData) {
      // Organisiere die Daten im gleichen Format wie bei der Sidebar-Auswahl
      handleSelectChat({
        type: 'channel',  // Setze den Typ auf 'channel'
        data: {
          id: chatData.id,
          name: chatData.name,
          members: chatData.members,
          description: chatData.description,
          is_private: chatData.is_private || false, // Setze is_private oder false
          created_at: chatData.created_at,  // Füge weitere Daten hinzu, falls notwendig
          creator: chatData.creator
        }
      });
    } else {
      console.error('Keine Chat-Daten gefunden');
    }
  };
  
  // API-Aufruf, um die Chat-Daten zu holen
  const fetchChatDetails = async (channelId) => {
    try {
      console.log('fetchChatDetails aufgerufen mit channelId:', channelId); // Überprüfe, ob die Funktion aufgerufen wird
      
      const token = localStorage.getItem('access_token'); // Token aus localStorage abrufen
  
      const response = await fetch(`${process.env.REACT_APP_API_URL}api/channels/${channelId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Token im Header mitsenden
          'Content-Type': 'application/json',
        },
      });
  
      console.log('fetch response:', response); // Überprüfe die Antwort
  
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen des Channels');
      }
  
      const chatData = await response.json();
      console.log('Chat-Daten erfolgreich abgerufen:', chatData); // Überprüfe die abgerufenen Daten
      return chatData;
    } catch (error) {
      console.error('Fehler beim Abrufen der Chat-Daten:', error);
    }
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
              setNotifications={setNotifications} // Hier hinzufügen
              openChat = {openChat}
              
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
                    notifications={notifications}
                    setNotifications={setNotifications} // Hier hinzufügen
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
