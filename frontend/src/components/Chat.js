import React, { useCallback, useState, useEffect, useRef } from 'react';
import AddUserToChannel from './AddUserToChannel'; 
import './Chat.css';
import Threads from './Threads';
import EmojiPicker from 'emoji-picker-react';





const Chat = ({ selectedChat, memberIds }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [partner, setPartner] = useState(null);
  const socket = useRef(null);
  const [members, setMembers] = useState([]);
  const currentUserId = parseInt(localStorage.getItem('user_id'), 10);
  const [messageReactions, setMessageReactions] = useState({});
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [channelId, setChannelId] = useState(null);
  const [showThreads, setShowThreads] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [SenderId, setSenderId] = useState('');
  const [attachedFile, setAttachedFile] = useState(null); 
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  

  useEffect(() => {
    const savedChatId = localStorage.getItem('selectedChatId');
    if (savedChatId) {
      // Hier solltest du eine Funktion aufrufen, um den Chat mit der ID `savedChatId` zu laden
      // setSelectedChat({ ... }) mit den Daten für den Chat
    }
  }, []);

  const fetchUsers = useCallback(async (token) => {
    try {
      const response = await fetch('http://localhost:8000/api/users/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Users fetch error:', response.statusText);
        throw new Error('Error fetching users');
      }

      const users = await response.json();
      return users;
    } catch (error) {
      console.error('Fetch error:', error);
      return [];
    }
  }, []);

  const fetchChannelMembers = useCallback(async (channelId, token) => {
    console.log('Fetching channel members for channelId:', channelId);
    setChannelId(channelId);
    try {
      const response = await fetch(`http://localhost:8000/api/channels/${channelId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Channel fetch error:', response.statusText);
        throw new Error('Error fetching channel data');
      }

      const channel = await response.json();
      console.log('Fetched channel data:', channel);

      if (channel) {
        const memberIds = channel.members.map(member => member.user);
        console.log('Member IDs:', memberIds);

        // Fetch all users and filter by memberIds
        const users = await fetchUsers(token);
        const memberDetails = users.filter(user => memberIds.includes(user.id));
        console.log('Filtered member details:', memberDetails);
        setMembers(memberDetails);
      } else {
        console.error('Channel not found');
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }, [fetchUsers, setMembers]);

  useEffect(() => {
    if (selectedChat) {
      const token = localStorage.getItem('access_token');
      if (!selectedChat.data.is_private) {
        fetchChannelMembers(selectedChat.data.id, token);
      }
    }
  }, [selectedChat, fetchChannelMembers]);


  useEffect(() => {
    if (selectedChat) {



      console.log('selectedChat:', selectedChat); // Debugging-Ausgabe
      if (selectedChat.data.is_private) {
        // Private Chat-Logik hier
        console.log('Privater Chat erkannt.');
        // ...
      } else {
        console.log('Nicht privater Chat erkannt.');
        const token = localStorage.getItem('access_token');
        fetchChannelMembers(selectedChat.data.id, token, setMembers);
      }

      localStorage.setItem('selectedChatId', selectedChat.data.id);

      if (selectedChat.data.is_private) {
        const partnerMember = selectedChat.data.members.find(
          (member) => member.user !== currentUserId
        );

        if (partnerMember) {
          fetch('http://localhost:8000/api/users/')
            .then((response) => response.json())
            .then((users) => {
              const partnerData = users.find(user => user.id === partnerMember.user);
              if (partnerData) {
                setPartner(partnerData);
              } else {
                console.error('Partner mit ID', partnerMember.user, 'nicht gefunden.');
              }
            })
            .catch((error) => console.error('Fehler beim Abrufen der Benutzer:', error));
        } else {
          const token = localStorage.getItem('access_token');
          fetchChannelMembers(selectedChat.data.id, token, setMembers);
          console.log(setMembers);
          console.error('Kein Partner gefunden, der ungleich dem aktuellen Benutzer ist.');
        }
      }
    }
  }, [selectedChat, currentUserId, fetchChannelMembers, setMembers]);

  useEffect(() => {
    if (selectedChat) {

      const token = localStorage.getItem('access_token');
      const wsUrl = `ws://localhost:8000/ws/chat/${selectedChat.data.id}/?token=${token}`;

      socket.current = new WebSocket(wsUrl);

      socket.current.onopen = () => {
        console.log('WebSocket-Verbindung geöffnet');
        setIsConnected(true);
      };

      socket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket-Nachricht empfangen:', data);
      
        switch (data.action) {
          case 'edit':
            if (data.message && data.message_id) {
              console.log('Nachricht bearbeiten:', data);
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === data.message_id ? { ...msg, message: data.message } : msg
                )
              );
            } else {
              console.error('Message data for edit action is missing or incorrect:', data);
            }
            break;
      
          case 'delete':
            if (data.message_id) {
              console.log('Nachricht löschen:', data);
              setMessages((prevMessages) =>
                prevMessages.filter((msg) => msg.id !== data.message_id)
              );
              refreshMessages();
            } else {
              console.error('Message ID for delete action is missing or incorrect:', data);
            }
            break;
      
          case 'new':
            if (data.message && data.message_id) {
              console.log('Neue Nachricht empfangen:', data);
              fetch(`http://localhost:8000/api/reactions/?message=${data.message_id}`)
                .then(response => response.json())
                .then(reactionsData => {
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    { ...data, reactions: reactionsData } // Reaktionen zur neuen Nachricht hinzufügen
                  ]);
                  refreshMessages();
                })
                .catch(error => console.error('Error fetching reactions for new message:', error));
            } else {
              console.error('Message data for new action is missing or incorrect:', data);
            }
            break;
      
          case 'reaction':
            if (data.message_id) {
              console.log('Reaktion empfangen:', data);
              fetch(`http://localhost:8000/api/reactions/?message=${data.message_id}`)
                .then(response => response.json())
                .then(reactionsData => {
                  setMessageReactions((prevReactions) => ({
                    ...prevReactions,
                    [data.message_id]: reactionsData
                  }));
                  refreshMessages();
                })
                .catch(error => console.error('Error fetching reactions for message:', error));
            } else {
              console.error('Message ID for reaction action is missing or incorrect:', data);
            }
            break;
      
          default:
            console.error('Unknown action type:', data.action);
        }
      };

      const refreshMessages = () => {
        if (selectedChat) {
            // Zuerst die Nachrichten abrufen
            fetch(`http://localhost:8000/api/messages/${selectedChat.data.id}/`)
                .then(response => response.json())
                .then(messagesData => {
                    // Alle Reaktionen abrufen
                    return fetch(`http://localhost:8000/api/reactions/`)
                        .then(response => response.json())
                        .then(reactionsData => {
                            // Reaktionen nach Nachricht gruppieren
                            const reactionsByMessage = reactionsData.reduce((acc, reaction) => {
                                if (!acc[reaction.message]) {
                                    acc[reaction.message] = {};
                                }
                                if (!acc[reaction.message][reaction.reaction_type]) {
                                    acc[reaction.message][reaction.reaction_type] = new Set();
                                }
                                acc[reaction.message][reaction.reaction_type].add(reaction.user);
                                return acc;
                            }, {});
    
                            // Nachrichten mit Reaktionen kombinieren
                            const messagesWithReactions = messagesData.map(message => ({
                                ...message,
                                reactions: reactionsByMessage[message.id] || {}
                            }));
    
                            console.log('Nachrichten und Reaktionen aktualisieren:', messagesWithReactions);
                            setMessages(messagesWithReactions.map(msg => ({
                                id: msg.id,
                                sender_id: msg.sender__id,
                                sender: msg.sender__username,
                                message: msg.content,
                                timestamp: msg.timestamp,
                                reactions: msg.reactions, // Reaktionen zu den Nachrichten hinzufügen
                                file_url: msg.file_url,
                                thread_count: msg.thread_count
                            })));


                        });
                  
                })
                .catch(error => console.error('Error fetching messages and reactions:', error));
        }
    };    

      socket.current.onclose = () => {
        console.log('WebSocket-Verbindung geschlossen');
        setIsConnected(false);
      };

      socket.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      return () => {
        if (socket.current) {
          socket.current.close();
        }
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      fetch(`http://localhost:8000/api/messages/${selectedChat.data.id}/`)
        .then(response => response.json())
        .then(data => {
          console.log('Initiale Nachrichten laden:', data);
          setMessages(data.map(msg => ({
            id: msg.id,
            sender_id: msg.sender__id,  // Hier sicherstellen, dass `sender_id` enthalten ist
            sender: msg.sender__username,
            message: msg.content,
            timestamp: msg.timestamp,
            file_url: msg.file_url,
            thread_count: msg.thread_count
          })));
          fetchReactions();
        })
        .catch(error => console.error('Error fetching messages:', error));
    }
  }, [selectedChat]);

  const fetchReactions = (messageId) => {
    fetch('http://localhost:8000/api/reactions/')
      .then(response => response.json())
      .then(data => {
        console.log('Alle Reaktionen geladen:', data);
        const reactionsByMessage = data.reduce((acc, reaction) => {
          if (!acc[reaction.message]) {
            acc[reaction.message] = {};
          }
          if (!acc[reaction.message][reaction.reaction_type]) {
            acc[reaction.message][reaction.reaction_type] = new Set();
          }
          acc[reaction.message][reaction.reaction_type].add(reaction.user);
          return acc;
        }, {});
        setMessageReactions(reactionsByMessage);
      })
      .catch(error => console.error('Error fetching reactions:', error));
  };

  const handleReactionClick = (messageId, reactionType) => {
    const userReactions = messageReactions[messageId]?.[reactionType] || new Set();
    const updatedReactions = { ...messageReactions };
  
    if (userReactions.has(currentUserId)) {
      // Wenn der Benutzer bereits reagiert hat, entferne die Reaktion
      userReactions.delete(currentUserId);
      removeReaction(messageId, reactionType, currentUserId);  // Entferne die Reaktion aus der Datenbank
    } else {
      // Wenn der Benutzer noch nicht reagiert hat, füge die Reaktion hinzu
      userReactions.add(currentUserId);
      addReaction(messageId, reactionType, currentUserId);  // Füge die Reaktion zur Datenbank hinzu
    }
  
    // Aktualisiere den Status der Reaktionen im Frontend
    updatedReactions[messageId] = {
      ...updatedReactions[messageId],
      [reactionType]: userReactions
    };
  
    setMessageReactions(updatedReactions);
  };
  

  const addReaction = (messageId, reactionType, user) => {
    const token = localStorage.getItem('access_token');
    
    fetch('http://localhost:8000/api/reactions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: messageId, reaction_type: reactionType, user: user })
    })
      .then(response => {
        if (!response.ok) {
          console.error('Fehler beim Hinzufügen der Reaktion:', response.status, response.statusText);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => fetchReactions(messageId))
      .catch(error => console.error('Error adding reaction:', error));
  };

  const removeReaction = (messageId, reactionType, user) => {
    const token = localStorage.getItem('access_token');
    const requestBody = { message: messageId, reaction_type: reactionType, user: user };
    console.log('Request Body:', requestBody); // Debugging-Ausgabe
  
    fetch(`http://localhost:8000/api/reactions/delete-reaction/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        console.error('Fehler beim Entfernen der Reaktion:', response.status, response.statusText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(() => fetchReactions(messageId)) // Aktualisiere die Reaktionen nach dem Löschen
    .catch(error => console.error('Error removing reaction:', error));
  };
  

  const handleDeleteMessage = (messageId) => {
    if (isConnected) {
      const message = {
        type: 'delete',
        message_id: messageId,
        chatId: selectedChat.data.id,
      };
      console.log('Nachricht löschen senden:', message);
      socket.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket-Verbindung ist nicht offen.');
    }
  };

  const handleEditMessage = (messageId, content) => {
    console.log('Bearbeiten Nachricht:', messageId);
    setNewMessage(content);
    setEditingMessageId(messageId);
  };

  const handleCancelEdit = () => {
    console.log('Bearbeitung abbrechen');
    setNewMessage('');
    setEditingMessageId(null);
  };

  const handleSaveMessage = () => {
    if (newMessage.trim() && isConnected) {
      const message = {
        type: 'edit',
        message: newMessage,
        message_id: editingMessageId,
        chatId: selectedChat.data.id,
      };
      console.log('Nachricht speichern senden:', message);
      socket.current.send(JSON.stringify(message));
      setNewMessage('');
      setEditingMessageId(null);
    } else if (!isConnected) {
      console.error('WebSocket-Verbindung ist nicht offen.');
    }
  };

  const handleSendMessage = async () => {
    if ((newMessage.trim() || attachedFile) && isConnected && !editingMessageId) {
        let fileUrl = null;

        if (attachedFile) {
            const formData = new FormData();
            formData.append('file', attachedFile);

            try {
                const response = await fetch('http://localhost:8000/api/upload/', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                fileUrl = data.file_url;
                console.log('Datei hochgeladen, URL:', fileUrl);
            } catch (error) {
                console.error('Fehler beim Hochladen der Datei:', error);
                return;
            }
        }

        const message = {
            type: 'new',
            message: newMessage.trim() || null,
            fileUrl: fileUrl || null,
        };

        console.log('Nachricht, die gesendet wird:', message);
        socket.current.send(JSON.stringify(message));
        setNewMessage('');
        setAttachedFile(null);
    } else {
        console.error('Nachricht erfordert entweder Inhalt oder eine Datei.');
    }
};



  if (!selectedChat) {
    return <div>Bitte wähle einen Chat</div>;
  }


  const getEmojiCount = (messageId, emoji) => {
    const reactions = messageReactions[messageId]?.[emoji];
    return reactions ? reactions.size : 0;
  };


  const openAddUserModal = () => {
    setIsAddUserModalOpen(true);
  };
  
  const closeAddUserModal = () => {
    setIsAddUserModalOpen(false);
  };
  
  const handleAddUserToChannel = (user, refreshMessages) => {
    const userId = user.id;

    fetch(`http://localhost:8000/api/channels/${channelId}/add_user/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ user_id: userId }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('User added:', data);
        // Hier kannst du weitere Logik hinzufügen, z.B. den Modal schließen
        closeAddUserModal();
        refreshMessages();
    })
    .catch(error => {
        console.error('Error:', error);
    });
};

