import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faSearch, faBell } from '@fortawesome/free-solid-svg-icons';
import SelectedUserProfile from './SelectedUserProfile';

const Navbar = ({ onLogout, onProfileToggle }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [initials, setInitials] = useState('');
  const [color, setColor] = useState('#6c757d');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const searchResultsRef = useRef(null);
  const selectedUserProfileRef = useRef(null);

  const handleNotificationClick = () => {
    // Hier kannst du den Code einfügen, um Benachrichtigungen anzuzeigen oder zu verarbeiten
    console.log('Benachrichtigungsglocke geklickt');
  };

  

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
      if (
        searchResultsRef.current && !searchResultsRef.current.contains(event.target)
      ) {
        setSearchTerm(''); // Suchfeld zurücksetzen
        setSearchResults([]); // Suchergebnisse zurücksetzen
      }

      if (
        selectedUserProfileRef.current && !selectedUserProfileRef.current.contains(event.target)
      ) {
        setSelectedUser(null); // Profil schließen
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
          <a href="/" className="navbar-logo">MyApp</a>
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
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
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
        <div className="navbar-notification">
          <FontAwesomeIcon icon={faBell} className="navbar-icon" onClick={handleNotificationClick} />
 
        </div>
          <div className="navbar-user">
            {profilePicture ? (
              <img src={profilePicture} alt="User" className="user-avatar" />
            ) : (
              <div className="user-avatar" style={{ backgroundColor: color }}>
                {initials}
              </div>
            )}

            <span className="user-name">{`${firstName} ${lastName}`}</span>
            <div className="dropdown-icon">
              <FontAwesomeIcon icon={faCaretDown} className="navbar-icon" onClick={handleDropdownToggle} />
            </div>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={handleProfileClick}>Profile</div>
                <div className="dropdown-item" onClick={onLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {selectedUser && (
        <SelectedUserProfile 
          user={selectedUser} 
          onClose={handleCloseProfile} 
          onMessageClick={handleMessageClick} // Pass the function here
          ref={selectedUserProfileRef} 
        />
      )}
    </>
  );
};

export default Navbar;
