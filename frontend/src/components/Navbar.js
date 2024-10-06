import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faMagnifyingGlass, faBell,faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import SelectedUserProfile from './SelectedUserProfile';
import { Link } from 'react-router-dom';


const Navbar = ({ onLogout, onProfileToggle, unreadCount, setUnreadCount }) => {
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
  const [notifications, setNotifications] = useState([]);

  const searchResultsRef = useRef(null);
  const selectedUserProfileRef = useRef(null);
  const dropdownRef = useRef(null); // Referenz für das Dropdown-Menü

  const handleNotificationClick = () => {
    setNotificationDropdownOpen(prevState => !prevState);
    console.log(unreadCount);
    console.log('Benachrichtigungsglocke geklickt');
    setUnreadCount(0); // Setzt den Zähler zurück
  };

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
    console.log('Aktueller ungelesener Zähler:', unreadCount);
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
      setProfilePicture(`http://localhost:8000${storedProfilePicture}`);
    }
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/users/', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        } else {
          console.error('Fehler beim Abrufen der Benutzer:', response.status);
        }
      } catch (error) {
        console.error('Fehler beim Abrufen der Benutzer:', error);
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
          const response = await fetch('http://localhost:8000/api/users/', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            setSearchResults(data);
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
    const handleClickOutside = (event) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        setSearchTerm(''); // Suchfeld zurücksetzen
        setSearchResults([]); // Suchergebnisse zurücksetzen
      }

      if (selectedUserProfileRef.current && !selectedUserProfileRef.current.contains(event.target)) {
        setSelectedUser(null); // Profil schließen
      }

      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false); // Dropdown schließen, wenn außerhalb geklickt wird
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setSearchTerm(''); // Suchfeld zurücksetzen
    setSearchResults([]); // Suchergebnisse zurücksetzen
  };

  const handleCloseProfile = () => {
    setSelectedUser(null);
  };

  const handleMessageClick = (user) => {
    // Handle message click action here
    console.log('Message click for user:', user);
    // Example: open a new chat with the user
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="media-logo">
            <img src="/images/connect_logo.png" alt="connect-Logo" className="connect-logo" />
          </Link>
          <h2 className="connect-title">.connect</h2>
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
          </div>
        </div>



        <div className="navbar-right">
          <div className="notification-bell" onClick={handleNotificationClick}>
            <FontAwesomeIcon 
              icon={faBell} 
              style={{ fontSize: '24px' }} // Ändere '24px' auf die gewünschte Größe
            />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            {notificationDropdownOpen && (
                            <div ref={notificationDropdownRef} className="notification-dropdown">
                                <div className="dropdown-arrow"></div>
                   
                                               <div className="notification-item">
                                                <div className="notification-content">

                                                    {/* Initialen des Kontakts links */}
                                                    <div className="contact-initials-board">
                                         
                                                    </div>
                                                    {/* Task-Details rechts */}
                                                    <div>
                                                        
                                                    </div>
                                                </div>
                                      
                                            </div>
                  
                                

                                

                                <div className="button">
                                    <button type="submit" className="create-button">View tasks</button>
                                </div>
                            </div>
                        )}
          </div>












          
          <div className="navbar-user" ref={dropdownRef}> {/* Hier wird die Dropdown-Referenz hinzugefügt */}
            {profilePicture ? (
              <img src={profilePicture} alt="User" className="user-avatar" />
            ) : (
              <div className="user-avatar" style={{ backgroundColor: color }}>
                {initials}
              </div>
            )}

            <span className="user-name" style={{ color: 'white' }}>
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


          </div>
        </div>
      </nav>

      {selectedUser && (
  <div className="modal-overlay" onClick={handleCloseProfile}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
