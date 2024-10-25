import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faMagnifyingGlass, faBell,faUser, faSignOutAlt, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import SelectedUserProfile from './SelectedUserProfile';
import { Link } from 'react-router-dom';


const Navbar = ({ 
        onLogout, 
        onProfileToggle, 
        unreadCount, 
        setUnreadCount,  
        notifications, 
        openChat, 
        toggleSidebar, 
        isSidebarVisible }) => {

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [initials, setInitials] = useState('');
  const [color, setColor] = useState('#6c757d');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const notificationDropdownRef = useRef(null);
  const [channelNames, setChannelNames] = useState({});
  const [userMap, setUserMap] = useState({});
  const searchResultsRef = useRef(null);
  const selectedUserProfileRef = useRef(null);
  const dropdownRef = useRef(null); 
  const notificationList = Array.isArray(notifications) ? notifications : [notifications];

  const fetchUsers = async () => {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}api/users/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const userMapping = data.reduce((acc, user) => {
                acc[user.id] = user.first_name; 
                return acc;
            }, {});
            setUserMap(userMapping); 
        } else {
        }
    } catch (error) {
    }
};
  
const handleNotificationClick = () => {
  setNotificationDropdownOpen(prevState => !prevState);
  setUnreadCount(0); 
  
  const notificationsWithNames = notifications.map(notification => ({
      ...notification,
      senderName: userMap[notification.sender], 
  }));
};

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
        if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
            setNotificationDropdownOpen(false);
        }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  useEffect(() => {
  }, [unreadCount]);

  useEffect(() => {
    const storedFirstName = localStorage.getItem('first_name') || '';
    const storedLastName = localStorage.getItem('last_name') || '';
    const storedProfilePicture = localStorage.getItem('profile_picture');
    const storedColor = localStorage.getItem('color') || '#6c757d';

    setFirstName(storedFirstName);
    setLastName(storedLastName);
    setColor(storedColor);

    const firstInitial = storedFirstName.charAt(0).toUpperCase();
    const lastInitial = storedLastName.charAt(0).toUpperCase();
    setInitials(`${firstInitial}${lastInitial}`);

    if (storedProfilePicture && storedProfilePicture !== 'null') {
      setProfilePicture(`${process.env.REACT_APP_API_URL}${storedProfilePicture}`);
    }
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}api/users/`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        } else {
        }
      } catch (error) {
      }
    };

    fetchUsers();
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
            setSearchResults(data);
          } else {
          }
        } catch (error) {
        }
      };
      fetchUsers();
    }
  }, [searchTerm]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        setSearchTerm(''); 
        setSearchResults([]); 
      }
      if (selectedUserProfileRef.current && !selectedUserProfileRef.current.contains(event.target)) {
        setSelectedUser(null); 
      }

      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const fetchChannelName = async (channelId) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${process.env.REACT_APP_API_URL}api/channels/${channelId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.name;
  };
  

  useEffect(() => {
    const fetchChannelNames = async () => {
      const newChannelNames = {};
      for (const notification of notificationList) {
        if (notification.channel_id && !channelNames[notification.channel_id]) {
          const channelName = await fetchChannelName(notification.channel_id);
          newChannelNames[notification.channel_id] = channelName;
        }
      }
      setChannelNames(prevNames => ({ ...prevNames, ...newChannelNames }));
    };
    
    fetchChannelNames();
  }, [notifications]);


  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    onProfileToggle();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setSearchTerm(''); 
    setSearchResults([]); 
  };

  const handleCloseProfile = () => {
    setSelectedUser(null);
  };

  const handleMessageClick = (user) => {
    console.log('Message click for user:', user);
  };

  const getReactionEmoji = (reactionType) => {
    switch (reactionType) {
      case 'angry':
        return <span aria-label="angry" role="img">😡</span>;
      case 'sad':
        return <span aria-label="sad" role="img">😢</span>;
      case 'wow':
        return <span aria-label="wow" role="img">😮</span>;
      case 'haha':
        return <span aria-label="haha" role="img">😂</span>;
      case 'love':
        return <span aria-label="love" role="img">❤️</span>;
      case 'like':
        return <span aria-label="like" role="img">👍</span>;
      default:
        return null; 
    }
  };
  
  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="media-logo">
            <img src="https://connect.julianschaepermeier.com/static/connect_logo.png" alt="connect-Logo" className="connect-logo" />
          </Link>
        </div>

        <div className="navbar-center">
          <div className="search-container">
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
                    onClick={() => handleUserClick(user)}
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

          {selectedUser && (
                        <SelectedUserProfile 
                        user={selectedUser} 
                        onClose={handleCloseProfile} 
                        onMessageClick={handleMessageClick} 
                        ref={selectedUserProfileRef} 
                      />
          )}

          </div>
        </div>

        <div className="navbar-right">
          <div className="notification-bell" onClick={handleNotificationClick}>
            <FontAwesomeIcon 
              icon={faBell} 
              style={{ fontSize: '24px' }} 
            />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            {notificationDropdownOpen && (
            <div ref={notificationDropdownRef} className="notification-dropdown">
              <div 
              className="dropdown-arrow" 
              style={{ right: unreadCount > 0 ? '40px' : '20px' }} 
            ></div>
              {notificationList.length > 0 ? (
                      notificationList.map((notification, index) => (
                        <div key={index} className="notification-item">
                          <div className="notification-content">
                            <div className="notification-details">
                              {notification.channel_id ? (
                                <>
                                  <span style={{ fontWeight: 'bold' }}>{notification.sender}{' '}</span> 
                                  sent a message in {channelNames[notification.channel_id]?.startsWith("#priv_") ? 
                                    'a private chat' : 
                                    <>
                                      the chat{' '}
                                      <span style={{ fontWeight: 'bold' }}>
                                        {channelNames[notification.channel_id] || notification.channel_id}
                                      </span>
                                    </>
                                  }.
                                </>
                              ) : (
                                <>
                                    <span style={{ fontWeight: 'bold' }}>{userMap[notification.sender]}{` `}</span> 
                                    sent a reaction:{getReactionEmoji(notification.reactionType)}{/* Emoji hier */}
                                  </>
                                )}
                          </div>
                        </div>
                          <div className="button">
                            {notification.channel_id && ( 
                              <button 
                                type="button" 
                                className="create-button" 
                                onClick={() => openChat(notification.channel_id)}  
                              >
                                Show chat
                              </button>
                            )}
                          </div>
                      </div>
                  ))
                ) : (
       <div className="no-notifications">No notifications</div>
        )}
      </div>
        )}
    </div>

     <div className="navbar-user" ref={dropdownRef}> 
            {profilePicture ? (
              <img src={profilePicture} alt="User" className="user-avatar" />
            ) : (
              <div className="user-avatar" style={{ backgroundColor: color }}>
                {initials}
              </div>
            )}
              <span className="user-name-big" style={{ color: 'white' }}>
                {`${firstName} ${lastName}`}
              </span>

            <div className="dropdown-icon">
                  <FontAwesomeIcon icon={faCaretDown} className="navbar-icon" onClick={handleDropdownToggle} />
            </div>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={handleProfileClick}>
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: '10px' }} />
                    Profile
                  </div>
                  <div className="dropdown-item" onClick={onLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: '10px' }} />
                    Logout
                  </div>
                </div>
              )}

              <button 
                className="toggle-sidebar-navbar" 
                onClick={toggleSidebar}
              >
                <FontAwesomeIcon icon={isSidebarVisible ? faTimes : faBars} />
              </button>
          </div>
        </div>
      </nav>


      {selectedUser && (
        <div className="" onClick={handleCloseProfile}>
          <div className="" onClick={(e) => e.stopPropagation()}>
            <SelectedUserProfile 
              user={selectedUser} 
              onClose={handleCloseProfile} 
              onMessageClick={handleMessageClick} 
              ref={selectedUserProfileRef} 
            />
          </div>
        </div>
      )}
          </>
        );
      };

export default Navbar;
