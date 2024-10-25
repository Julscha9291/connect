import React, { useState, useRef, useEffect } from 'react';
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
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
  const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [dropdownPosition, setDropdownPosition] = useState(0);

  const membersHeaderRef = useRef(null);
  const dropdownRef = useRef(null);
  const selectedUserProfileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Überprüfen, ob außerhalb der selectedUserProfile geklickt wurde
      if (selectedUserProfileRef.current && !selectedUserProfileRef.current.contains(event.target)) {
        setSelectedUser(null); // Schließt die selectedUserProfile, wenn außerhalb geklickt wird
      }

      // Überprüfen, ob außerhalb des Dropdowns und des Members-Headers geklickt wurde
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        membersHeaderRef.current && !membersHeaderRef.current.contains(event.target)
      ) {
        setIsMembersDropdownOpen(false); // Schließt das Mitglieder-Dropdown
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Abhängigkeiten entfernt


  useEffect(() => {
    const updateDropdownPosition = () => {
      if (membersHeaderRef.current) {
        const headerHeight = membersHeaderRef.current.offsetHeight;
        setDropdownPosition(headerHeight);
      }
    };

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [membersHeaderRef]);

  const toggleChannelDropdown = () => setIsChannelDropdownOpen(prev => !prev);
  const toggleMembersDropdown = () => {
    if (!isAddUserModalOpen) {
      setIsMembersDropdownOpen(prev => !prev);
    }
  };

  const openAddUserModal = () => {
    setIsMembersDropdownOpen(false); 
    setIsAddUserModalOpen(true);
  };

  const closeAddUserModal = () => {
    setIsAddUserModalOpen(false);
    setIsMembersDropdownOpen(false); 
  };

  const handleToggleProfile = () => {
    setIsProfileOpen(prevState => !prevState);
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
    setSelectedUser(null);
    
  };

  const handleMessageClick = (user) => {
    console.log('Message click for user:', user);
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
        console.error('Error adding user:', error);
    });
};

const handleSelectUser = (user) => {
  setSelectedUser(user); 
  setIsMembersDropdownOpen(false); 
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
                <SelectedUserProfile 
                user={partner} 
                onClose={handleCloseProfile} 
                onMessageClick={handleMessageClick} 
                />
              )}
          </div>
        ) : (
          <div>Partnerdaten werden geladen...</div>
        )
      ) : (
        <div className="chat-header-channel">
          <div className="channel-left">
            <div className="channel-title">{selectedChat.data.name}</div>
            <FontAwesomeIcon icon={faCaretDown} className="navbar-icon" onClick={toggleChannelDropdown} />
            {isChannelDropdownOpen && (
              <ChannelInfo 
                channelName={selectedChat.data.name}
                description={selectedChat.data.description}
                creator={selectedChat.data.creator}
                onClose={toggleChannelDropdown} 
                channelId={channelId}
              />
            )}
          </div>
          <div className="channel-right" ref={dropdownRef} onClick={toggleMembersDropdown}>
            <div ref={membersHeaderRef} className="channel-members-header">
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
                {isMembersDropdownOpen && (
                  <div className="members-dropdown">
                    {members.map((member) => (
                      <div key={member.id} className="dropdown-member" onClick={() => handleSelectUser(member)}>
                        {member.profile_picture ? (
                          <img src={member.profile_picture} alt={`${member.first_name} ${member.last_name}`} className="user-profile-placeholder2" />
                        ) : (
                          <div className="user-profile-placeholder2" style={{ backgroundColor: member.color || '#ccc' }}>
                            {member.first_name[0]}{member.last_name[0]}
                          </div>
                        )}
                        <span className="member-name">{member.first_name} {member.last_name}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <FontAwesomeIcon
              icon={faUserPlus}
              className="user-icon"
              onClick={(event) => {
                event.stopPropagation();
                openAddUserModal();
              }}
            />
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

      {selectedUser && (
                                   <SelectedUserProfile
                                   user={selectedUser}
                                   onClose={handleCloseProfile}
                                   onMessageClick={handleMessageClick} 
                                 />
                 )}
    </div>
  );
};

export default ChatHeader;
