import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faComment, faUsers, faPeopleArrows, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ 
      onAddChannelClick, 
      onSelectChat, 
      className }) => {

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
        setSearchTerm(''); 
        setSearchResults([]); 
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
          const response = await fetch(`${process.env.REACT_APP_API_URL}api/users/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
  
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data.map(user => ({
              ...user, 
              is_online: user.is_online 
            })));
          } else {
          }
        } catch (error) {
        }
      };
      fetchUsers();
    }
  }, [searchTerm]);
  
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const channelsResponse = await fetch(`${process.env.REACT_APP_API_URL}api/channels/`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (channelsResponse.ok) {
          const channelsData = await channelsResponse.json();
          setChannels(channelsData);
        } else {
        }
      } catch (error) {
      }
    };

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}api/users/`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
        }
      } catch (error) {
      }
    };
      fetchChannels();
      fetchUsers();
    }, []);

  const getChatPartner = useCallback((chat) => {
    if (!chat || !chat.members) {
      return null;
    }
    
  const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) {
      return null;
  }

  const partnerMember = chat.members.find(member => member.user !== parseInt(currentUserId, 10));
    if (!partnerMember) {
      return null;
  }
    

    const partnerDetails = users.find(user => user.id === partnerMember.user);
    if (!partnerDetails) {
      return null;
    }
    return partnerDetails;
  }, [users]);
  
  useEffect(() => {
    if (selectedChat && selectedChat.type === 'user') {
      const partner = getChatPartner(selectedChat.data);
    }
  }, [selectedChat, getChatPartner]);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMessagesDropdownToggle = () => {
    setIsMessagesDropdownOpen(!isMessagesDropdownOpen); 
  };

  const handleChannelClick = (channel) => {
    setSelectedChat({ type: 'channel', data: channel });
    onSelectChat({ type: 'channel', data: channel });
  };

  const handleUserClick = async (user) => {
    try {
      const user1Id = localStorage.getItem('user_id');
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}api/private_chats/`, {
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
        setUserChats(prevChats => [...prevChats, chat]); 
        setSelectedChat({ type: 'user', data: chat, partner: partner }); 
        onSelectChat({ type: 'user', data: chat, partner: partner });
      } else {
      }
    } catch (error) {
    }
  };
  
  useEffect(() => {
    if (!selectedChat && channels.length > 0) {
      const firstChannel = channels[0];
      setSelectedChat({ type: 'channel', data: firstChannel });
      onSelectChat({ type: 'channel', data: firstChannel });
    }
  }, [channels, selectedChat, onSelectChat]);


  const nonPrivateChannels = channels.filter(channel => channel.is_private === false);
  const privateChannels = channels.filter(channel => channel.is_private === true);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUserSidebarClick = (user) => {
    setSelectedUser(user);
    setSearchTerm(''); 
    setSearchResults([]); 
  };

  return (
    <div className={`sidebar ${className}`}>
      <div className="sidebar-header-top">
          <FontAwesomeIcon 
                icon={faComment} 
                style={{ 
                  marginRight: '10px', 
                  fontSize: '30px',   
                  color: '#19dae5'    
                }} 
              />
            <h2 className='sidebar-h2'>TeamSpace</h2>
            </div>
            <hr style={{ 
              width: '90%',        
              border: '1px solid #fff',  
              marginTop: '10px'  
            }} />

        <div className="search-sidebar">
            <input
              type="text"
              placeholder="Search for user..."
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
                      fontSize: '20px',   
                      color: '#fff'    
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
                        fontSize: '20px',  
                        color: '#fff'    
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
