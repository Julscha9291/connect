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
    setUnreadCount,
    formatMessage,
    handleAttachmentClick
}) => {

  const threadSocket = useRef(null);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [threadMessage, setThreadMessage] = useState('');
  const [senderDetails, setSenderDetails] = useState(null);
  const [threadReactions, setThreadReactions] = useState({});
  const [attachedThreadFile, setAttachedThreadFile] = useState(null); 
  const [threadfilePreview, setThreadFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hoveredThreadId, setHoveredThreadId] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null); 
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

  const scrollToBottom = () => {
      if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
  };

  useEffect(() => {
                if (!selectedThread || !selectedThread.id) {
                  return;
                }
                const token = localStorage.getItem('access_token');
                const wsUrlThread = `wss://connect.julianschaepermeier.com/ws/threads/${selectedThread.id}/?token=${token}`;
            
                threadSocket.current = new WebSocket(wsUrlThread);
            
                threadSocket.current.onopen = () => {
                  setIsConnected(true);
                };
            
                threadSocket.current.onmessage = (event) => {
                  const data = JSON.parse(event.data);
            
                  switch (data.action) {
                    case 'new':
                      if (data.content && data.message_id) {                     

                        fetch(`${process.env.REACT_APP_API_URL}api/thread-reactions/?message=${data.message_id}`)
                          .then(response => response.json())
                          .then(reactionsData => {

                            setThreads((prevMessages) => [
                              ...prevMessages,
                              { 
                                id: data.message_id, 
                                content: data.content, 
                                sender: data.sender, 
                                reactions: reactionsData 
                              }
                            ]);

                            if (data.sender && typeof data.sender_id === 'number' && data.sender_id !== currentUserId) {
                              setUnreadCount(prevCount => prevCount + 1);
                            }
                            
                            refreshThreads(data.message_id); 
                            scrollToBottom(); 
                          });
                      } else {
                      }
                      break;

                    case 'delete':
                        if (data.message_id) {
                          setThreads((prevThreads) =>
                            prevThreads.filter((thread) => thread.id !== data.message_id)
                          );
                          refreshThreads();
                        } else {
                        }
                        break;
            
                    case 'react':
                        if (data.reaction_type) {
                          const currentUserId = parseInt(localStorage.getItem('user_id'), 10); 

                          setThreadReactions(prevReactions => {
                              const updatedReactions = { ...prevReactions };
                              const threadId = data.message_id; 
                              const threadReactions = updatedReactions[threadId] || {};
                              const reactionUsers = threadReactions[data.reaction_type] || new Set();

                              reactionUsers.add(data.sender_id);

                              threadReactions[data.reaction_type] = reactionUsers;
                              updatedReactions[threadId] = threadReactions;
                              return updatedReactions;
                          });
                          refreshThreads();
                          fetchReactions(); 

                          let notificationIncreased = false;

                          if (data.sender_id !== currentUserId && !notificationIncreased) {
                              setUnreadCount(prevCount => prevCount + 1);
                              notificationIncreased = true;
                          }

                      } else {
                      }
                      break;

                      case 'edit':
                          if (data.content && data.message_id) {
                            setThreads((prevThreads) =>
                              prevThreads.map((msg) =>
                                msg.id === data.message_id ? { ...msg, content: data.content } : msg
                              )
                            );
                            refreshThreads();  
                          } else {
                          }
                          break;
                    default:
                  }
                };
                const refreshThreads = () => {
                  if (!selectedThread) {
                      return; 
                  }
                  fetch(`${process.env.REACT_APP_API_URL}api/threads/`)
                      .then(response => {
                          if (!response.ok) {
                              throw new Error('Netzwerkantwort war nicht ok');
                          }
                          return response.json();
                      })
                      .then(threadData => {
                          if (!Array.isArray(threadData)) {
                              threadData = [threadData]; 
                          }
            
                          const filteredThreads = threadData.filter(thread => thread.message === selectedThread.id);
                          if (filteredThreads.length === 0) {
                              setThreads([]); 
                              setLocalThreadMessages([]); 
                              return; 
                          }
                          const userIds = filteredThreads.map(thread => Number(thread.sender));
            
                          fetch(`${process.env.REACT_APP_API_URL}api/users/`)
                              .then(response => response.json())
                              .then(users => {
                                  const threadsUsers = users.filter(user => userIds.includes(Number(user.id)));
                                  if (threadsUsers.length > 0) {
                                      const threadsWithUserDetails = filteredThreads.map(thread => {
                                          const userDetail = threadsUsers.find(user => user.id === Number(thread.sender));
                                          return {
                                              ...thread,
                                              userDetail,
                                          };
                                      });            
                                      setThreads(threadsWithUserDetails);
                                      setLocalThreadMessages(threadsWithUserDetails);
              
                                  } else {
                                  }
                              })
                      })
              };
              
              const fetchReactions = () => {
                fetch(`${process.env.REACT_APP_API_URL}api/thread-reactions/`)
                  .then(response => response.json())
                  .then(data => {
                    const reactionsByThread = data.reduce((acc, reaction) => {
                      if (!acc[reaction.thread_message]) {  
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
              };
          
              threadSocket.current.onclose = () => {
                };
            
              threadSocket.current.onerror = (error) => {
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
                
                setReactionThreadUserNames(prevState => ({
                    ...prevState,
                    [`${threadId}_${reactionType}`]: reactionText,
                }));
            }
        }
    };

    fetchReactionUsers();
}, [threadReactions]); 

  
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
      const reactingUsers = usersData.filter(user => userIds.includes(user.id));
      const currentUserIdString = String(currentUserId);
      const currentUserIndex = reactingUsers.findIndex(user => String(user.id) === currentUserIdString);
  
      let reactionText = '';
  
      if (currentUserIndex !== -1) {
        const currentUser = reactingUsers.splice(currentUserIndex, 1)[0];
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
      return '';
    }
  };
  

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}api/threads/?message_id=${messageId}`)
    .then(response => response.json())
    .then(data => {
    const filteredThreads = data.filter(thread => thread.message === messageId);
    const userIds = filteredThreads.map(thread => Number(thread.sender));

    setLocalThreadMessages(filteredThreads);
    fetchReactions();

    fetch(`${process.env.REACT_APP_API_URL}api/users/`)
      .then(response => response.json())
      .then(users => {
        const threadsUsers = users.filter(user => userIds.includes(Number(user.id)));
        if (threadsUsers.length > 0) {
          const threadsWithUserDetails = filteredThreads.map(thread => {
            const userDetail = threadsUsers.find(user => user.id === Number(thread.sender));
            return { ...thread, userDetail }; 
          });
          setUsers(threadsWithUserDetails);
          setLocalThreadMessages(threadsWithUserDetails); 

        } else {
        }
      });
  })
  .catch(error => {
  });

  fetch(`${process.env.REACT_APP_API_URL}api/users/`)
      .then(response => response.json())
      .then(users => {
        const senderData = users.find(user => user.id === initialMessage.sender_id);
        if (senderData) {
          setSenderDetails(senderData);
        } else {
        }
      })
      .catch(error => {
      });

    
    const fetchReactions = (threadId) => {
        fetch(`${process.env.REACT_APP_API_URL}api/thread-reactions/`)
          .then(response => response.json())
          .then(data => {
            const reactionsByThread = data.reduce((acc, reaction) => {
              if (!acc[reaction.thread_message]) {  
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
      };   
      fetchReactions(messageId);
    }, [messageId, initialMessage.sender_id, currentUserId]);


  const handleSendThread = async () => {
          if ((threadMessage.trim() || attachedThreadFile)) {
            let fileUrl= null;
            if (attachedThreadFile) {
              const formData = new FormData();
              formData.append('file', attachedThreadFile);
        
              try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}api/upload/`, {
                  method: 'POST',
                  body: formData,
                });
        
                const data = await response.json();
                fileUrl = data.file_url;
              } catch (error) {
                return;
              }
            }

            const threadData = {
              type: 'new',
              message: messageId,
              content: threadMessage.trim() || ' ',
              fileUrl: fileUrl || null, 
              sender: senderDetails ? senderDetails.id : currentUserId,
            };
              threadSocket.current.send(JSON.stringify(threadData));

              setThreads((prevThreads) => {
                const newThread = {
                    id: messageId,
                    fileUrl: fileUrl || null,  
                    sender: senderDetails ? senderDetails.id : currentUserId,
                    reactions: []
                };           
                return [...prevThreads, newThread];  
            });

              setThreadMessage('');
              const textarea = document.querySelector('.message-input');
              if (textarea) {
                textarea.style.height = 'auto';
              }                  
              setAttachedThreadFile(null);
              setTimeout(() => {
                scrollToBottom();
            }, 100);

            } else {
            }
    } 
  ;
  
  const handleEditThread = (threadId, content) => {
    setEditContent(content);
    setEditingThreadId(threadId);
  };

  const handleSaveEdit = () => {
        if (isConnected) {  
          const threadData = {
            type: 'edit',
            content: editContent,  
            message_id: selectedThreadId, 
          };
          threadSocket.current.send(JSON.stringify(threadData));
          setThreadMessage('');
          setEditingThreadId(null);  
      
        } else if (!isConnected) {

          fetch(`${process.env.REACT_APP_API_URL}api/threads/${selectedThreadId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',  
            },
            body: JSON.stringify({ content: editContent })  
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Fehler beim Editieren des Threads: ${response.statusText}`);
            }
            return response.json();
        })
        .then(updatedThread => {
            setLocalThreadMessages(prevMessages => {
                const updatedMessages = prevMessages.map(thread =>
                    thread.id === selectedThreadId ? updatedThread : thread 
                );
                return updatedMessages;
            });
        })
        .catch(error => {
        });
      }
  };

  const handleDeleteThread = (threadId) => {
    if (isConnected) {
      const message = {
        type: 'delete',
        message_id: threadId,
      };
      
      threadSocket.current.send(JSON.stringify(message));
    
      setLocalThreadMessages(prevMessages => {
        const updatedMessages = prevMessages.filter(thread => thread.id !== threadId);
        return updatedMessages;
      });
    } else {
      fetch(`${process.env.REACT_APP_API_URL}api/threads/${threadId}/`, {
        method: 'DELETE',
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Fehler beim Löschen des Threads: ${response.statusText}`);
          }
          return response.json();
        })
        .then(() => {
          setLocalThreadMessages(prevMessages => {
            const updatedMessages = prevMessages.filter(thread => thread.id !== threadId);
            return updatedMessages;
          });
        })
        .catch(error => {
        });
    }
  };
  
  const handleThreadReactionClick = (threadId, reactionType) => {
    const effectiveThreadId = threadId !== undefined ? threadId : hoveredThreadId;
    const userReactions = threadReactions[effectiveThreadId]?.[reactionType] || new Set();
    const updatedReactions = { ...threadReactions };
    if (userReactions.has(currentUserId)) {
        userReactions.delete(currentUserId);
        removeThreadReaction(effectiveThreadId, reactionType, currentUserId)
            .then(() => {
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
            });
      } else {
        userReactions.add(currentUserId);
        addThreadReaction(effectiveThreadId, reactionType, currentUserId)
            .then(() => {
                updatedReactions[effectiveThreadId] = {
                    ...updatedReactions[effectiveThreadId],
                    [reactionType]: userReactions,
                };
                setThreadReactions(updatedReactions);
            })
            .catch((error) => {
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
            threadSocket.current.send(JSON.stringify(threadData));
        } else {
        }
};


const addThreadReaction = (threadId, reactionType, user) => {
    const token = localStorage.getItem('access_token');

    return fetch(`${process.env.REACT_APP_API_URL}api/thread-reactions/`, {  
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
    });
};

  
const removeThreadReaction = (threadMessageId, reactionType, user) => {
      const token = localStorage.getItem('access_token');
      
      return fetch(`${process.env.REACT_APP_API_URL}api/thread-reactions/delete-reaction/`, {  
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
        throw error;  
      });
};

const getThreadEmojiCount = (threadId, reactionType) => {
    return threadReactions[threadId]?.[reactionType]?.size || 0;
};

const baseUrl = `${process.env.REACT_APP_API_URL}`;

const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAttachedThreadFile(file);
    if (file && file.type.startsWith('image/')) {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setThreadFilePreview(e.target.result); 
      };
      fileReader.readAsDataURL(file);
    } else {
      setThreadFilePreview(file.name);
    }
  };

const handleEmojiClick = (emojiData) => {
    setThreadMessage((prev) => prev + emojiData.emoji); 
    setShowEmojiPicker(false); 
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const handleMouseEnter = (id) => {
  setHoveredThreadId(id);
};

const handleMouseLeave = () => {
  setHoveredThreadId(null);
};

const handleClickThread = (threadId) => {
  setSelectedThreadId(threadId); 
};

const toggleThreadEmojiPicker = () => {
  setHideThreadHoverIcons(true); 
  setActiveThreadIcon(activeThreadIcon === 'emoji' ? null : 'emoji');
};


const toggleActions = () => {
  setHideThreadHoverIcons(true); 
  setActiveThreadIcon(activeThreadIcon === 'actions' ? null : 'actions');
};

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

const handleInputChange = (e) => {
  setThreadMessage(e.target.value);
  e.target.style.height = 'auto'; 
  e.target.style.height = `${e.target.scrollHeight}px`;  
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
                  <strong>  {formatMessage(initialMessage.sender)}: </strong>
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
                  return date.toLocaleDateString('de-DE'); 
                }
              };

        return (
            <div key={thread.id} className={getMessageClass(thread.sender)}>
              {index === 0 || (new Date(localThreadMessages[index - 1].timestamp).toDateString() !== threadDate.toDateString()) ? (
                <div className="date-separator">
                  <span>{formatDate(threadDate)}</span>
                </div>
              ) : null}

              <div className="chat-wrapper" onMouseEnter={() => handleMouseEnter(thread.id)} onMouseLeave={handleMouseLeave}
                onClick={() => handleClickThread(thread.id)} >
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
                  <p className="p-class"> {formatMessage(thread.content)}</p>
                          {thread.fileUrl && (
                            <div className="Message-File">
                                {thread.fileUrl.endsWith('.png') ||
                                thread.fileUrl.endsWith('.jpg') ||
                                thread.fileUrl.endsWith('.jpeg') ||
                                thread.fileUrl.endsWith('.JPG') ||
                                thread.fileUrl.endsWith('.PNG') ||
                                thread.fileUrl.endsWith('.JPEG') ? (
                                <img
                                  src={`${baseUrl}${thread.fileUrl}`}
                                  alt="Uploaded file"
                                  className="Message-Image"
                                />
                              ) : (
                                <div
                                className="attachment-link"
                                onClick={() => handleAttachmentClick(`${baseUrl}${thread.fileUrl}`)}
                              >
                                <FontAwesomeIcon icon={faPaperclip} style={{ color: 'white' }} />
                                <span style={{ color: 'white', marginLeft: '5px' }}>Attachment</span>
                              </div>
                              )}
                            </div>
                          )}
                
                {hoveredThreadId === thread.id && (
                      <ThreadHoverActions
                        threadId={thread.id}
                        hoveredThreadId={hoveredThreadId}
                        hideHoverActions={false} 
                        hideThreadHoverIcons={hideThreadHoverIcons} 
                        message={thread}
                        currentUserId={currentUserId}
                        activeIcon={null} 
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
            <div className="thread-footer">
              <button 
                className="attachment-btn" 
                onClick={() => document.getElementById('thread-file-upload').click()}
              >
                <FontAwesomeIcon icon={faPaperclip} />
              </button>
              <input
                id="thread-file-upload"
                type="file"
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />
              <div className="footer-left">
                <textarea
                className="message-input"
                value={threadMessage}
                onChange={handleInputChange}
                placeholder="Write a message..."
                rows="1" 
                style={{ resize: 'none', overflow: 'hidden' }} 
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

            <div className="thread-attach">
              {threadfilePreview && (
                <div className="file-preview-thread">
                  {attachedThreadFile && attachedThreadFile.type.startsWith('image/') ? (
                    <img
                      src={threadfilePreview}
                      alt="Preview-Thread"
                      style={{ width: '200px', height: 'auto' }} 
                    />
                  ) : (
                    <p>{attachedThreadFile?.name}</p> 
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