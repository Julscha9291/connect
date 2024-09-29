import React, { useState, useEffect } from 'react';
import './Threads.css';
import EmojiPicker from 'emoji-picker-react';

const Threads = ({ 
  initialMessage, 
  setThreadMessages, 
  sender, 
  profile_picture, 
  first_name, 
  last_name, 
  color, 
  onClose, 
  messageId, 
  currentUserId,
  updateThreadCount
}) => {
  const [localThreadMessages, setLocalThreadMessages] = useState([]);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [threadMessage, setThreadMessage] = useState('');
  const [senderDetails, setSenderDetails] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  const [attachedFile, setAttachedFile] = useState(null); 
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentUserDetails, setCurrentUserDetails] = useState(null);

  useEffect(() => {
    // Hole die Thread-Nachrichten
    fetch(`http://localhost:8000/api/threads/?message_id=${messageId}`)
      .then(response => response.json())
      .then(data => {
        const filteredThreads = data.filter(thread => thread.message === messageId);
        setLocalThreadMessages(filteredThreads);
        fetchReactions();
      })
      .catch(error => {
        console.error("Error fetching thread messages:", error);
      });


      fetch('http://localhost:8000/api/users/')
      .then(response => response.json())
      .then(data => {
        // Suche nach dem Benutzer, der der aktuellen User-ID entspricht
        const currentUser = data.find(user => user.id === currentUserId);
        if (currentUser) {
          setCurrentUserDetails(currentUser);
        } else {
          console.error('Benutzer mit dieser ID nicht gefunden');
        }
      })
      .catch(error => {
        console.error('Fehler beim Abrufen der Benutzerinformationen:', error);
      });


    // Hole Benutzerinformationen basierend auf dem sender_id der initialMessage
    fetch('http://localhost:8000/api/users/')
      .then(response => response.json())
      .then(users => {
        const senderData = users.find(user => user.id === initialMessage.sender_id);
        if (senderData) {
          setSenderDetails(senderData);
        } else {
          console.error('Sender mit ID', initialMessage.sender_id, 'nicht gefunden.');
        }
      })
      .catch(error => {
        console.error('Fehler beim Abrufen der Benutzer:', error);
      });



      const fetchReactions = (threadId) => {
        fetch('http://localhost:8000/api/thread-reactions/')
          .then(response => response.json())
          .then(data => {
            const reactionsByThread = data.reduce((acc, reaction) => {
              if (!acc[reaction.thread_message]) {  // thread_message statt message
                acc[reaction.thread_message] = {};
              }
              if (!acc[reaction.thread_message][reaction.reaction_type]) {
                acc[reaction.thread_message][reaction.reaction_type] = new Set();
              }
              acc[reaction.thread_message][reaction.reaction_type].add(reaction.user);
              return acc;
            }, {});
            setMessageReactions(reactionsByThread);
          })
          .catch(error => console.error('Error fetching reactions:', error));
      };
      
    // Reaktionen für die ursprüngliche Nachricht laden
    fetchReactions(messageId);
  }, [messageId, initialMessage.sender_id, currentUserId]);

  const handleSendThread = async () => {
    console.log("handleSendThread aufgerufen"); // Debugging
    if ((threadMessage.trim() || attachedFile)) {
      let fileUrl = null;
  
      // Falls eine Datei angehängt ist, hochladen und URL erhalten
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
  
      // Thread-Daten zusammenstellen
      const threadData = {
        message: messageId,
        content: threadMessage.trim() || null,
        file_url: fileUrl || null, 
        sender: currentUserId,
      };
      console.log("daten erstellt"); // Debugging
  
      // Thread-Daten an API senden
      try {
        const response = await fetch('http://localhost:8000/api/threads/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(threadData),
        });
       
        const data = await response.json();
        setLocalThreadMessages((prevMessages) => [...prevMessages, data]);
        console.log("Vor dem Leeren:", threadMessage, attachedFile);
        setThreadMessage('');
        setAttachedFile(null);
        console.log("Nach dem Leeren:", threadMessage, attachedFile); 

        updateThreadCount(messageId);
      } catch (error) {
        console.error('Fehler beim Senden des Threads:', error);
      }
    } else {
      console.error('Thread erfordert entweder Inhalt oder eine Datei.');
    }
  };
  
  

  const handleEditThread = (threadId, content) => {
    setEditingThreadId(threadId);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    fetch(`http://localhost:8000/api/threads/${editingThreadId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: editContent }),
    })
      .then(response => response.json())
      .then(data => {
        setLocalThreadMessages(localThreadMessages.map(thread => 
          thread.id === editingThreadId ? data : thread
        ));
        setEditingThreadId(null);
        setEditContent('');
      })
      .catch(error => {
        console.error("Error saving thread edit:", error);
      });
  };

  const handleDeleteThread = (threadId) => {
    fetch(`http://localhost:8000/api/threads/${threadId}/`, {
      method: 'DELETE',
    })
      .then(() => {
        setLocalThreadMessages(localThreadMessages.filter(thread => thread.id !== threadId));
      })
      .catch(error => {
        console.error("Error deleting thread message:", error);
      });
  };

  const handleReactionClick = (threadId, reactionType) => {
    const userReactions = messageReactions[threadId]?.[reactionType] || new Set();
    const updatedReactions = { ...messageReactions };

    if (userReactions.has(currentUserId)) {
      userReactions.delete(currentUserId);
      removeThreadReaction(threadId, reactionType, currentUserId);
    } else {
      userReactions.add(currentUserId);
      addThreadReaction(threadId, reactionType, currentUserId);
    }

    updatedReactions[threadId] = {
      ...updatedReactions[threadId],
      [reactionType]: userReactions
    };

    setMessageReactions(updatedReactions);
  };

  const addThreadReaction = (threadMessageId, reactionType, user) => {
    const token = localStorage.getItem('access_token');

    fetch('http://localhost:8000/api/thread-reactions/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ thread_message: threadMessageId, reaction_type: reactionType, user: user })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error adding reaction');
        }
    })
    .catch(error => {
        console.error("Error adding thread reaction:", error);
    });
};

  



  
  const removeThreadReaction = (threadMessageId, reactionType, user) => {
    const token = localStorage.getItem('access_token');
    
    fetch(`http://localhost:8000/api/thread-reactions/delete-reaction/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ thread_message: threadMessageId, reaction_type: reactionType, user: user })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error removing reaction');
      }
    })
    .catch(error => {
      console.error("Error removing thread reaction:", error);
    });
  };

  const getEmojiCount = (threadId, reactionType) => {
    return messageReactions[threadId]?.[reactionType]?.size || 0;
  };

  const baseUrl = 'http://localhost:8000';

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
    setThreadMessage((prev) => prev + emojiData.emoji); // Emoji zur Nachricht hinzufügen
    setShowEmojiPicker(false); // Emoji-Picker nach Auswahl schließen

};


  return (
    <div className="threads-container">
      <button onClick={onClose} className="close-button">×</button>
      <div className="thread-header">
        <strong>Replying to:</strong>
        <div className="thread-message">
          <div className="sender-details">
            {senderDetails ? (
              <>
                {senderDetails.profile_picture ? (
                  <img
                    src={senderDetails.profile_picture}
                    alt={`${senderDetails.first_name} ${senderDetails.last_name}`}
                    className="member-profile-image"
                  />
                ) : (
                  <div
                    className="user-profile-placeholder"
                    style={{ backgroundColor: senderDetails.color || '#ccc' }}
                  >
                    {senderDetails.first_name[0]}
                    {senderDetails.last_name[0]}
                  </div>
                )}
                <strong>{senderDetails.first_name} {senderDetails.last_name}</strong>
              </>
            ) : (
              <p>Lädt Benutzerinformationen...</p>
            )}
          </div>
          
          <div className="initial-message">
          <p>{initialMessage.message}</p>
          {initialMessage.file_url ? (
                  (() => {
                    const fileUrl = initialMessage.file_url.toLowerCase();
                    const isImage = fileUrl.endsWith('.png') || 
                                    fileUrl.endsWith('.jpg') || 
                                    fileUrl.endsWith('.jpeg');
                    
                    if (isImage) {
                      return (
                        <img
                          src={`${baseUrl}${initialMessage.file_url}`}
                          alt="Uploaded file"
                          className="Message-Image"
                        />
                      );
                    } else {
                      return (
                        <a href={`${baseUrl}${initialMessage.file_url}`} download>
                          {initialMessage.file_url.split('/').pop()}
                        </a>
                      );
                    }
                  })()
                ) : null}
            </div>

          </div>
        </div>


      <div className="thread-messages">
        {localThreadMessages.map((thread) => (
          <div key={thread.id} className="thread-message">
            {editingThreadId === thread.id ? (
              <div>
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <button onClick={handleSaveEdit}>Speichern</button>
                <button onClick={() => setEditingThreadId(null)}>Abbrechen</button>
              </div>
            ) : (
              <>
           <div className="sender-details">
              {currentUserDetails ? (
                currentUserDetails.profile_picture ? (
                  <img
                    src={currentUserDetails.profile_picture}
                    alt={`${currentUserDetails.first_name} ${currentUserDetails.last_name}`}
                    className="member-profile-image"
                  />
                ) : (
                  <div
                    className="user-profile-placeholder"
                    style={{ backgroundColor: currentUserDetails.color || '#ccc' }}
                  >
                    {currentUserDetails.first_name[0]}{currentUserDetails.last_name[0]}
                  </div>
                )
              ) : (
                <p>Lädt Benutzerinformationen...</p>
              )}
              <strong>{currentUserDetails?.first_name} {currentUserDetails?.last_name}</strong>
            </div>



                <p>{thread.content}</p>
                <div className="file-preview">
                        {thread.file_url ? (
                          (() => {
                            const fileUrl = thread.file_url.toLowerCase();
                            const isImage = fileUrl.endsWith('.png') || 
                            fileUrl.endsWith('.jpg') || 
                            fileUrl.endsWith('.jpeg');
                            
                            if (isImage) {
                              return (
                                <img
                                  src={`${baseUrl}${thread.file_url}`}
                                  alt="Uploaded file"
                                  className="Message-Image"
                                />
                              );
                            } else {
                              return (
                                <a href={`${baseUrl}${thread.file_url}`} download>
                                  {thread.file_url.split('/').pop()}
                                </a>
                              );
                            }
                          })()
                        ) : null}

                  </div>
                <div className="thread-actions">
                  <button onClick={() => handleEditThread(thread.id, thread.content)}>Bearbeiten</button>
                  <button onClick={() => handleDeleteThread(thread.id)}>Löschen</button>
                  {/* Reaktionen */}
                  <div className="message-reactions">
                  <button onClick={() => handleReactionClick(thread.id, 'like')}>
  <span role="img" aria-label="like">👍</span> {getEmojiCount(thread.id, 'like')}
</button>
<button onClick={() => handleReactionClick(thread.id, 'love')}>
  <span role="img" aria-label="love">❤️</span> {getEmojiCount(thread.id, 'love')}
</button>
<button onClick={() => handleReactionClick(thread.id, 'haha')}>
  <span role="img" aria-label="haha">😂</span> {getEmojiCount(thread.id, 'haha')}
</button>
<button onClick={() => handleReactionClick(thread.id, 'wow')}>
  <span role="img" aria-label="wow">😮</span> {getEmojiCount(thread.id, 'wow')}
</button>
<button onClick={() => handleReactionClick(thread.id, 'sad')}>
  <span role="img" aria-label="sad">😢</span> {getEmojiCount(thread.id, 'sad')}
</button>
<button onClick={() => handleReactionClick(thread.id, 'angry')}>
  <span role="img" aria-label="angry">😡</span> {getEmojiCount(thread.id, 'angry')}
</button>

                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Eingabe für neue Thread-Nachricht */}
      <div className="new-thread">
        <input
          type="text"
          value={threadMessage}
          onChange={(e) => setThreadMessage(e.target.value)}
          placeholder="Neue Nachricht..."
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
          {attachedFile.type.startsWith('image/') ? (
            <img
              src={filePreview}
              alt="Preview"
              style={{ width: '200px', height: 'auto' }} // Bild-Vorschau
            />
          ) : (
            <p>{filePreview}</p> // Dateiname anzeigen, wenn es kein Bild ist
          )}
        </div>
      )}

      {showEmojiPicker && (
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      )}
        <button onClick={handleSendThread}>Senden</button>
      </div>
    </div>
  );
};

export default Threads;