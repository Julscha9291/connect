import React, { useState } from 'react';
import './RegistrationForm.css';
import axios from 'axios';

function RegistrationForm({ onSuccess, onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);

    const handlePictureChange = (e) => {
        setProfilePicture(e.target.files[0]);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('username', username);
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('email', email);
        formData.append('password', password);
        if (profilePicture) {
            formData.append('profile_picture', profilePicture);
        }

        try {
            await axios.post('http://localhost:8000/api/register/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onSuccess(); 
             } catch (error) {
                 console.error('Registration error:', error);
            }
         };

    return (
        <div className="registration-page">
            <div className="registration-container">
                <div className="header">
                    <h2 className="registration-heading">Sign up</h2>
                </div>
                <div className="form-container-reg">
                    <form onSubmit={handleSubmit}>
                    <input className="registration-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required /><br />
                        <input className="registration-input" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Firstname" required /><br />
                        <input className="registration-input" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Lastname" required /><br />
                        <input className="registration-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail" required /><br />
                        <input className="registration-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required /><br />                      
                        <input type="file" onChange={handlePictureChange} /><br />
                        <div className='wrapper'>
                            <button type="submit" className="registration-button">Sign up</button>
                            <button type="button" onClick={onSwitchToLogin} className="login-button">Login</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RegistrationForm;