import React, { useCallback, useState, useEffect } from 'react';
import './AddUserToChannel.css';
import axios from 'axios';

const AddUserToChannel = ({ channelId, closeModal, addUserToChannel, channelName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch all users and exclude those already in the channel
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
  
      // Alle Benutzer abrufen
      const usersResponse = await axios.get('http://localhost:8000/api/users/', config);
      const allUsers = usersResponse.data;
      console.log('Alle Benutzer:', allUsers);
  
      // Channel-Mitglieder abrufen
      const channelResponse = await axios.get(`http://localhost:8000/api/channels/${channelId}/`, config);
      const channelData = channelResponse.data;
      const channelMembers = channelData.members;  // Angenommen, dass die Mitglieder unter `members` im Channel-Objekt gespeichert sind
      console.log('Channel-Mitglieder:', channelMembers);
  
      // Benutzer filtern, die noch keine Mitglieder des Channels sind
      const nonMembers = allUsers.filter(user => {
        return !channelMembers.some(member => member.user === user.id); // Vergleiche `member.user` mit `user.id`
      });
  
      console.log('Nicht-Mitglieder:', nonMembers);
      
      setUsers(nonMembers);
      setFilteredUsers(nonMembers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [channelId]);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    // Filter users based on search term
    const filtered = users.filter(user =>
      user.first_name.toLowerCase().includes(term.toLowerCase()) ||
      user.last_name.toLowerCase().includes(term.toLowerCase()) ||
      user.email.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleAddUser = () => {
    if (selectedUser) {
      addUserToChannel(selectedUser);
    }
  };

  return (
    <div className="add-user-modal">
      <div className="modal-header">
        <h3>Leute hinzufügen</h3>
        <button onClick={closeModal}>&times;</button>
      </div>
      <div className="modal-body">
        <h4>#{channelId}</h4>
        <h4>{channelName}</h4>
        channelName
        <input
          type="text"
          placeholder="Benutzer durchsuchen"
          value={searchTerm}
          onChange={handleSearch}
        />
        <ul className="user-list">
          {filteredUsers.map(user => (
            <li key={user.id} onClick={() => handleSelectUser(user)}>
              {user.first_name} {user.last_name} ({user.email})
            </li>
          ))}
        </ul>
      </div>
      <div className="modal-footer">
        <button className="add-button" onClick={handleAddUser}>
          Hinzufügen
        </button>
      </div>
    </div>
  );
};

export default AddUserToChannel;
