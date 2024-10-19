import React, { useState, useEffect, useRef } from 'react';
import './Threads.css';
import EmojiPicker from 'emoji-picker-react';
import ThreadHoverActions from './ThreadHoverActions';
import ThreadBottom from './ThreadBottom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile, faPaperclip, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const Threads = ({ 
  initialMessage, 
  getMessageClass,
  handleOpenThreads,
  selectedThread,
  onClose,
  messageId, 
  currentUserId,
  handleRemoveFile,
  setUnreadCount
}) => {
  const threadSocket = useRef(null);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [threadMessage, setThreadMessage] = useState('');
  const [senderDetails, setSenderDetails] = useState(null);
  const [threadReactions, setThreadReactions] = useState({});
  const [attachedFile, setAttachedFile] = useState(null); 
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hoveredThreadId, setHoveredThreadId] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null); // Speichert den ausgewählten Thread
  const [localThreadMessages, setLocalThreadMessages] = useState([]);
  const [activeThreadIcon, setActiveThreadIcon] = useState(null);
  const [hideThreadHoverIcons, setHideThreadHoverIcons] = useState(false);
  const chatEndRef = useRef(null);
  const [reactionThreadUserNames, setReactionThreadUserNames] = useState({});
  const [threadTooltipVisible, setThreadTooltipVisible] = useState({});
  const [users, setUsers] = useState([]);
  const [threads, setThreads] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const savedChatId = localStorage.getItem('selectedChatId');
    scrollToBottom(); 
    if (savedChatId) {
    }
  }, []);

    // Funktion, um den Chat automatisch ans Ende zu scrollen
  const scrollToBottom = () => {
      if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
  };

  useEffect(() => {
      if (!selectedThread || !selectedThread.id) {
        console.error('selectedThread is undefined or null');
        return;
      }
    console.log('Selected Thread:', selectedThread); // Debugging

      const token = localStorage.getItem('access_token');

      const wsUrlThread = `ws://connect.julianschaepermeier.com/ws/threads/${selectedThread.id}/?token=${token}`;
      console.log('WebSocket URL:', wsUrlThread);
  
      threadSocket.current = new WebSocket(wsUrlThread);
  
      threadSocket.current.onopen = () => {
        console.log('Thread WebSocket-Verbindung geöffnet');
        setIsConnected(true);
      };
  
      threadSocket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Thread WebSocket-Nachricht empfangen:', data);
  
        switch (data.action) {
          case 'new':
            if (data.content && data.message_id) {
              console.log('Neue Thread-Nachricht empfangen:', data);
              
              fetch(`${process.env.REACT_APP_API_URL}api/thread-reactions/?message=${data.message_id}`)
              .then(response => response.json())
              .then(reactionsData => {
                // Aktualisiere den Zustand mit dem neuen Thread und seinen Reaktionen
                setThreads((prevMessages) => [
                  ...prevMessages,
                  { 
                    id: data.message_id, // Verwende die ID des neuen Threads
                    content: data.content, // Der Inhalt des neuen Threads
                    sender: data.sender, // Sender aus dem Thread
                    reactions: reactionsData // Die Reaktionen für den neuen Thread
                  }
                ]);

                if (data.sender && typeof data.sender_id === 'number' && data.sender_id !== currentUserId) {
                  console.log("Der Sender ist ein anderer Benutzer. UnreadCount wird erhöht.");
                  setUnreadCount(prevCount => prevCount + 1);
                } else {
                  console.log("Der Sender ist der aktuelle Benutzer. UnreadCount wird nicht erhöht.");
                }
            
                // Rufe die Funktion auf, um den Thread mit der aktuellen message_id zu aktualisieren
                refreshThreads(data.message_id); 
                scrollToBottom(); // Scroll nach unten
                  })
                  .catch(error => console.error('Fehler beim Abrufen der Reaktionen für die neue Nachricht:', error));
          } else {
              console.error('Nachrichtendaten für neue Aktion fehlen oder sind falsch:', data);
          }
          break;

  
          case 'delete':
              if (data.message_id) {
                console.log('Nachricht löschen:', data);
                // Aktualisiere den Zustand für die Threads, indem die Nachricht entfernt wird
                setThreads((prevThreads) =>
                  prevThreads.filter((thread) => thread.id !== data.message_id)
                );
                refreshThreads();
                // Optional: Wenn du auch eine Funktion zum Aktualisieren der Threads verwenden möchtest
              } else {
                console.error('Message ID for delete action is missing or incorrect:', data);
              }
              break;
  
          case 'react':
            // Reaktion auf Thread-Nachricht verarbeiten
              if (data.reaction_type) {
                console.log('Reaktion empfangen:', data);
                console.log("Anderer Nutzer", data.sender_id);

                // Hol den aktuellen Benutzer
                const currentUserId = parseInt(localStorage.getItem('user_id'), 10); // Aktueller Benutzer als Zahl
                console.log("Aktueller Benutzer (ID):", currentUserId);

                // Aktualisiere die Reaktionen direkt im Frontend
                setThreadReactions(prevReactions => {
                    const updatedReactions = { ...prevReactions };
                    const threadId = data.message_id; // Die ID der Thread-Nachricht
                    const threadReactions = updatedReactions[threadId] || {};
                    const reactionUsers = threadReactions[data.reaction_type] || new Set();

                    // Wenn eine Reaktion hinzugefügt wurde
                    reactionUsers.add(data.sender_id);

                    // Aktualisiere die Reaktionen
                    threadReactions[data.reaction_type] = reactionUsers;
                    updatedReactions[threadId] = threadReactions;

                    return updatedReactions;
                });
      

                // Optionale Aktion, um die Nachrichten neu zu laden
                refreshThreads();
                fetchReactions(); // Hole die Reaktionen für den Thread nach der Aktualisierung

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


            case 'edit':
                console.log('Received WebSocket edit action:', data);
                // Thread-Nachricht bearbeiten
                if (data.content && data.message_id) {
                  console.log('Nachricht bearbeiten:', data);
                  
                  // Aktualisiere die Thread-Nachrichten basierend auf der message_id
                  setThreads((prevThreads) =>
                    prevThreads.map((msg) =>
                      msg.id === data.message_id ? { ...msg, content: data.content } : msg
                    )
                  );
                  refreshThreads();  // Ist dieses refreshThreads notwendig?
                } else {
                  console.error('Message data for edit action is missing or incorrect:', data);
                }
                break;


  
          default:
            console.error('Unbekannte Aktion:', data.action);
        }
      };

      const refreshThreads = () => {
        console.log("Selected Thread:", selectedThread);
        if (!selectedThread) {
            console.warn('Keine gültige messageId, Threads werden nicht aktualisiert.');
            return; // Abbrechen, wenn die messageId leer ist
        }
    
        // Threads für die ausgewählte Nachricht abrufen
        fetch(`${process.env.REACT_APP_API_URL}api/threads/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Netzwerkantwort war nicht ok');
                }
                return response.json();
            })
            .then(threadData => {
                console.log('Thread Data:', threadData); // Debugging
    
                // Überprüfen, ob threadData ein Array ist oder nicht
                if (!Array.isArray(threadData)) {
                    threadData = [threadData]; // Konvertiere das Objekt in ein Array
                }
    
                // Filtere Threads basierend auf der message_id
                const filteredThreads = threadData.filter(thread => thread.message === selectedThread.id);
                console.log('Filtered Threads:', filteredThreads); // Überprüfe die gefilterten Threads
    
                // Falls keine Threads vorhanden sind, setze Threads leer
                if (filteredThreads.length === 0) {
                    setThreads([]); // Leere Threads setzen
                    setLocalThreadMessages([]); // Lokale Threads leeren
                    return; // Rückgabe, wenn keine neuen Threads vorhanden sind
                }
    
                // User-IDs sammeln, um nur einmal Benutzerinformationen zu laden
                const userIds = filteredThreads.map(thread => Number(thread.sender));
    
                // Benutzerinformationen basierend auf den User-IDs abrufen
                fetch(`${process.env.REACT_APP_API_URL}api/users/`)
                    .then(response => response.json())
                    .then(users => {
                        console.log('Fetched Users:', users); // Debugging
    
                        // Filtere die Benutzer, die in userIds enthalten sind
                        const threadsUsers = users.filter(user => userIds.includes(Number(user.id)));
    
                        // Überprüfe, ob Benutzer gefunden wurden
                        if (threadsUsers.length > 0) {
                            // Füge die Benutzerinformationen zu den Threads hinzu
                            const threadsWithUserDetails = filteredThreads.map(thread => {
                                const userDetail = threadsUsers.find(user => user.id === Number(thread.sender));
                                return {
                                    ...thread,
                                    userDetail, // Benutzerdetails zum Thread hinzufügen
                                };
                            });
    

                            console.log('Threads with User Details:', threadsWithUserDetails); // Debugging
    
                            // Setze die Threads auf die gefilterten und aktualisierten Threads
                            setThreads(threadsWithUserDetails);
                            setLocalThreadMessages(threadsWithUserDetails);
    
                        } else {
                            console.error('Keine Benutzer mit diesen IDs gefunden');
                        }
                    })
                    .catch(error => console.error('Fehler beim Abrufen der Benutzer:', error));
            })
            .catch(error => console.error('Error fetching messages and reactions:', error));
    };
    
    const fetchReactions = () => {
      fetch(`${process.env.REACT_APP_API_URL}api/thread-reactions/`)
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
          setThreadReactions(reactionsByThread);
          console.log(reactionsByThread)
        })
        .catch(error => console.error('Error fetching reactions:', error));
    };
    
      
 
    threadSocket.current.onclose = () => {
        console.log('Thread WebSocket-Verbindung geschlossen');
      };
  
      threadSocket.current.onerror = (error) => {
        console.error('WebSocket-Fehler:', error);
      };
  
      return () => {
        threadSocket.current.close();
      };
    
  }, [selectedThread]);



useEffect(() => {
    const fetchReactionUsers = async () => {
        const currentUserId = localStorage.getItem('user_id');
        const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

        for (const threadId of Object.keys(threadReactions)) {
            for (const reactionType of reactionTypes) {
                const reactionText = await getThreadReactionUsersWithNames(threadReactions, threadId, reactionType, currentUserId);
                
                // Stelle sicher, dass du die richtigen IDs verwendest
                setReactionThreadUserNames(prevState => ({
                    ...prevState,
                    [`${threadId}_${reactionType}`]: reactionText,
                }));
            }
        }
    };

    fetchReactionUsers();
}, [threadReactions]); // Füge threadReactions als Abhängigkeit hinzu

  

  const getThreadReactionUsersWithNames = async (reactions, threadId, reactionType, currentUserId) => {
    if (!reactions || !reactions[threadId] || !reactions[threadId][reactionType]) {
      return '';
    }
  
    const userIds = Array.from(reactions[threadId][reactionType] || []);
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}api/users/`);
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
        console.log(currentUser)
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
  
  

  useEffect(() => {
    // Hole die Thread-Nachrichten
    fetch(`${process.env.REACT_APP_API_URL}api/threads/?message_id=${messageId}`)
  .then(response => response.json())
  .then(data => {
    const filteredThreads = data.filter(thread => thread.message === messageId);
    const userIds = filteredThreads.map(thread => Number(thread.sender)); // Umwandlung in Ganzzahlen

    console.log(userIds);
    
    setLocalThreadMessages(filteredThreads);
    fetchReactions();

    console.log(currentUserId);

    // Fetch user data only once
    fetch(`${process.env.REACT_APP_API_URL}api/users/`)
      .then(response => response.json())
      .then(users => {
        console.log(users);
        
        // Filtere die Benutzer, die in userIds enthalten sind
        const threadsUsers = users.filter(user => userIds.includes(Number(user.id)));

        // Überprüfe, ob Benutzer gefunden wurden
        if (threadsUsers.length > 0) {
          // Setze ein Objekt oder ein Array von Benutzer-IDs zu den Threads
          const threadsWithUserDetails = filteredThreads.map(thread => {
            const userDetail = threadsUsers.find(user => user.id === Number(thread.sender));
            return { ...thread, userDetail }; // Fügt die Benutzerdetails zum Thread hinzu
          });
          setUsers(threadsWithUserDetails);
          setLocalThreadMessages(threadsWithUserDetails); // Aktualisiere die lokalen Threads mit den Benutzerdetails
          console.log(threadsWithUserDetails);
        } else {
          console.error('Keine Benutzer mit diesen IDs gefunden');
        }
      });
  })
  .catch(error => {
    console.error("Error fetching thread messages:", error);
  });



    // Hole Benutzerinformationen basierend auf dem sender_id der initialMessage
    fetch(`${process.env.REACT_APP_API_URL}api/users/`)
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
        fetch(`${process.env.REACT_APP_API_URL}api/thread-reactions/`)
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
            setThreadReactions(reactionsByThread);
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
          const response = await fetch(`${process.env.REACT_APP_API_URL}api/upload/`, {
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
        sender: senderDetails ? senderDetails.id : currentUserId,
      };
      console.log("daten erstellt"); // Debugging

        console.log('Nachricht, die gesendet wird:', threadData);
        threadSocket.current.send(JSON.stringify(threadData));

    // Aktualisiere den State für die Threads
    setThreads((prevThreads) => [
      ...prevThreads,
      {
          id: messageId, // oder eine andere eindeutige ID für den Thread
          content: threadMessage.trim() || null,
          sender: senderDetails ? senderDetails.id : currentUserId,
          reactions: [] // Initialisiere die Reaktionen, falls vorhanden
      }
  ]);

        setThreadMessage('');
        setAttachedFile(null);
        setTimeout(() => {
          scrollToBottom();
      }, 100);
        console.log("Nach dem Leeren:", threadMessage, attachedFile); 

      } else {
          console.error('Nachricht erfordert entweder Inhalt oder eine Datei.');
      }
    } 
  ;
  


  const handleEditThread = (threadId, content) => {
    console.log('Bearbeiten Nachricht:', threadId);
    console.log('Bearbeiten Nachricht:', content);
    setEditContent(content);
    setEditingThreadId(threadId);

  };



  const handleSaveEdit = () => {
    if (isConnected) {  // Verwende `newThreadMessage` statt `threadMessage`
      const threadData = {
        type: 'edit',
        content: editContent,  // Verwende `content` statt `message`
        message_id: selectedThreadId,  // Die ID der zu bearbeitenden Nachricht im Thread
      };
      
      console.log('Thread-Nachricht speichern und senden:', threadData);
      
      // Sende die WebSocket-Nachricht
      threadSocket.current.send(JSON.stringify(threadData));

      // Zurücksetzen des Eingabefelds und der Bearbeitungs-ID
      setThreadMessage('');
      setEditingThreadId(null);  // Beende den Bearbeitungsmodus
   
    } else if (!isConnected) {
      console.error('WebSocket-Verbindung ist nicht offen.');
    
      fetch(`${process.env.REACT_APP_API_URL}api/threads/${selectedThreadId}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',  // Setze den Header für JSON
        },
        body: JSON.stringify({ content: editContent })  // Schicke die neuen Inhalte
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Fehler beim Editieren des Threads: ${response.statusText}`);
        }
        return response.json();
    })
    .then(updatedThread => {
        // Aktualisiere die lokalen Thread-Nachrichten
        setLocalThreadMessages(prevMessages => {
            const updatedMessages = prevMessages.map(thread =>
                thread.id === selectedThreadId ? updatedThread : thread // Ersetze den bearbeiteten Thread
            );
            console.log('Aktualisierte Threads nach REST-API-Bearbeitung:', updatedMessages);
            return updatedMessages;
        });
    })
    .catch(error => {
        console.error("Error editing thread message via REST API:", error);
    });
  }
  };


  const handleDeleteThread = (threadId) => {
    if (isConnected) {
      const message = {
        type: 'delete',
        message_id: threadId,
      };
      
      console.log('Nachricht löschen senden:', message);
      
      // Sende die Nachricht über WebSocket
      threadSocket.current.send(JSON.stringify(message));
      
      // Lokale Aktualisierung nach dem Senden
      setLocalThreadMessages(prevMessages => {
        const updatedMessages = prevMessages.filter(thread => thread.id !== threadId);
        console.log('Aktualisierte Threads nach dem Löschen:', updatedMessages);
        return updatedMessages;
      });
    } else {
      console.error('WebSocket-Verbindung ist nicht offen.');
      
      // Optional: Fallback, um die Nachricht über die REST-API zu löschen, wenn WebSocket nicht verfügbar ist
      fetch(`${process.env.REACT_APP_API_URL}api/threads/${threadId}/`, {
        method: 'DELETE',
      })
        .then(response => {
          // Überprüfe die Antwort des Servers
          if (!response.ok) {
            throw new Error(`Fehler beim Löschen des Threads: ${response.statusText}`);
          }
          return response.json();
        })
        .then(() => {
          setLocalThreadMessages(prevMessages => {
            const updatedMessages = prevMessages.filter(thread => thread.id !== threadId);
            console.log('Aktualisierte Threads nach REST-API-Löschung:', updatedMessages);
            return updatedMessages;
          });
        })
        .catch(error => {
          console.error("Error deleting thread message via REST API:", error);
        });
    }
  };
  


  const handleThreadReactionClick = (threadId, reactionType) => {
    // Überprüfen, ob threadId undefined ist und hoveredThreadID verwenden, wenn ja
    const effectiveThreadId = threadId !== undefined ? threadId : hoveredThreadId;
    
    console.log('handleThreadReactionClick aufgerufen mit threadId:', effectiveThreadId); // Debugging-Ausgabe
    const userReactions = threadReactions[effectiveThreadId]?.[reactionType] || new Set();
    const updatedReactions = { ...threadReactions };

    // Reaktion entfernen oder hinzufügen
    if (userReactions.has(currentUserId)) {
        // Reaktion entfernen
        userReactions.delete(currentUserId);
        removeThreadReaction(effectiveThreadId, reactionType, currentUserId)
            .then(() => {
                console.log(`Erfolgreich entfernt für threadId: ${effectiveThreadId}, reactionType: ${reactionType}`);
                if (userReactions.size === 0) {
                    delete updatedReactions[effectiveThreadId][reactionType];
                }
                updatedReactions[effectiveThreadId] = {
                    ...updatedReactions[effectiveThreadId],
                    [reactionType]: userReactions,
                };
                setThreadReactions(updatedReactions);
            })
            .catch((error) => {
                console.error(`Fehler beim Entfernen der Reaktion für threadId: ${effectiveThreadId}:`, error);
            });
    } else {
        // Reaktion hinzufügen
        userReactions.add(currentUserId);
        addThreadReaction(effectiveThreadId, reactionType, currentUserId)
            .then(() => {
                console.log(`Erfolgreich hinzugefügt für threadId: ${effectiveThreadId}, reactionType: ${reactionType}, User: ${currentUserId}`);
                updatedReactions[effectiveThreadId] = {
                    ...updatedReactions[effectiveThreadId],
                    [reactionType]: userReactions,
                };
                setThreadReactions(updatedReactions);
            })
            .catch((error) => {
                console.error(`Fehler beim Hinzufügen der Reaktion für threadId: ${effectiveThreadId}:`, error);
            });
    }

      if (threadSocket) {
        const threadData = {
            type: 'react',
            message_id: effectiveThreadId,
            reaction_type: reactionType,
            sender_id: currentUserId,
            added: !userReactions.has(currentUserId),
        };

        console.log('Sende über WebSocket:', threadData);
        threadSocket.current.send(JSON.stringify(threadData));
    } else {
        console.error('WebSocket ist nicht geöffnet oder nicht definiert');
    }
};





const addThreadReaction = (threadId, reactionType, user) => {
  const token = localStorage.getItem('access_token');

  return fetch(`${process.env.REACT_APP_API_URL}api/thread-reactions/`, {  // Hier wird 'return' hinzugefügt
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ thread_message: threadId, reaction_type: reactionType, user: user })
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
  
  return fetch(`${process.env.REACT_APP_API_URL}api/thread-reactions/delete-reaction/`, {  // Rückgabe von fetch
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
    throw error;  // Fehler weiterwerfen, damit er im aufrufenden Code behandelt werden kann
  });
};




  const getThreadEmojiCount = (threadId, reactionType) => {
    return threadReactions[threadId]?.[reactionType]?.size || 0;
  };

  const baseUrl = `${process.env.REACT_APP_API_URL}`;

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

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


const handleMouseEnter = (id) => {
  setHoveredThreadId(id);
  console.log(id)
};

const handleMouseLeave = () => {
  setHoveredThreadId(null);
};

const handleClickThread = (threadId) => {
  setSelectedThreadId(threadId); // Setze den ausgewählten Thread beim Klicken
};

const toggleThreadEmojiPicker = () => {
  setHideThreadHoverIcons(true); // Nur Icons des Threads ausblenden
  setActiveThreadIcon(activeThreadIcon === 'emoji' ? null : 'emoji');
};


const toggleActions = () => {
  setHideThreadHoverIcons(true); // Nur Icons ausblenden
  setActiveThreadIcon(activeThreadIcon === 'actions' ? null : 'actions');
};

  // Funktion zum Schließen aller Optionen
  const closeAllThreads = () => {
    setHideThreadHoverIcons(false);
    setShowEmojiPicker(false);
    setActiveThreadIcon(false);
  };


  const showReactionTooltip = (threadId, reactionType) => {
   setThreadTooltipVisible((prev) => ({ ...prev, [threadId]: reactionType }));
  };
  

  const getTotalThreadReactions = (threadId) => {
    const emojiTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    return emojiTypes.reduce((total, type) => total + getThreadEmojiCount(threadId, type), 0);
  };

  const hideThreadReactionTooltip = (threadId) => {
    setThreadTooltipVisible((prev) => {
      const newState = { ...prev };
      delete newState[threadId];
      return newState;
    });
  };

  const isThreadTooltipVisible = (threadId, reactionType) => {
    return threadTooltipVisible[threadId] === reactionType;
  };




return (
  <div className="threads-container">
 <div className="thread-header">


    <div className="chat-partner-name"> Threads    </div>
      <button onClick={onClose} className="close-threads-button">×</button>
    </div>
    <div className="container-scroll">
    <div className="chat-container">
    <strong className="strong-class">Replying to:</strong>
      <div className="messages">
        {/* Anzeige der initialen Nachricht */}
        <div className={getMessageClass(initialMessage.sender_id)}>
          <div className="chat-wrapper">
  
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
                      style={{ backgroundColor: senderDetails.color || '#ccc' }}
                    >
                      {senderDetails.first_name[0]}
                      {senderDetails.last_name[0]}
                    </div>
                  )}
                </div>
              ) : (
                <div className="user-profile-placeholder">NN</div>
              )}
            </div>

            <div className="Message-Text">
              <div className="Message-Sender">
                <strong>{initialMessage.sender}:</strong>
                <span className="message-time">{formatTimestamp(initialMessage.timestamp)}</span>
              </div>
              <p className="p-class">{initialMessage.message}</p>
              {initialMessage.file_url && (
                <div className="Message-File">
                  {initialMessage.file_url.endsWith('.png') ||
                  initialMessage.file_url.endsWith('.jpg') ||
                  initialMessage.file_url.endsWith('.jpeg') ? (
                    <img
                      src={`${baseUrl}${initialMessage.file_url}`}
                      alt="Uploaded file"
                      className="Message-Image"
                    />
                  ) : (
                    <a href={`${baseUrl}${initialMessage.file_url}`} download>
                      {initialMessage.file_url.split('/').pop()}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        

        {localThreadMessages.map((thread, index) => {
          const userDetail = thread.userDetail;
          const threadDate = new Date(thread.timestamp);
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);

          const formatDate = (date) => {
            if (date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()) {
              return "Today";
            } else if (date.getDate() === yesterday.getDate() &&
                       date.getMonth() === yesterday.getMonth() &&
                       date.getFullYear() === yesterday.getFullYear()) {
              return "Yesterday";
            } else {
              return date.toLocaleDateString('de-DE'); // Format DD.MM.YYYY
            }
          };

          return (
            <div key={thread.id} className={getMessageClass(thread.sender)}>
              {/* Datum anzeigen, nur wenn es das erste Thread-Nachricht für diesen Tag ist */}
              {index === 0 || (new Date(localThreadMessages[index - 1].timestamp).toDateString() !== threadDate.toDateString()) ? (
                <div className="date-separator">
                  <span>{formatDate(threadDate)}</span>
                </div>
              ) : null}


              <div className="chat-wrapper" onMouseEnter={() => handleMouseEnter(thread.id)} onMouseLeave={handleMouseLeave}
                onClick={() => handleClickThread(thread.id)}>


                <div className="messages-wrapper">    
                          
                 {userDetail ? (
                    <div className="sender-details">

                      {userDetail.profile_picture ? (
                        <img
                          src={userDetail.profile_picture}
                          alt={`${userDetail.first_name} ${userDetail.last_name}`}
                          className="member-profile-image"
                        />
                      ) : (
                        <div
                          className="user-profile-placeholder"
                          style={{ backgroundColor: userDetail.color || '#ccc' }}
                        >
                          {userDetail.first_name[0]}
                          {userDetail.last_name[0]}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="user-profile-placeholder">NN</div>
                  )}
                </div>

                {editingThreadId === thread.id && (
                              <div className="thread-edit">
                                   <div className="thread-text">
                                <input 
                                className="input-edit"
                                  type="text" 
                                  value={editContent} 
                                  onChange={(e) => setEditContent(e.target.value)} 
                                />
                                </div>
                                <div className="thread-button">
                                <button onClick={handleSaveEdit}>Save</button>
                                <button onClick={() => setEditingThreadId(null)}>Cancel</button>
                              </div>
                              </div>
                            )}

                <div className={`${String(currentUserId) === String(thread.sender) ? 'Message-thread-currentuser' : 'Message-thread-otheruser'}`}>
              
                <div className="Message-Sender"  >
       


                    <strong>{userDetail ? userDetail.first_name: 'Loading...'}</strong>
                    <span className="message-time">{formatTimestamp(thread.timestamp)}</span>
                  </div>
                  <p className="p-class">{thread.content}</p>
                  {thread.file_url && (
                    <div className="Message-File">
                      {thread.file_url.endsWith('.png') ||
                      thread.file_url.endsWith('.jpg') ||
                      thread.file_url.endsWith('.jpeg') ? (
                        <img
                          src={`${baseUrl}${thread.file_url}`}
                          alt="Uploaded file"
                          className="Message-Image"
                        />
                      ) : (
                        <a href={`${baseUrl}${thread.file_url}`} download>
                          {thread.file_url.split('/').pop()}
                        </a>
                      )}
                    </div>
                  )}
                  
                  {/* Hover Aktionen für Threads */}


                  {hoveredThreadId === thread.id && (
                <ThreadHoverActions
                  threadId={thread.id}
                  hoveredThreadId={hoveredThreadId}
                  hideHoverActions={false} // Hier könntest du Bedingungen für das Verstecken festlegen
                  hideThreadHoverIcons={hideThreadHoverIcons} // Hier könntest du Bedingungen für Icons festlegen
                  message={thread}
                  currentUserId={currentUserId}
                  activeIcon={null} // Initialer Zustand für die Icons
                  toggleThreadEmojiPicker={toggleThreadEmojiPicker}
                  handleOpenThreads={handleOpenThreads}
                  toggleActions={toggleActions}
                  handleEditThread={handleEditThread}
                  handleDeleteThread={handleDeleteThread}
                  handleThreadReactionClick={handleThreadReactionClick}
                  closeAllThreads={closeAllThreads}
                  activeThreadIcon={activeThreadIcon}
                  sender={thread.sender}
                />
      )}

                </div>
    </div>

  
    <ThreadBottom
    thread={thread}
      message={thread.id}
      currentUserId={currentUserId}
      getTotalThreadReactions={getTotalThreadReactions}
      handleThreadReactionClick={handleThreadReactionClick}
      getThreadEmojiCount={getThreadEmojiCount}
      showReactionTooltip={showReactionTooltip}
      hideThreadReactionTooltip={hideThreadReactionTooltip}
      isThreadTooltipVisible={isThreadTooltipVisible}
      reactionThreadUserNames={reactionThreadUserNames}
    />

            </div>
          
          );
        })}
   <div ref={chatEndRef} />
</div>
</div>
</div>



        
<div className="new-thread">
  {showEmojiPicker && (
    <EmojiPicker onEmojiClick={handleEmojiClick} />
  )}
  
  <div className="chat-text">
    <div className="chat-footer">
      <button 
        className="attachment-btn" 
        onClick={() => document.getElementById('file-upload').click()}
      >
        <FontAwesomeIcon icon={faPaperclip} />
      </button>

      <input
        id="file-upload"
        type="file"
        style={{ display: 'none' }} // Versteckt das Dateiupload-Feld
        onChange={handleFileChange} // Datei in den State setzen
      />

      <div className="footer-left">
        <input
          type="text"
          className="message-input"
          value={threadMessage}
          onChange={(e) => setThreadMessage(e.target.value)}
          placeholder="Neue Nachricht..."
        />

        <button 
          className="send-btn" 
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        >
          <FontAwesomeIcon icon={faSmile} /> 
        </button>
      </div>

      <div className="footer-right">
        <button className="send-btn" onClick={handleSendThread}>
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

export default Threads;