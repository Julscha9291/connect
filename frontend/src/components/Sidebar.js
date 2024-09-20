import React, { useState, useEffect, useCallback } from 'react';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ onAddChannelClick, onSelectChat, user }) => {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [userChats, setUserChats] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const token = localStorage.getItem('access_token');
        console.log('Fetching channels with token:', token);
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
        console.log('Fetching users with token:', token);
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
    
    console.log('Chat partner found:', partnerDetails);
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

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className='sidebar-h2'>TeamSpace</h2>
      </div>
      <div className="sidebar-header">
      <h2 className='sidebar-h2'>Channels</h2>
        <button className="dropdown-toggle" onClick={handleDropdownToggle}>
          <FontAwesomeIcon icon={faCaretDown} />
        </button>
        <button className="add-channel-button" onClick={onAddChannelClick}>+</button>
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
      <h2 className='sidebar-h2'>Messages</h2>
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
        <h2 className='sidebar-h2'>Private Chats</h2>
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
                        {partner.first_name.charAt(0)}{partner.last_name.charAt(0)}
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
      </div>
    </div>
  );
};

export default Sidebar;
