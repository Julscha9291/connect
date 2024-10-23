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
      channelDescription }) => {
        
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

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
            <li key={user.id} onClick={() => handleSelectUser(user)}>
              {user.first_name} {user.last_name} ({user.email})
            </li>
          ))}
        </ul>
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
