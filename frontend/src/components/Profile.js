import React, { useState, useEffect } from 'react';
import './Profile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEnvelope,faCircle } from '@fortawesome/free-solid-svg-icons';

const Profile = ({ onClose }) => {
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profile_picture: '',
    status: '',
    color: '' // Color hinzugefügt
  });
  const [isEditing, setIsEditing] = useState(false);
  const [updatedData, setUpdatedData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token'); // JWT Token abrufen
        const response = await fetch(`${process.env.REACT_APP_API_URL}api/profile/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setUpdatedData({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email
          });
        } else {
          console.error('Fehler beim Abrufen der Benutzerdaten:', response.status);
        }
      } catch (error) {
        console.error('Fehler beim Abrufen der Benutzerdaten:', error);
      }
    };

    fetchData();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      const token = localStorage.getItem('access_token'); // JWT Token abrufen
      const response = await fetch(`${process.env.REACT_APP_API_URL}api/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`, // Token im Header senden
          'Content-Type': 'application/json' // Sende JSON-Daten
        },
        body: JSON.stringify(updatedData) // Aktualisierte Daten senden
      });
  
      if (response.ok) {
        const updatedProfileData = await response.json(); // Das aktualisierte Profil abrufen
  
        // Profil-Daten im Local Storage aktualisieren
        localStorage.setItem('first_name', updatedProfileData.first_name);
        localStorage.setItem('last_name', updatedProfileData.last_name);
        localStorage.setItem('color', updatedProfileData.color);
        localStorage.setItem('profile_picture', updatedProfileData.profile_picture);
  
        // Benutzer-Daten im State aktualisieren
        setUserData({
          ...userData,
          ...updatedProfileData
        });
        window.location.reload();
        setIsEditing(false);
      } else {
        console.error('Fehler beim Speichern der Änderungen:', response.status);
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Änderungen:', error);
    }
  };
  
  const handleChange = (e) => {
    setUpdatedData({
      ...updatedData,
      [e.target.name]: e.target.value
    });
  };

  // Basis-URL für das Bild
  const baseUrl = `${process.env.REACT_APP_API_URL}`;

  // Funktion zum Generieren der Initialen
  const getInitials = (firstName, lastName) => {
    return firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
  };

  return (
    <div className="profile-overlay">
      <div className="profile-card">
        <div className="profile-header">
          <h2 className="h2-profile">Profile</h2>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {userData.profile_picture ? (
          <img 
            src={`${baseUrl}${userData.profile_picture}`} 
            alt="Profile" 
            className="profile-nav" 
          />
        ) : (
          <div 
            className="profile-nav" 
            style={{ backgroundColor: userData.color }} // Hintergrundfarbe für Initialen
          >
            {getInitials(userData.first_name, userData.last_name)}
          </div>
        )}



<div className="profile-infos">

        <div className="profile-info-nav">
          <h2>{userData.first_name} {userData.last_name}</h2>

          <div style={{ display: 'flex', alignItems: 'center', color: 'green' }}>
          <FontAwesomeIcon icon={faCircle} style={{ fontSize: '12px', marginRight: '5px' }} />
          <span style={{ color: 'green', fontWeight: 'bold', fontSize:'20px' }}>Online</span>
         </div>


          <div className="profile-details">

          <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '8px' }} className="email-icon" /><p>
            <strong>E-Mail Adress:</strong> <br></br>

            {userData.email}</p>
          </div>
          </div> 
          </div>
          <span className="status-text">{userData.status}</span>
          {isEditing ? (
            <div className="edit-section">
              <input
                type="text"
                name="first_name"
                value={updatedData.first_name}
                onChange={handleChange}
                placeholder="Vorname"
              />
              <input
                type="text"
                name="last_name"
                value={updatedData.last_name}
                onChange={handleChange}
                placeholder="Nachname"
              />
              <input
                type="email"
                name="email"
                value={updatedData.email}
                onChange={handleChange}
                placeholder="E-Mail"
              />
              <button className="edit-button"  onClick={handleSaveClick}>Speichern</button>
            </div>
          ) : (
            <button className="edit-button" onClick={handleEditClick}>Bearbeiten</button>
          )}
   
      </div>
    </div>
  );
};

export default Profile;
