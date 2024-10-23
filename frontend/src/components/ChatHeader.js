// ChatHeader.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import SelectedUserProfile from './SelectedUserProfile';
import ChannelInfo from './ChannelInfo';
import AddUserToChannel from './AddUserToChannel';
import './ChatHeader.css';

const ChatHeader = ({
  selectedChat,
  partner,
  members,
  channelId
}) => {

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDropdownProfileOpen, setIsDropdownProfileOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const toggleDropdownProfile = () => setIsDropdownProfileOpen(prev => !prev);
  const openAddUserModal = () => setIsAddUserModalOpen(true);
  const closeAddUserModal = () => setIsAddUserModalOpen(false);

  const handleToggleProfile = () => {
    setIsProfileOpen((prevState) => !prevState);
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
  };

  const handleAddUserToChannel = (user, refreshMessages) => {
    const userId = user.id;

    fetch(`${process.env.REACT_APP_API_URL}api/channels/${channelId}/add_user/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ user_id: userId }),
    })
    .then(response => response.json())
    .then(data => {
        closeAddUserModal();
        refreshMessages();
    })
    .catch(error => {
    });
};

return (
    <div className="chat-header">
      {selectedChat.data.is_private ? (
        partner ? (
          <div className="chat-header-private">
            {partner.profile_picture ? (
              <img
                src={partner.profile_picture}
                alt={`${partner.first_name} ${partner.last_name}`}
                className="chat-profile-image"
              />
            ) : (
              <div className="user-profile-placeholder" style={{ backgroundColor: partner.color }}>
                {partner.first_name[0]}{partner.last_name[0]}
              </div>
            )}
            <span className="chat-partner-name">
              {partner.first_name} {partner.last_name}
            </span>

            <div className="dropdown-icon" onClick={handleToggleProfile}>
              <FontAwesomeIcon icon={faCaretDown} className="navbar-icon" />
            </div>
              {isProfileOpen && (
                <SelectedUserProfile user={partner} onClose={handleCloseProfile} />
              )}
          </div>
        ) : (
          <div>Partnerdaten werden geladen...</div>
        )
      ) : (

        <div className="chat-header-channel">
          <div className="channel-left">
            <div className="channel-title">{selectedChat.data.name}</div>
                <FontAwesomeIcon icon={faCaretDown} className="navbar-icon" onClick={toggleDropdownProfile} />
                {isDropdownProfileOpen && (
                  <ChannelInfo 
                    channelName={selectedChat.data.name}
                    description={selectedChat.data.description}
                    creator={selectedChat.data.creator}
                    onClose={toggleDropdownProfile} 
                    channelId={channelId}
                  />
                )}
          </div>
          <div className="channel-right">
            <div className="channel-members-header">
              {members.map((member) => (
                <div key={member.id} className="channel-member">
                  {member.profile_picture ? (
                    <img src={member.profile_picture} alt={`${member.first_name} ${member.last_name}`} className="user-profile-placeholder2" />
                  ) : (
                    <div className="user-profile-placeholder2" style={{ backgroundColor: member.color || '#ccc' }}>
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <FontAwesomeIcon icon={faUserPlus} className="user-icon" onClick={openAddUserModal} />
            {isAddUserModalOpen && (
              <>
                <div className="overlay" onClick={closeAddUserModal}></div>
                <AddUserToChannel
                  channelId={selectedChat.data.id}
                  channelName={selectedChat.data.name}
                  channelDescription={selectedChat.data.description}
                  closeModal={closeAddUserModal}
                  addUserToChannel={handleAddUserToChannel}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
