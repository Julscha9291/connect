import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faComment, faUsers, faPeopleArrows, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ onAddChannelClick, onSelectChat, className }) => {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [userChats, setUserChats] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMessagesDropdownOpen, setIsMessagesDropdownOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchResultsRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        setSearchTerm(''); // Suchfeld zurücksetzen
        setSearchResults([]); // Suchergebnisse zurücksetzen
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setSearchResults(prevResults =>
        prevResults.filter(user =>
          user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch('http://localhost:8000/api/users/', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
  
          if (response.ok) {
            const data = await response.json();
            
            // Die Daten enthalten jetzt auch den Online-Status der Benutzer
            setSearchResults(data.map(user => ({
              ...user, 
              is_online: user.is_online // Online-Status speichern
            })));
          } else {
            console.error('Fehler beim Abrufen der Benutzer:', response.status);
          }
        } catch (error) {
          console.error('Fehler beim Abrufen der Benutzer:', error);
        }
      };
  
      fetchUsers();
    }
  }, [searchTerm]);
  


  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const channelsResponse = await fetch('http://localhost:8000/api/channels/', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (channelsResponse.ok) {
          const channelsData = await channelsResponse.json();
          setChannels(channelsData);
          console.log('Channels fetched:', channelsData);
        } else {
          console.error('Failed to fetch channels:', channelsResponse.status);
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
      }
    };



    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/users/', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          console.log('Users fetched:', data);
        } else {
          console.error('Fehler beim Abrufen der Benutzer:', response.status);
        }
      } catch (error) {
        console.error('Fehler beim Abrufen der Benutzer:', error);
      }
    };

    fetchChannels();
    fetchUsers();
  }, []);

  const getChatPartner = useCallback((chat) => {
    if (!chat || !chat.members) {
      console.error('Chat or chat members are undefined');
      return null;
    }
    
    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) {
      console.error('Current user ID is not set');
      return null;
    }


  
    
    // Find the member who is not the current user
    const partnerMember = chat.members.find(member => member.user !== parseInt(currentUserId, 10));
    if (!partnerMember) {
      console.error('No partner found for chat:', chat);
      return null;
    }
    
    // Find the partner user details from the users list
    const partnerDetails = users.find(user => user.id === partnerMember.user);
    if (!partnerDetails) {
      console.error('Partner details not found:', partnerMember);
      return null;
    }
  
    return partnerDetails;
  }, [users]);
  
  useEffect(() => {
    if (selectedChat && selectedChat.type === 'user') {
      const partner = getChatPartner(selectedChat.data);
      console.log('Setting selected user:', partner); // Debugging-Ausgabe
      // Set the selected user profile or handle as needed
    }
  }, [selectedChat, getChatPartner]);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMessagesDropdownToggle = () => {
    setIsMessagesDropdownOpen(!isMessagesDropdownOpen); // Toggle für Messages
  };

  const handleChannelClick = (channel) => {
    setSelectedChat({ type: 'channel', data: channel });
    onSelectChat({ type: 'channel', data: channel });
  };

  const handleUserClick = async (user) => {
    console.log('Handling user click for user:', user);
    try {
      const user1Id = localStorage.getItem('user_id');
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/private_chats/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user1_id: user1Id, user2_id: user.id }),
      });
  
      if (response.ok) {
        const chat = await response.json();
        
        const partner = users.find(u => u.id === user.id);
        setUserChats(prevChats => [...prevChats, chat]); // Add new chat
        setSelectedChat({ type: 'user', data: chat, partner: partner }); // Set the partner details
        onSelectChat({ type: 'user', data: chat, partner: partner });
        console.log('User chat created and selected:', chat);
      } else {
        console.error('Error creating private chat:', response.status);
      }
    } catch (error) {
      console.error('Error creating private chat:', error);
    }
  };
  
  // Automatische Auswahl des ersten Kanals oder Chats
  useEffect(() => {
    if (!selectedChat && channels.length > 0) {
      // Wähle den ersten öffentlichen Kanal, wenn kein Chat ausgewählt ist
      const firstChannel = channels[0];
      setSelectedChat({ type: 'channel', data: firstChannel });
      onSelectChat({ type: 'channel', data: firstChannel });
    }
  }, [channels, selectedChat, onSelectChat]);

  
  // Split channels into two groups: non-private and private
  const nonPrivateChannels = channels.filter(channel => channel.is_private === false);
  const privateChannels = channels.filter(channel => channel.is_private === true);

  const getRandomStatusColor = () => {
    return Math.random() < 0.5 ? 'online' : 'offline'; // 50% Chance für jede Farbe
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUserSidebarClick = (user) => {
    setSelectedUser(user);
    setSearchTerm(''); // Suchfeld zurücksetzen
    setSearchResults([]); // Suchergebnisse zurücksetzen
  };

  return (
    <div className={`sidebar ${className}`}>
      <div className="sidebar-header-top">

      <FontAwesomeIcon 
            icon={faComment} 
            style={{ 
              marginRight: '10px', 
              fontSize: '30px',   // Größe auf 30px setzen
              color: '#19dae5'    // Farbe auf Weiß ändern
            }} 
          />
        <h2 className='sidebar-h2'>TeamSpace</h2>
        </div>
        <hr style={{ 
          width: '90%',        // 90% Breite
          border: '1px solid #fff',  // Weiße Linie
          marginTop: '10px'  // Zentrieren und Abstand oben/unten
        }} />

<div className="search-sidebar">
            <input
              type="text"
              placeholder="Suche nach Benutzern..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            <FontAwesomeIcon 
              icon={faMagnifyingGlass} 
              style={{ color: '#fff', marginLeft: '10px' }} 
            />

            {searchTerm && searchResults.length > 0 && (
              <div className="search-results-nav" ref={searchResultsRef}>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="search-result-item"
                    onClick={() => handleUserSidebarClick(user)}
                  >
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={`${user.first_name} ${user.last_name}`}
                        className="user-profile-image"
                      />
                    ) : (
                      <div
                        className="user-profile-placeholder"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                      </div>
                    )}
                    <span className="user-name">{user.first_name} {user.last_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

      <div className="sidebar-header">
      <div className="sidebar-left">
        
    <div className="dropdown-icon">
      <FontAwesomeIcon icon={faCaretDown} className="navbar-icon" onClick={handleDropdownToggle} />
    </div>

      <FontAwesomeIcon 
            icon={faUsers} 
            style={{ 
              marginRight: '10px', 
              marginLeft: '10px', 
              fontSize: '20px',   // Größe auf 30px setzen
              color: '#fff'    // Farbe auf Weiß ändern
            }} 
          />



      <h3 className='sidebar-h3'>Channels</h3>
      </div>

      <div className="sidebar-right">
        <button className="add-channel-button" onClick={onAddChannelClick}>+</button>
      </div>
      </div>

      {isDropdownOpen && (
        <ul className="sidebar-menu">
          {nonPrivateChannels.map((channel) => (
            <li 
              key={channel.id} 
              className={`sidebar-item ${selectedChat?.type === 'channel' && selectedChat.data.id === channel.id ? 'selected' : ''}`}
            >
              <button 
                onClick={() => handleChannelClick(channel)} 
                className="channel-button"
              >
                {channel.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="contacts">
        <ul className="user-list">
          {userChats.map(chat => {
            const partner = getChatPartner(chat);
            return (
              partner && (
                <li 
                  key={chat.id} 
                  className={`user-item ${selectedChat?.type === 'user' && selectedChat.data.id === partner.id ? 'selected' : ''}`}
                  onClick={() => handleUserClick(partner)}
                >
                  {partner.profile_picture ? (
                    <img
                      src={partner.profile_picture}
                      alt={`${partner.first_name} ${partner.last_name}`}
                      className="user-profile-image"
                    />
                  ) : (
                    <div
                      className="user-profile-placeholder"
                      style={{ backgroundColor: partner.color }}
                    >
                      {`${partner.first_name.charAt(0)}${partner.last_name.charAt(0)}`.toUpperCase()}
                    </div>
                  )}
                  <span className={`status-indicator ${partner.is_online ? 'online' : 'offline'}`}></span>
                  <span className="user-name">{partner.first_name} {partner.last_name}</span>
                </li>
              )
            );
          })}
        </ul>




        <div className="sidebar-message-top">
        <div className="dropdown-icon">
            <FontAwesomeIcon icon={faCaretDown} className="navbar-icon" onClick={handleMessagesDropdownToggle} />
          </div>


        <FontAwesomeIcon 
            icon={faPeopleArrows} 
            style={{ 
              marginRight: '10px', 
              marginLeft: '10px', 
              fontSize: '20px',   // Größe auf 30px setzen
              color: '#fff'    // Farbe auf Weiß ändern
            }} 
          />
        <h3 className='sidebar-h3'>Messages</h3>
        </div>

        {isMessagesDropdownOpen && (
        <ul className="sidebar-menu">
          {privateChannels.map((channel) => {
            const partner = getChatPartner(channel);
            return (
              <li 
                key={channel.id} 
                className={`sidebar-item ${selectedChat?.type === 'channel' && selectedChat.data.id === channel.id ? 'selected' : ''}`}
              >
                <button 
                  onClick={() => handleChannelClick(channel)} 
                  className="channel-button"
                >
                  
{partner ? (
  <div className="channel-user-info">
    {partner.profile_picture ? (
      <div className="user-profile-container">
        <img
          src={partner.profile_picture}
          alt={`${partner.first_name} ${partner.last_name}`}
          className="user-profile-image"
        />
{partner.is_online ? (
  <span className="status-indicator online"></span>
) : (
  <span className="status-indicator offline"></span>
)}
      </div>
    ) : (
      <div className="user-profile-container">
        <div
          className="user-profile-placeholder"
          style={{ backgroundColor: partner.color }}
        >
          {partner.first_name.charAt(0)}{partner.last_name.charAt(0)}
        </div>
        {partner.is_online ? (
  <span className="status-indicator online"></span>
) : (
  <span className="status-indicator offline"></span>
)}
      </div>
    )}
    <span className="partner-name">{partner.first_name} {partner.last_name}</span>
  </div>
) : (
  <span>Loading...</span>
)}
                </button>
              </li>
            );
          })}
        </ul>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
