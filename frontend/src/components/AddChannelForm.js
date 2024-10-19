import React, { useState, useEffect } from 'react';
import './AddChannelForm.css';


const AddChannelForm = ({ onClose }) => {
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(true); // Standardmäßig alle Nutzer auswählen


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setAllUsers(data);
          setFilteredUsers(data);
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
      setFilteredUsers(allUsers.filter(user =>
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredUsers(allUsers);
    }
  }, [searchTerm, allUsers]);

  const handleNameChange = (e) => {
    setChannelName(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setChannelDescription(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUserSelect = (userId) => {
    setSelectedUserIds(prevIds =>
      prevIds.includes(userId) ? prevIds.filter(id => id !== userId) : [...prevIds, userId]
    );
  };

  const handleSelectAllChange = () => {
    console.log('Select All Before:', selectAll);
    if (selectAll) {
        setSelectedUserIds([]);
        console.log('Deselecting all users');
    } else {
        const allSelectedIds = allUsers.map(user => user.id);
        setSelectedUserIds(allSelectedIds);
        console.log('Selecting all users:', allSelectedIds);
    }
    setSelectAll(!selectAll);
    console.log('Select All After:', !selectAll);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/channels/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ 
          name: `#${channelName}`, // Prefix with #
          description: channelDescription,
          members: selectedUserIds // IDs der ausgewählten Benutzer
        }),
      });

      if (response.ok) {
        console.log('Channel added');
        setChannelName('');
        setChannelDescription('');
        setSelectedUserIds([]); // Zurücksetzen der ausgewählten Benutzer
        setSelectAll(false); // Zurücksetzen der Auswahl aller
        onClose(); // Schließt das Formular nach dem erfolgreichen Hinzufügen
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error('Fehler beim Erstellen des Channels:', errorData);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels:', error);
    }
  };

  return (
    <div className="add-channel-form-overlay">
      <div className="add-channel-form">
      <div className="add-channel-header">
        <button className="close-button" onClick={onClose}>×</button>
        <h3>New Channel</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              type="text"
              value={channelName}
              onChange={handleNameChange}
              placeholder="Channel Name"
              required
              className="channel-name-input"
            />
          </div>
          <input
            type="text"
            value={channelDescription}
            onChange={handleDescriptionChange}
            placeholder="Description"
            required
          />
          <div className="user-selection">
          <div className="user-selection-all">
            <label>
              <input
                type="radio"
                checked={selectAll}
                onChange={handleSelectAllChange}
              />
              Select All Users
            </label>
            </div>
            <div className="user-selection-all">
            <label>
              <input
                type="radio"
                checked={!selectAll}
                onChange={() => setSelectAll(false)}
              />
              Select Specific Users
            </label>
            </div>

            {!selectAll && (
              <>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search users"
                />
                <ul className="user-list">
                  {filteredUsers.map(user => (
                    <li 
                      key={user.id} 
                      className={`user-item-channel ${selectedUserIds.includes(user.id) ? 'selected' : ''}`}
                      onClick={() => handleUserSelect(user.id)}
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
                    </li>
                  ))}
                </ul>
                <div className="selected-users">
                  <h4>Selected Users:</h4>
                  <ul>
                    {allUsers.filter(user => selectedUserIds.includes(user.id)).map(user => (
                      <li key={user.id}>{user.first_name} {user.last_name}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
     
          <div className="button-class"> 
          <button className="leave-channel-button" type="submit">Add Channel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChannelForm;
