import React, { useCallback, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import './AddUserToChannel.css';
import axios from 'axios';

const AddUserToChannel = ({ 
  channelId, 
  closeModal, 
  addUserToChannel, 
  channelName, 
  channelDescription 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const usersResponse = await axios.get(`${process.env.REACT_APP_API_URL}api/users/`, config);
      const allUsers = usersResponse.data;

      const channelResponse = await axios.get(`${process.env.REACT_APP_API_URL}api/channels/${channelId}/`, config);
      const channelData = channelResponse.data;
      const channelMembers = channelData.members;

      const nonMembers = allUsers.filter(user => {
        return !channelMembers.some(member => member.user === user.id); 
      });

      setUsers(nonMembers);
      setFilteredUsers(nonMembers);
    } catch (error) {
      console.error(error);
    }
  }, [channelId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    const filtered = users.filter(user =>
      user.first_name.toLowerCase().includes(term.toLowerCase()) ||
      user.last_name.toLowerCase().includes(term.toLowerCase()) ||
      user.email.toLowerCase().includes(term.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {
    setSelectedUsers(prevSelected => {
      if (prevSelected.some(selected => selected.id === user.id)) {
        // Benutzer entfernen, wenn er bereits ausgewählt ist
        return prevSelected.filter(selected => selected.id !== user.id);
      } else {
        // Benutzer hinzufügen, wenn er noch nicht ausgewählt ist
        return [...prevSelected, user];
      }
    });
  };

  const handleAddUser = () => {
    if (selectedUsers.length > 0) {
      selectedUsers.forEach(user => {
        addUserToChannel(user);
      });
      // Optional: Nach dem Hinzufügen die Auswahl zurücksetzen
      setSelectedUsers([]);
    }
  };

  return (
    <div className="add-user-modal">
      <div className="modal-header">
        <h3> <FontAwesomeIcon icon={faUserPlus} className="user-icon" /> Add user</h3>
        <button className="close-button" onClick={closeModal}>&times;</button>
      </div>
      <div className="modal-body">
        <h4>Channel name: {channelName}</h4>
        <h4>Channel description: {channelDescription}</h4>
        <input
          className="input-add-user" 
          type="text"
          placeholder="Search for user"
          value={searchTerm}
          onChange={handleSearch}
        />
        <ul className="user-list">
          {filteredUsers.map(user => (
            <li 
              key={user.id} 
              onClick={() => handleSelectUser(user)}
              style={{ backgroundColor: selectedUsers.some(selected => selected.id === user.id) ? '#d3d3d3' : 'transparent' }} 
            >
              {user.first_name} {user.last_name} ({user.email})
            </li>
          ))}
        </ul>
        <div>
          <h5>Selected Users:</h5>
          <ul>
            {selectedUsers.map(user => (
              <li key={user.id}>
                {user.first_name} {user.last_name} ({user.email})
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="modal-footer">
        <button className="add-button" onClick={handleAddUser}>
          Add +
        </button>
      </div>
    </div>
  );
};

export default AddUserToChannel;