const getMessageClass = (senderId) => {
  return senderId === currentUserId ? 'message current-user' : 'message other-user';
};
  

const handleOpenThreads = (message) => {
  if (message && message.id) {
    console.log(message.message); // Ausgabe der ID zur Überprüfung
    setSelectedMessage(message);
    setSelectedMessageId(message.id); // Hier sicherstellen, dass die ID korrekt übergeben wird
    console.log(message.id); // Ausgabe der ID zur Überprüfung
    setSenderId(message.sender_id); // Hier sicherstellen, dass die ID korrekt übergeben wird
    setShowThreads(true);
    console.log(message.id); // Ausgabe der ID zur Überprüfung
    console.log(message.sender_id); // Ausgabe der ID zur Überprüfung
  } else {
    console.error('Message or Message ID is undefined');
  }
};

const handleCloseThreads = () => {
  setShowThreads(false);
  setSelectedMessage('');
};

const handleFileChange = (e) => {
  const file = e.target.files[0];
  setAttachedFile(file);

  // Wenn es ein Bild ist, erzeuge eine Vorschau
  if (file && file.type.startsWith('image/')) {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      setFilePreview(e.target.result); // Bild-Vorschau
    };
    fileReader.readAsDataURL(file);
  } else {
    // Für andere Dateitypen speichere den Dateinamen
    setFilePreview(file.name);
  }
};

  const handleEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji); // Emoji zur Nachricht hinzufügen
    setShowEmojiPicker(false); // Emoji-Picker nach Auswahl schließen
  };

  

