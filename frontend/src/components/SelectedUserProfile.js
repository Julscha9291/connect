import React, { forwardRef, useState, useEffect } from 'react';
import './SelectedUserProfile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope,faCircle } from '@fortawesome/free-solid-svg-icons';

const SelectedUserProfile = forwardRef(({ user, onClose, onMessageClick }, ref) => {
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  useEffect(() => {
    const currentUserId = localStorage.getItem('user_id');
    
    if (currentUserId && user.id) {
      setSelectedUserIds([parseInt(currentUserId), user.id]);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user2_id = selectedUserIds[1]; 
      const existingChannelResponse = await fetch(`${process.env.REACT_APP_API_URL}api/create-private-channel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          user2_id: user2_id,
        }),
      });
  
      if (existingChannelResponse.ok) {
        const existingChannelData = await existingChannelResponse.json();

        if (existingChannelData.message === "Private channel already exists") {
          onMessageClick(existingChannelData.channel);
        } else {
          onMessageClick(existingChannelData.channel);
        }
  
        setSelectedUserIds([]);
        onClose(); 
        window.location.reload();
      } else {
        const errorData = await existingChannelResponse.json();
      }
    } catch (error) {
    }
  };
  
  return (
    <div className="selected-user-profile-overlay">
      <div className="selected-user-profile" ref={ref}>
        <div className="profile-card">
            <h2 className="h2-profile">Profile</h2>
              <button className="close-button" onClick={onClose}>×</button>
          
              {user.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt="Profile" 
                  className="profile-nav" 
                />
              ) : (
            <div 
              className="profile-nav" 
              style={{ backgroundColor: user.color }}
            >
              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
            </div>
          )}
              <h2>{user.first_name} {user.last_name}</h2>

              <div className="online-wrapper">
              <FontAwesomeIcon icon={faCircle}  className={user.is_online ? 'icon-online' : 'icon-offline'}  style={{ fontSize: '12px', marginRight: '5px' }} />
                {user.is_online ? (
                            <span className="status-profile ProfilOnline"> Online </span>
                          ) : (
                            <span className="status-profile ProfilOffline"> Offline </span>
                          )}
              </div>

          <div className="profile-details">
            <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '8px' }} className="email-icon" /><p>
              <strong>E-Mail Adress:</strong> <br></br>
                 {user.email}</p>
          </div>
          <button className = "edit-button" onClick={handleSubmit}>Message</button>
        </div>
      </div>
    </div>
  );
});

export default SelectedUserProfile;
