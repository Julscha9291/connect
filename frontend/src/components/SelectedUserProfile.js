import React, { forwardRef, useState, useEffect } from 'react';
import './SelectedUserProfile.css';

const SelectedUserProfile = forwardRef(({ user, onClose, onMessageClick }, ref) => {
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  useEffect(() => {
    const currentUserId = localStorage.getItem('user_id');
    
    if (currentUserId && user.id) {
      setSelectedUserIds([parseInt(currentUserId), user.id]);
      console.log(user.id, currentUserId)
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const user2_id = selectedUserIds[1]; // Verwende den zweiten User (selectedUserIds[1])
      
      // Zuerst prüfen, ob der Channel schon existiert
      const existingChannelResponse = await fetch('http://localhost:8000/api/create-private-channel/', {
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
  
        // Existierenden Chat öffnen
        if (existingChannelData.message === "Private channel already exists") {
          console.log('Existing private chat:', existingChannelData);
          onMessageClick(existingChannelData.channel);
        } else {
          console.log('New private chat created:', existingChannelData);
          onMessageClick(existingChannelData.channel);
        }
  
        // Form zurücksetzen
        setSelectedUserIds([]);
        onClose(); // Schließt das Modal oder das Eingabeformular
      } else {
        const errorData = await existingChannelResponse.json();
        console.error('Error checking/creating private chat:', errorData);
      }
    } catch (error) {
      console.error('Error creating private chat:', error);
    }
  };
  

  return (
    <div className="selected-user-profile-overlay">
      <div className="selected-user-profile" ref={ref}>
        <div className="profile-card">
          <button className="close-button" onClick={onClose}>×</button>
          <h2>{user.first_name} {user.last_name}</h2>
          {user.profile_picture ? (
            <img 
              src={user.profile_picture} 
              alt="Profile" 
              className="profile-image" 
            />
          ) : (
            <div 
              className="profile-initials" 
              style={{ backgroundColor: user.color }}
            >
              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
            </div>
          )}
          <button onClick={handleSubmit}>Message</button>
        </div>
      </div>
    </div>
  );
});

export default SelectedUserProfile;
