import React, { useCallback, useState, useEffect, useRef } from 'react';
import AddUserToChannel from './AddUserToChannel'; 
import './Chat.css';
import Threads from './Threads';
import ChannelInfo from './ChannelInfo';  // ChannelInfo-Komponente importieren
import EmojiPicker from 'emoji-picker-react';
import SelectedUserProfile from './SelectedUserProfile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faCaretDown, faSmile, faEllipsisVertical,faEdit, faTrash, faPaperclip, faPaperPlane } from '@fortawesome/free-solid-svg-icons';



const Chat = ({ selectedChat, setUnreadCount }) => {
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
  const [isBackgroundDark, setIsBackgroundDark] = useState(false);
  const [isDropdownProfileOpen, setIsDropdownProfileOpen] = useState(false);
  const [activeIcon, setActiveIcon] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [hideHoverIcons, setHideHoverIcons] = useState(false);
  const [hideHoverActions, setHideHoverActions] = useState(false);
  const chatEndRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState({});
  const [reactionUserNames, setReactionUserNames] = useState({});



  useEffect(() => {
    const savedChatId = localStorage.getItem('selectedChatId');
    scrollToBottom(); // Hier rufst du die Funktion auf
    if (savedChatId) {
      // Hier solltest du eine Funktion aufrufen, um den Chat mit der ID `savedChatId` zu laden
      // setSelectedChat({ ... }) mit den Daten für den Chat
    }
  }, []);

    // Funktion, um den Chat automatisch ans Ende zu scrollen
    const scrollToBottom = () => {
      if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
  };

  

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
    const fetchReactionUsers = async () => {
      // currentUserId aus localStorage oder deinem State abrufen
      const currentUserId = localStorage.getItem('user_id'); // Beispiel: Abruf der User-ID aus dem localStorage
  
      Object.keys(messageReactions).forEach(async messageId => {
        // Für jede Reaktionsart Benutzer abrufen und speichern
        const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
        
        reactionTypes.forEach(async reactionType => {
          const reactionText = await getReactionUsersWithNames(messageReactions, messageId, reactionType, currentUserId);
    
          // Benutzer speichern unter einer Kombination aus messageId und reactionType
          setReactionUserNames(prevState => ({
            ...prevState,
            [`${messageId}_${reactionType}`]: reactionText,
          }));
        });
      });
    };
  
    fetchReactionUsers();
  }, [messageReactions]); // Abhängig von den Reaktionen neu laden
  
  
  
  

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
              // Hier den unreadCount erhöhen, wenn der aktuelle Benutzer nicht der Sender ist
              const currentUserId = parseInt(localStorage.getItem('user_id'), 10);  // Aktueller Benutzer als Zahl
              console.log("Aktueller Benutzer (ID):", currentUserId);
              console.log("Absender der Nachricht (Sender):", data.sender_id);  // Absender-ID
              // Überprüfen, ob der Sender nicht der aktuelle Benutzer ist
              if (data.sender && typeof data.sender_id === 'number' && data.sender_id !== currentUserId) {
                console.log("Der Sender ist ein anderer Benutzer. UnreadCount wird erhöht.");
                setUnreadCount(prevCount => prevCount + 1);
              } else {
                console.log("Der Sender ist der aktuelle Benutzer. UnreadCount wird nicht erhöht.");
              }


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

            case 'react':
              if (data.message_id && data.reaction_type ) {
                console.log('Reaktion empfangen:', data);
                console.log("Anderer Nutzer", data.sender_id);
                // Hol den aktuellen Benutzer
                const currentUserId = parseInt(localStorage.getItem('user_id'), 10); // Aktueller Benutzer als Zahl
                console.log("Aktueller Benutzer (ID):", currentUserId);
              
                // Aktualisiere die Reaktionen direkt im Frontend
                setMessageReactions(prevReactions => {
                  const updatedReactions = { ...prevReactions };
                  const messageReactions = updatedReactions[data.message_id] || {};
                  const reactionUsers = messageReactions[data.reaction_type] || new Set();
            

                    // Wenn eine Reaktion hinzugefügt wurde
                    reactionUsers.add(data.sender_id);

             
            
                  // Aktualisiere die Reaktionen
                  messageReactions[data.reaction_type] = reactionUsers;
                  updatedReactions[data.message_id] = messageReactions;
            
                  return updatedReactions;
                });
            
                // Optionale Aktion, um die Nachrichten neu zu laden
                refreshMessages();
                fetchReactions();
                let notificationIncreased = false;

                if (data.sender_id !== currentUserId && !notificationIncreased) {
                    console.log("Eine Reaktion von einem anderen Benutzer wurde hinzugefügt. UnreadCount wird erhöht.");
                    setUnreadCount(prevCount => prevCount + 1);
                    notificationIncreased = true;
                }
         

              } else {
                console.error('Ungültige Daten für Reaktion:', data);
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
  
                            scrollToBottom();
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
 // eslint-disable-next-line 
 }, [selectedChat]);



  useEffect(() => {
    if (selectedChat) {
      fetch(`http://localhost:8000/api/messages/${selectedChat.data.id}/`)
        .then(response => response.json())
        .then(data => {
          console.log('Initiale Nachrichten laden:', data);
              setTimeout(() => {
        scrollToBottom();
    }, 5); // 100 Millisekunden Delay
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
        // Reaktion entfernen
        userReactions.delete(currentUserId);

        handleRemoveReaction(messageId, reactionType) // Entferne die Reaktion aus der Datenbank
            .then(() => {
                console.log(`Successfully removed reaction for messageId: ${messageId}, reactionType: ${reactionType}`);
                // Aktualisiere den State hier nach erfolgreichem Entfernen
                if (userReactions.size === 0) {
                    delete updatedReactions[messageId][reactionType];
                }
                updatedReactions[messageId] = {
                    ...updatedReactions[messageId],
                    [reactionType]: userReactions,
                };
                setMessageReactions(updatedReactions);
            })
            .catch((error) => {
                console.error(`Error removing reaction for messageId: ${messageId}:`, error);
            });
    } else {
        // Reaktion hinzufügen
        userReactions.add(currentUserId);
        addReaction(messageId, reactionType, currentUserId) // Füge die Reaktion zur Datenbank hinzu
            .then(() => {
                console.log(`Successfully added reaction for messageId: ${messageId}, reactionType: ${reactionType} User: ${currentUserId}`);
                // Aktualisiere den State hier nach erfolgreichem Hinzufügen
                updatedReactions[messageId] = {
                    ...updatedReactions[messageId],
                    [reactionType]: userReactions,
                };
                setMessageReactions(updatedReactions);
            })
            .catch((error) => {
                console.error(`Error adding reaction for messageId: ${messageId}:`, error);
            });
    }

    // WebSocket-Nachricht senden
    if (socket) {
      const messageData = {
          type: 'react',
          message_id: messageId,
          reaction_type: reactionType,
          sender_id: currentUserId,
          added: !userReactions.has(currentUserId), // Markiere, ob es hinzugefügt oder entfernt wurde
      };
  
      console.log('Sending to WebSocket:', messageData); // Ausgabe der Daten vor dem Senden
      socket.current.send(JSON.stringify(messageData));
  } else {
      console.error('WebSocket is not open or not defined');
  }
};

  


  const handleRemoveReaction = (messageId, reactionType) => {
    return new Promise((resolve, reject) => {
        const userReactions = messageReactions[messageId]?.[reactionType] || new Set();
        const updatedReactions = { ...messageReactions };

            removeReaction(messageId, reactionType, currentUserId) // Stelle sicher, dass dies ein Promise zurückgibt
                .then(() => {
                    // Aktualisiere die UI nur bei erfolgreichem Entfernen
                    if (userReactions.size === 0) {
                        delete updatedReactions[messageId][reactionType];
                    }
                    updatedReactions[messageId] = {
                        ...updatedReactions[messageId],
                        [reactionType]: userReactions,
                    };
                    setMessageReactions(updatedReactions);
                    resolve(); // Lösung des Promises
                })
                .catch(error => {
                    console.error('Error while removing reaction:', error);
                    reject(error); // Ablehnung des Promises bei Fehler
                });
        
    });
};





const addReaction = (messageId, reactionType, user) => {
  const token = localStorage.getItem('access_token');
  
  return fetch('http://localhost:8000/api/reactions/', { // Hier wird ein Promise zurückgegeben
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
  
  return fetch(`http://localhost:8000/api/reactions/delete-reaction/`, { // Hier wird ein Promise zurückgegeben
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
    return response.status !== 204 ? response.json() : null;
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


        // Zähler für ungelesene Nachrichten erhöhen
       // setUnreadCount(prevCount => prevCount + 1);

        setNewMessage('');
        setAttachedFile(null);
        setTimeout(() => {
          scrollToBottom();
      }, 100); // 100 Millisekunden Delay
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
    console.log("Opening Add User Modal");
    setIsAddUserModalOpen(true);
    setIsBackgroundDark(true); // Hintergrund dunkel machen
  };
  
  const closeAddUserModal = () => {
    setIsAddUserModalOpen(false);
    setIsBackgroundDark(false); // Hintergrund zurücksetzen
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
    setHideHoverActions(true); 
    console.log(message.message); // Ausgabe der Nachricht zur Überprüfung
    if (selectedMessageId === message.id) {
      // Schließen des Threads, wenn er bereits geöffnet ist
      setSelectedMessage(null);
      setSelectedMessageId(null);
      setSenderId(null);
      setShowThreads(false);
    } else {
      // Öffnen des Threads für die spezifische Nachricht
      setSelectedMessage(message);
      setSelectedMessageId(message.id); // Hier sicherstellen, dass die ID korrekt übergeben wird
      console.log(message.id); // Ausgabe der ID zur Überprüfung
      setSenderId(message.sender_id); // Hier sicherstellen, dass die ID korrekt übergeben wird
      setShowThreads(true);
      console.log(message.id); // Ausgabe der ID zur Überprüfung
      console.log(message.sender_id); // Ausgabe der ID zur Überprüfung
    }
  } else {
    console.error('Message or Message ID is undefined');
  }
};


const handleCloseThreads = () => {
  setShowThreads(false);
  setSelectedMessage('');
  setHideHoverActions(false); 
  setActiveIcon(true);
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

  const handleDropdownProfileToggle = () => {
    setIsDropdownProfileOpen(!isDropdownProfileOpen);
  };

  const closeModal = () => {
    setIsDropdownProfileOpen(false);
  };
  

const baseUrl = 'http://localhost:8000';

const toggleEmojiPicker = () => {
  setHideHoverIcons(true); // Nur Icons ausblenden
  setActiveIcon(activeIcon === 'emoji' ? null : 'emoji');
};


const toggleActions = () => {
  setHideHoverIcons(true); // Nur Icons ausblenden
  setActiveIcon(activeIcon === 'actions' ? null : 'actions');
};

  // Funktion zum Schließen aller Optionen
  const closeAll = () => {
    setHideHoverIcons(false);
    setShowEmojiPicker(false);
    setActiveIcon(false);
  };

  const handleMouseEnter = (id) => {
    setHoveredMessageId(id);
  };
  
  const handleMouseLeave = () => {
    setHoveredMessageId(null);
  };

  const handleAttachmentClick = (fileUrl) => {
    // Hier kannst du die Logik implementieren, um den Anhang anzuzeigen.
    // Zum Beispiel könntest du einen Modal öffnen, der den Anhang anzeigt.
    window.open(fileUrl, '_blank'); // Öffne den Anhang in einem neuen Tab
  };
  
  const updateThreadCount = (messageId) => {
    setMessages((prevMessages) => 
      prevMessages.map((msg) => 
        msg.id === messageId ? { ...msg, thread_count: msg.thread_count + 1 } : msg
      )
    );
  };

  const handleRemoveFile = () => {
    setAttachedFile(null); // Entfernt die Datei
    setFilePreview(null);  // Entfernt die Vorschau
  };

    const handleToggleProfile = () => {
    setIsProfileOpen((prevState) => !prevState);
  };

  // Funktion zum Schließen des Profils (z.B. wenn das Modal geschlossen wird)
  const handleCloseProfile = () => {
    setIsProfileOpen(false);
  };

  const getTotalReactions = (messageId) => {
    const emojiTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    return emojiTypes.reduce((total, type) => total + getEmojiCount(messageId, type), 0);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


const showReactionTooltip = (messageId, reactionType) => {
  setTooltipVisible((prev) => ({ ...prev, [messageId]: reactionType }));
};

const hideReactionTooltip = (messageId) => {
  setTooltipVisible((prev) => {
    const newState = { ...prev };
    delete newState[messageId];
    return newState;
  });
};

const isTooltipVisible = (messageId, reactionType) => {
  return tooltipVisible[messageId] === reactionType;
};

const getReactionUsersWithNames = async (reactions, messageId, reactionType, currentUserId) => {
  if (!reactions || !reactions[messageId] || !reactions[messageId][reactionType]) {
    return '';
  }

  const userIds = Array.from(reactions[messageId][reactionType] || []);

  try {
    const response = await fetch('http://localhost:8000/api/users/');
    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Benutzerdaten');
    }

    const usersData = await response.json();

    // Benutzerinformationen für die IDs der User holen, die auf die Nachricht reagiert haben
    const reactingUsers = usersData.filter(user => userIds.includes(user.id));
    // Konvertiere currentUserId in einen String
    const currentUserIdString = String(currentUserId);

    // Den aktuellen Benutzer aus der Liste der reagierten Benutzer entfernen
    const currentUserIndex = reactingUsers.findIndex(user => String(user.id) === currentUserIdString);

    let reactionText = '';

    if (currentUserIndex !== -1) {
      const currentUser = reactingUsers.splice(currentUserIndex, 1)[0]; // Aktuellen Benutzer entfernen

      // Erstelle den Reaktionstext abhängig von der Anzahl der anderen Benutzer
      if (reactingUsers.length === 0) {
        reactionText = 'You reacted';
      } else if (reactingUsers.length === 1) {
        reactionText = `You and ${reactingUsers[0].first_name} ${reactingUsers[0].last_name} reacted`;
      } else {
        const otherUserNames = reactingUsers.map(user => `${user.first_name} ${user.last_name}`);
        reactionText = `You and ${otherUserNames.join(', ')} reacted`;
      }
    } else {
      if (reactingUsers.length === 1) {
        reactionText = `${reactingUsers[0].first_name} ${reactingUsers[0].last_name} reacted`;
      } else if (reactingUsers.length > 1) {
        const otherUserNames = reactingUsers.map(user => `${user.first_name} ${user.last_name}`);
        const lastUser = otherUserNames.pop();
        reactionText = `${otherUserNames.join(', ')} and ${lastUser} reacted`;
      }
    }

    return reactionText;

  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzerdaten:', error);
    return '';
  }
};


  return (
    <div className={`chat ${isBackgroundDark ? 'dark-background' : ''}`}>   
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


              <div className="dropdown-icon" onClick={handleToggleProfile}>
              <FontAwesomeIcon icon={faCaretDown} className="navbar-icon" />
            </div>
            {isProfileOpen && (
        <SelectedUserProfile
          user={partner}
          onClose={handleCloseProfile}
          onMessageClick={() => {
            /* Logik zum Senden einer Nachricht an den User */
          }}
        />
      )}
            </div>
            
          ) : (
            <div>Partnerdaten werden geladen...</div>
          )
   
        ) 
        : (
          

  <div className="chat-header-channel">
    <div className="channel-left">   

  <div className="channel-title" >{selectedChat.data.name}</div>


  <div className="dropdown-icon">
        <FontAwesomeIcon icon={faCaretDown} className="navbar-icon" onClick={handleDropdownProfileToggle} />
      </div>

      {isDropdownProfileOpen && (
  <div className="modal-wrapper">
    <div className="modal-overlay" onClick={closeModal}></div>
    <div className="modal-content">
      <ChannelInfo
        channelName={selectedChat.data.name}  // Name des Channels
        description={selectedChat.data.description}  // Beschreibung des Channels
        channelId={selectedChat.data.id}  // Channel ID
        creator={selectedChat.data.creator}  // Beispielwert für den Ersteller
        onClose={closeModal}  // Zum Schließen des Modals
      />
      <button className="close-modal-button" onClick={closeModal}>X</button>
    </div>
  </div>
)}
  
  </div>

  <div className="channel-right">  
  <div className="channel-members-header">
  {members.length > 0 ? (
    members.map((member) => (
      <div key={member.id} className="channel-member">
        {member.profile_picture ? (
          <img
            src={member.profile_picture}
            alt={`${member.first_name} ${member.last_name}`}
            className="user-profile-placeholder2"
          />
        ) : (
          <div
            className="user-profile-placeholder2"
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


<FontAwesomeIcon icon={faUserPlus} className="user-icon" onClick={openAddUserModal} />


{isAddUserModalOpen && (
        <>
          <div className="overlay" onClick={closeAddUserModal}></div>
          <AddUserToChannel
            channelId={selectedChat.data.id}
            channelName={selectedChat.data.name}
            closeModal={closeAddUserModal}
            addUserToChannel={handleAddUserToChannel}
          />
        </>
      )}
</div>
</div>
        )}
      </div>
   



      <div className="chat-body">
  {messages.length === 0 ? (
    <div className="no-messages">Keine Nachrichten</div>
  ) : (
    <div className="chat-container">


      <div className="messages">
        {messages.map((message, index) => {
          // Sende-Details abrufen
          const senderDetails = members.find((member) => member.id === message.sender_id);

            // Datum formatieren
            const messageDate = new Date(message.timestamp); // assuming message.timestamp is in ISO format
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            // Funktion zur Überprüfung, ob es sich um heute oder gestern handelt
            const formatDate = (date) => {
              if (
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
              ) {
                return "Today";
              } else if (
                date.getDate() === yesterday.getDate() &&
                date.getMonth() === yesterday.getMonth() &&
                date.getFullYear() === yesterday.getFullYear()
              ) {
                return "Yesterday";
              } else {
                return date.toLocaleDateString(); // Format DD.MM.YYYY
              }
            };

          
          return (
            <div key={message.id} className={getMessageClass(message.sender_id)}>

            {index === 0 || new Date(messages[index - 1].timestamp).toLocaleDateString() !== messageDate.toLocaleDateString() ? (
                <div className="date-separator">
                  <span>{formatDate(messageDate)}</span>
                </div>
              ) : null}             {/* Datum nur anzeigen, wenn es sich um eine neue Gruppe von Nachrichten handelt */}

        <div className="chat-wrapper" onMouseEnter={() => handleMouseEnter(message.id)} onMouseLeave={handleMouseLeave} >
              <div className="messages-wrapper">

   
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
               

                {selectedMessageId === message.id && showThreads && (

              
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
                  updateThreadCount={updateThreadCount} 
                  />
                
                )}



      
              </div>


              

              {editingMessageId === message.id ? (
                 <div className="message-edit">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button onClick={handleSaveMessage}>Speichern</button>
                  <button onClick={handleCancelEdit}>Abbrechen</button>
                </div>
              ) : (




                <div className="Message-Text" >


                <div className="Message-Sender">
                  <strong>{message.sender}:</strong>
                  <span className="message-time">{formatTimestamp(message.timestamp)}</span>
              </div>
        
  
                  {message.message}
                      {/* Überprüfen, ob die Datei vorhanden ist */}
                      {message.file_url && (
                        <div className="Message-File">
                        {message.file_url.endsWith('.png') ||
                        message.file_url.endsWith('.jpg') ||
                        message.file_url.endsWith('.jpeg') ||
                        message.file_url.endsWith('.JPG') ||
                        message.file_url.endsWith('.PNG') ||
                        message.file_url.endsWith('.JPEG') ? (
                          <img
                            src={`${baseUrl}${message.file_url}`}
                            alt="Uploaded file"
                            className="Message-Image"
                          />
                        ) : (
                          <div className="attachment-link" onClick={() => handleAttachmentClick(`${baseUrl}${message.file_url}`)}>
                            <FontAwesomeIcon icon={faPaperclip} style={{ color: 'white' }} /> {/* Emoji hier einfügen */}
                            <span style={{ color: 'white', marginLeft: '5px' }}>Attachment</span> {/* Anhangstext */}
                          </div>
                        )}
                      </div>

                      )}

<div className={`message-hover-actions ${hoveredMessageId === message.id && !hideHoverActions ? 'visible' : ''}`}>
{hideHoverIcons && (
          <button className="close-button-message" onClick={closeAll}>
            <span>x</span>
          </button>
        )}
{!hideHoverIcons && (

  
    <div className="message-icon">
                  <button
                    className="speech-bubble-icon"
                    onClick={() => handleOpenThreads(message)}
                  >
                    <i className="fas fa-comment-dots"></i>
                  </button>
                </div>
)}
    {/* Smiley-Icon */}
    {!hideHoverIcons && (
    <div className="message-icon">
      <button onClick={toggleEmojiPicker}>
        <FontAwesomeIcon icon={faSmile} />
      </button>
    </div>
  )}

{activeIcon === 'emoji' && (
  <div className="emoji-picker-dropdown">
    <button className="emoji-button" onClick={() => handleReactionClick(message.id, 'like')}>
      <span role="img" aria-label="like" style={{ marginRight: '2px' }}>👍</span>
    </button>
    <button className="emoji-button" onClick={() => handleReactionClick(message.id, 'love')}>
      <span role="img" aria-label="love" style={{ marginRight: '2px' }}>❤️</span>
    </button>
    <button className="emoji-button" onClick={() => handleReactionClick(message.id, 'haha')}>
      <span role="img" aria-label="haha" style={{ marginRight: '2px' }}>😂</span>
    </button>
    <button className="emoji-button" onClick={() => handleReactionClick(message.id, 'wow')}>
      <span role="img" aria-label="wow" style={{ marginRight: '2px' }}>😮</span>
    </button>
    <button className="emoji-button" onClick={() => handleReactionClick(message.id, 'sad')}>
      <span role="img" aria-label="sad" style={{ marginRight: '2px' }}>😢</span>
    </button>
    <button className="emoji-button" onClick={() => handleReactionClick(message.id, 'angry')}>
      <span role="img" aria-label="angry" style={{ marginRight: '2px' }}>😡</span>
    </button>
  </div>
)}



    {/* Drei-Punkte-Icon */}
    {!hideHoverIcons && message.sender_id === currentUserId && (
  <div className="message-icon">
    <button onClick={toggleActions}>
      <FontAwesomeIcon icon={faEllipsisVertical} />
    </button>
  </div>
)}
  
      {/* Aktionen Dropdown */}
      {activeIcon === 'actions' && message.sender_id === currentUserId && (
  <div className="message-actions-dropdown">
    <button className="button-edit-delete" onClick={() => handleEditMessage(message.id, message.message)}>
      <FontAwesomeIcon icon={faEdit} /> {/* Bearbeiten-Icon */}
    </button>
    <button className="button-edit-delete" onClick={() => handleDeleteMessage(message.id)}>
      <FontAwesomeIcon icon={faTrash} /> {/* Löschen-Icon */}
    </button>
  </div>
)}
  </div>


                  
             


                </div>
              )}
                  </div>



                  <div
  className={`message-bottom ${
    message.sender_id === currentUserId ? 'message-right' : 'message-left'
  }`}
>
  <div className={`message-reactions ${getTotalReactions(message.id) === 0 ? 'no-reactions' : ''}`}>
  <div class="reaction-wrapper">
    {getEmojiCount(message.id, 'like') > 0 && (
      <span
        className="emoji-display"
        onClick={() =>
          handleReactionClick(message.id, 'like', getEmojiCount(message.id, 'like'))
        }     
        onMouseEnter={() => showReactionTooltip(message.id, 'like')}
        onMouseLeave={() => hideReactionTooltip(message.id, 'like')}
      >
        <span className="emoji" role="img" aria-label="like">👍</span>
        <span class="reaction-count">{getEmojiCount(message.id, 'like')}</span>

        {/* Tooltip */}
        {isTooltipVisible(message.id, 'like') && (
        <div className="reaction-tooltip">
          <span className="reaction-text" role="img" aria-label="like">👍</span>
           <div class="user-text">
         {reactionUserNames[`${message.id}_like`] || 'Laden...'} {/* Benutzer für "like" */}
         </div> 
        </div>
          )}
      </span>
    )}
    {getEmojiCount(message.id, 'love') > 0 && (
        <span
          className="emoji-display"
          onClick={() =>
            handleReactionClick(message.id, 'love', getEmojiCount(message.id, 'love'))
          }
          onMouseEnter={() => showReactionTooltip(message.id, 'love')}
          onMouseLeave={() => hideReactionTooltip(message.id, 'love')}
        >
          <span className="emoji" role="img" aria-label="love">❤️</span>
          <span class="reaction-count">{getEmojiCount(message.id, 'love')}</span>

              {isTooltipVisible(message.id, 'love') && (
            <div className="reaction-tooltip">
             <span className="reaction-text" role="img" aria-label="like">❤️</span>
              <div class="user-text">
              {reactionUserNames[`${message.id}_love`] || 'Laden...'} {/* Benutzer für "love" */}
            </div>
            </div>
          )}
        </span>
    )}
    {getEmojiCount(message.id, 'haha') > 0 && (
        <span
          className="emoji-display"
          onClick={() =>
            handleReactionClick(message.id, 'haha', getEmojiCount(message.id, 'haha'))
          }
          onMouseEnter={() => showReactionTooltip(message.id, 'haha')}
          onMouseLeave={() => hideReactionTooltip(message.id, 'haha')}
        >
          <span className="emoji" role="img" aria-label="haha">😂</span>
          <span class="reaction-count">{getEmojiCount(message.id, 'haha')}</span>

            {isTooltipVisible(message.id, 'haha') && (
              <div className="reaction-tooltip">
                     <span className="reaction-text" role="img" aria-label="like">😂</span>
                     <div class="user-text">
                {reactionUserNames[`${message.id}_haha`] || 'Laden...'} {/* Benutzer für "love" */}
              </div>
              </div>
            )}
        </span>
    )}
    {getEmojiCount(message.id, 'wow') > 0 && (
        <span
          className="emoji-display"
          onClick={() =>
            handleReactionClick(message.id, 'wow', getEmojiCount(message.id, 'wow'))
          }
          onMouseEnter={() => showReactionTooltip(message.id, 'wow')}
          onMouseLeave={() => hideReactionTooltip(message.id, 'wow')}
        >
          <span className="emoji" role="img" aria-label="wow">😮</span>
          <span class="reaction-count">{getEmojiCount(message.id, 'wow')}</span>

          {isTooltipVisible(message.id, 'wow') && (
            <div className="reaction-tooltip">
                   <span className="reaction-text" role="img" aria-label="like">😮</span>
                   <div class="user-text">
              {reactionUserNames[`${message.id}_wow`] || 'Laden...'} {/* Benutzer für "love" */}
            </div>
            </div>
          )}
        </span>
    )}
    {getEmojiCount(message.id, 'sad') > 0 && (
        <span
          className="emoji-display"
          onClick={() =>
            handleReactionClick(message.id, 'sad', getEmojiCount(message.id, 'sad'))
          }
          onMouseEnter={() => showReactionTooltip(message.id, 'sad')}
          onMouseLeave={() => hideReactionTooltip(message.id, 'sad')}
        >
          <span className="emoji" role="img" aria-label="sad">😢</span>
          <span class="reaction-count">{getEmojiCount(message.id, 'sad')}</span>

          {isTooltipVisible(message.id, 'sad') && (
            <div className="reaction-tooltip">
                   <span className="reaction-text" role="img" aria-label="like">😢</span>
                   <div class="user-text">
              {reactionUserNames[`${message.id}_sad`] || 'Laden...'} {/* Benutzer für "love" */}
            </div>
            </div>
          )}
        </span>
    )}
    {getEmojiCount(message.id, 'angry') > 0 && (
        <span
          className="emoji-display"
          onClick={() =>
            handleReactionClick(message.id, 'angry', getEmojiCount(message.id, 'angry'))
          }
          onMouseEnter={() => showReactionTooltip(message.id, 'angry')}
          onMouseLeave={() => hideReactionTooltip(message.id, 'angry')}
        >
          <span className="emoji" role="img" aria-label="angry">😡</span>
          <span class="reaction-count">{getEmojiCount(message.id, 'angry')}</span>

          {isTooltipVisible(message.id, 'angry') && (
            <div className="reaction-tooltip">
                        <span className="reaction-text" role="img" aria-label="like">😡</span>
                        <div class="user-text">
              {reactionUserNames[`${message.id}_angry`] || 'Laden...'} {/* Benutzer für "love" */}
            </div>
            </div>
          )}
        </span>
    )}
  </div>



  <div className="thread-count" onClick={() => handleOpenThreads(message)}>
    {message.thread_count > 0 
      ? `${message.thread_count} ${message.thread_count === 1 ? 'response' : 'responses'}` 
      : ''}
  </div>
</div>
</div>

                <div ref={chatEndRef} />
            </div>
          );
        })}
      </div>
    </div>
  )}
</div>

{showEmojiPicker && (
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      )}

<div className="chat-text">

<div className="chat-footer">

<button className="attachment-btn" onClick={() => document.getElementById('file-upload').click()}>
      <FontAwesomeIcon icon={faPaperclip} />
    </button>
  
    <input
      id="file-upload"
      type="file"
      style={{ display: 'none' }}  // Versteckt das Dateiupload-Feld
      onChange={handleFileChange}  // Datei in den State setzen
    />


  <div className="footer-left">
      <input
        type="text"
        className="message-input"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Write a message..."
      />


<button className="send-btn" onClick={() => setShowEmojiPicker((prev) => !prev)}>
      <FontAwesomeIcon icon={faSmile} /> 
      </button>

  </div>


  <div className="footer-right">
  <button className="send-btn" onClick={handleSendMessage}>
  <FontAwesomeIcon icon={faPaperPlane} /> 
  </button>
      </div>      
    </div>



    <div className="chat-attach">
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
            <button className="remove-file-btn" onClick={handleRemoveFile}>
        &times;
      </button>
    </div>
  )}



</div>

</div>
</div>
</div>  
  );
  
};

export default Chat;