const baseUrl = 'http://localhost:8000';



  return (
    <div className="chat">
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
                <div
                  className="user-profile-placeholder"
                  style={{ backgroundColor: partner.color }}
                >
                  {partner.first_name[0]}
                  {partner.last_name[0]}
                </div>
              )}
              <span className="chat-partner-name">
                {partner.first_name} {partner.last_name}
              </span>
            </div>
          ) : (
            <div>Partnerdaten werden geladen...</div>
          )
        ) : (
          <div className="chat-header-channel">
          
  <span>{selectedChat.data.name}</span>
  <p>{selectedChat.data.description}</p>


  <div className="channel-members-header">
  {members.length > 0 ? (
    members.map((member) => (
      <div key={member.id} className="channel-member">
        {member.profile_picture ? (
          <img
            src={member.profile_picture}
            alt={`${member.first_name} ${member.last_name}`}
            className="member-profile-image"
          />
        ) : (
          <div
            className="user-profile-placeholder"
            style={{ backgroundColor: member.color || '#ccc' }} // Falls keine Farbe definiert ist, setze eine Standardfarbe
          >
            {member.first_name[0]}
            {member.last_name[0]}
          </div>
        )}
  
      </div>
      
    ))
  ) : (
    <div>Keine Mitglieder gefunden.</div>
  )}
</div>
<button onClick={openAddUserModal}>+</button>

{isAddUserModalOpen && (
  <AddUserToChannel
    channelId={selectedChat.data.id}
    channelName = {selectedChat.data.name}
    closeModal={closeAddUserModal}
    addUserToChannel={handleAddUserToChannel}
  />
)}
</div>

        )}
      </div>
  
      <div className="chat-body">
  {messages.length === 0 ? (
    <div className="no-messages">Keine Nachrichten</div>
  ) : (
    <div className="chat-container">


      <div className="messages">
        {messages.map((message) => {
          // Sende-Details abrufen
          const senderDetails = members.find((member) => member.id === message.sender_id);

          return (
            <div key={message.id} className={getMessageClass(message.sender_id)}>
              <div className="messages-wrapper">
                {/* Profilbild oder Initialen anzeigen */}
                {senderDetails ? (
                  <div className="sender-details">
                    {senderDetails.profile_picture ? (
                      <img
                        src={senderDetails.profile_picture}
                        alt={`${senderDetails.first_name} ${senderDetails.last_name}`}
                        className="member-profile-image"
                      />
                    ) : (
                      <div
                        className="user-profile-placeholder"
                        style={{ backgroundColor: senderDetails.color || '#ccc' }} // Standardfarbe falls keine Farbe vorhanden
                      >
                        {senderDetails.first_name[0]}
                        {senderDetails.last_name[0]}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="user-profile-placeholder">NN</div> // Fallback für unbekannte Nutzer
                )}

                {/* Name des Senders anzeigen */}
                <strong>{message.sender}:</strong>

                {showThreads && (

              
                  <Threads
                  initialMessage={selectedMessage}
                  sender={message.sender}
                  Initial_first_name={message.first_name}
                  profile_picture={senderDetails?.profile_picture}
                  first_name={senderDetails?.first_name}
                  last_name={senderDetails?.last_name}
                  color={senderDetails?.color}
                  onClose={handleCloseThreads}
                  messageId={selectedMessageId}
                  SenderId={SenderId}
                  currentUserId={currentUserId}
                  file_url={message.file_url}
                  />
                
                )}



                <div className="message-icon">
                  <button
                    className="speech-bubble-icon"
                    onClick={() => handleOpenThreads(message)}
                  >
                    <i className="fas fa-comment-dots"></i>
                  </button>
                </div>
              </div>

              {editingMessageId === message.id ? (
                <div>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button onClick={handleSaveMessage}>Speichern</button>
                  <button onClick={handleCancelEdit}>Abbrechen</button>
                </div>
              ) : (
                <div className="Message-Text">
                  {message.message}
                      {/* Überprüfen, ob die Datei vorhanden ist */}
                      {message.file_url && (
                        <div className="Message-File">

                          {message.file_url.endsWith('.png') || message.file_url.endsWith('.jpg') || message.file_url.endsWith('.jpeg')
                          || message.file_url.endsWith('.JPG') || message.file_url.endsWith('.PNG') || message.file_url.endsWith('.JPEG')? (
                            <img
                              src={`${baseUrl}${message.file_url}`}
                              alt="Uploaded file"
                              className="Message-Image"
                            />
                          ) : (
                            <a href={`${baseUrl}${message.file_url}`} download>
                              {message.file_url.split('/').pop()}
                            </a>
                          )}
                        </div>

                      )}

                  <div className="thread-count">
                    {message.thread_count > 0 
                      ? `${message.thread_count} ${message.thread_count === 1 ? 'response' : 'responses'}` 
                      : 'No responses'}
                  </div>

                  {message.sender_id === currentUserId && (
                    <div>
                      <button
                        onClick={() =>
                          handleEditMessage(message.id, message.message)
                        }
                      >
                        Bearbeiten
                      </button>
                      <button onClick={() => handleDeleteMessage(message.id)}>
                        Löschen
                      </button>
                    </div>
                  )}
                  <div className="message-reactions">
                  <button onClick={() => handleReactionClick(message.id, 'like')}>
  <span role="img" aria-label="like">👍</span> {getEmojiCount(message.id, 'like')}
</button>
<button onClick={() => handleReactionClick(message.id, 'love')}>
  <span role="img" aria-label="love">❤️</span> {getEmojiCount(message.id, 'love')}
</button>
<button onClick={() => handleReactionClick(message.id, 'haha')}>
  <span role="img" aria-label="haha">😂</span> {getEmojiCount(message.id, 'haha')}
</button>
<button onClick={() => handleReactionClick(message.id, 'wow')}>
  <span role="img" aria-label="wow">😮</span> {getEmojiCount(message.id, 'wow')}
</button>
<button onClick={() => handleReactionClick(message.id, 'sad')}>
  <span role="img" aria-label="sad">😢</span> {getEmojiCount(message.id, 'sad')}
</button>
<button onClick={() => handleReactionClick(message.id, 'angry')}>
  <span role="img" aria-label="angry">😡</span> {getEmojiCount(message.id, 'angry')}
</button>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )}
</div>
<div className="chat-footer">
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Nachricht eingeben..."
      />

      <button onClick={() => setShowEmojiPicker((prev) => !prev)}>
        <span role="img" aria-label="Emoji auswählen">😊</span>
      </button>

      <input
        type="file"
        onChange={handleFileChange} // Datei in den State setzen
      />
      
      {/* Dateivorschau oder Dateiname anzeigen */}
      {filePreview && (
        <div className="file-preview">
          {attachedFile && attachedFile.type.startsWith('image/') ? (
            <img
              src={filePreview}
              alt="Preview"
              style={{ width: '200px', height: 'auto' }} // Bild-Vorschau
            />
          ) : (
            <p>{attachedFile?.name}</p> // Dateiname anzeigen, wenn es kein Bild ist
          )}
        </div>
      )}



      {showEmojiPicker && (
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      )}

      <button onClick={handleSendMessage}>Senden</button>
    </div>
</div>
  );
  
};

export default Chat;
