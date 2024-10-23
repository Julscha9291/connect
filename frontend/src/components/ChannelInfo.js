import React, { useState } from 'react';
import './ChannelInfo.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

const ChannelInfo = ({ 
      channelName, 
      description, 
      channelId, 
      creator, 
      onClose }) => {
        
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newChannelName, setNewChannelName] = useState(channelName);
  const [newDescription, setNewDescription] = useState(description);

const handleNameEdit = () => {
    setIsEditingName(!isEditingName);
    setIsEditingName(true); 
  };

  const handleDescriptionEdit = () => {
    setIsEditingDescription(!isEditingDescription);
    setIsEditingDescription(true); 
  };

  const saveChanges = async () => {
    try {
    const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}api/channels/${channelId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newChannelName,
          description: newDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Channels');
      }

      const updatedChannel = await response.json();
      setIsEditingName(false);
      setIsEditingDescription(false);
      window.location.reload();
    } catch (error) {
    }
  };

  const leaveChannel = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}api/channels/${channelId}/delete_user/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        window.location.reload();
        onClose(); 
      } else {
        const errorData = await response.json();
      }
    } catch (error) {
    }
  };

  return (
    <div className="channel-overlay">
      <div className="channel-info-container">
        <div className="channel-info-header">  
           <div className="channel-info-left">  
              <FontAwesomeIcon 
                    icon={faPenToSquare} 
                    style={{ 
                      marginRight: '10px', 
                      fontSize: '30px',   
                      color: '#4742eb'   
                    }} 
                  />
              <h3 className="channel-info">Channel Information</h3>
            </div>
            <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="channel-detail-row">
         <div className="channel-detail-name">
            <span className="channel-name-label">Channel-Name</span>
                {isEditingName ? (
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    onBlur={saveChanges}
                  />
                ) : (
                  <div className="channel-detail">
                    <span>{newChannelName}</span>
                
                  </div>
        
                )}
        </div>
        <button
            className="edit-button-channel"
            onClick={isEditingName ? saveChanges : handleNameEdit}>
            {isEditingName ? 'Save' : 'Edit'}
            </button>
        </div>

        <div className="channel-detail-row">
          <div className="channel-detail-name">           
              <span className="channel-name-label">Edit</span>
                  {isEditingDescription ? (
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      onBlur={saveChanges}
                    />
                  ) : (
                    <div className="channel-detail">
                      <span>{newDescription}</span>    
                    </div>
                  )}
           </div>
              <button
                className="edit-button-channel"
                onClick={isEditingDescription ? saveChanges : handleDescriptionEdit}>
                {isEditingDescription ? 'Save' : 'Edit'}
              </button>
          </div>

        <div className="channel-detail-row">
          <div className="channel-detail-name">
              <span className="channel-name-label">Created by</span>
              <span className="creator-name">{creator}</span>
          </div>
        </div>

        <div className="leave-channel">
           <button className="leave-channel-button" onClick={leaveChannel}>Leave Channel</button>
        </div>
      </div>
    </div>

  );
};

export default ChannelInfo;