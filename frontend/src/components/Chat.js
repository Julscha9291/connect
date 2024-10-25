import React, { useCallback, useState, useEffect, useRef } from 'react';
import './Chat.css';
import Threads from './Threads'; 
import EmojiPicker from 'emoji-picker-react';
import ChatHeader from './ChatHeader';
import ChatFooter from './ChatFooter';
import MessageBottom from './MessageBottom';
import MessageHoverActions from './MessageHoverActions';
import SelectedUserProfile from './SelectedUserProfile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';

const Chat = ({ 
      selectedChat, 
      setUnreadCount, 
      notifications, 
      setNotifications,
      formatMessage  }) => {
        
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [partner, setPartner] = useState(null);
  const socket = useRef(null);
  const [members, setMembers] = useState([]);
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
  const [tooltipVisible, setTooltipVisible] = useState({});
  const [reactionUserNames, setReactionUserNames] = useState({});
  const currentUserId = parseInt(localStorage.getItem('user_id'), 10);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [setSelectedThread] = useState(null);


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
  
  const fetchUsers = useCallback(async (token) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}api/users/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error fetching users');
      }

      const users = await response.json();
      return users;
    } catch (error) {
      return [];
    }
  }, []);

  const fetchChannelMembers = useCallback(async (channelId) => {
    setChannelId(channelId);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}api/channels/${channelId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error fetching channel data');
      }

      const channel = await response.json();

      if (channel) {
        const memberIds = channel.members.map(member => member.user);
        const users = await fetchUsers(token);
        const memberDetails = users.filter(user => memberIds.includes(user.id));
        setMembers(memberDetails);
      } else {
      }
    } catch (error) {
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
      if (selectedChat.data.is_private) {
      } else {
        const token = localStorage.getItem('access_token');
        fetchChannelMembers(selectedChat.data.id, token, setMembers);
      }
      localStorage.setItem('selectedChatId', selectedChat.data.id);
      if (selectedChat.data.is_private) {
        const partnerMember = selectedChat.data.members.find(
          (member) => member.user !== currentUserId
        );

        if (partnerMember) {
          fetch(`${process.env.REACT_APP_API_URL}api/users/`)
            .then((response) => response.json())
            .then((users) => {
              const partnerData = users.find(user => user.id === partnerMember.user);
              if (partnerData) {
                setPartner(partnerData);
              } else {
              }
            })
        } else {
          const token = localStorage.getItem('access_token');
          fetchChannelMembers(selectedChat.data.id, token, setMembers);
        }
      }
    }
  }, [selectedChat, currentUserId, fetchChannelMembers, setMembers]);


  useEffect(() => {
    const fetchReactionUsers = async () => {
      const currentUserId = localStorage.getItem('user_id'); 
  
      Object.keys(messageReactions).forEach(async messageId => {
        const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];       
        reactionTypes.forEach(async reactionType => {
          const reactionText = await getReactionUsersWithNames(messageReactions, messageId, reactionType, currentUserId);
          setReactionUserNames(prevState => ({
            ...prevState,
            [`${messageId}_${reactionType}`]: reactionText,
          }));
        });
      });
    };
    fetchReactionUsers();
  }, [messageReactions]); 
  
  useEffect(() => {
    if (selectedChat) {
      const token = localStorage.getItem('access_token');
      const wsUrl = `wss://connect.julianschaepermeier.com/ws/chat/${selectedChat.data.id}/?token=${token}`;

      socket.current = new WebSocket(wsUrl);

      socket.current.onopen = () => {
        setIsConnected(true);
      };

      socket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
      
        switch (data.action) {
          case 'edit':
            if (data.message && data.message_id) {
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === data.message_id ? { ...msg, message: data.message } : msg
                )
              );
            } else {
            }
            break;
      
          case 'delete':
            if (data.message_id) {
              setMessages((prevMessages) =>
                prevMessages.filter((msg) => msg.id !== data.message_id)
              );
              refreshMessages();
            } else {
            }
            break;
      
          case 'new':
            if (data.message && data.message_id) {
              const currentUserId = parseInt(localStorage.getItem('user_id'), 10); 

              if (data.sender && typeof data.sender_id === 'number' && data.sender_id !== currentUserId) {
                setUnreadCount(prevCount => prevCount + 1);
                setNotifications(prevNotifications => [
                  ...prevNotifications, 
                  { 
                    sender: data.sender, 
                    messageID: data.message_id, 
                    message: data.message,
                    channel_id: data.channel_id
                  }
                ]);
              } else {
              }

              fetch(`${process.env.REACT_APP_API_URL}api/reactions/?message=${data.message_id}`)
                .then(response => response.json())
                .then(reactionsData => {
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    { ...data, reactions: reactionsData } 
                  ]);
                  refreshMessages();
                })
            } else {
            }
            break;

            case 'react':
              if (data.message_id && data.reaction_type ) {
                const currentUserId = parseInt(localStorage.getItem('user_id'), 10);          
                setMessageReactions(prevReactions => {
                  const updatedReactions = { ...prevReactions };
                  const messageReactions = updatedReactions[data.message_id] || {};
                  const reactionUsers = messageReactions[data.reaction_type] || new Set();
                  
                  reactionUsers.add(data.sender_id);
                  
                  messageReactions[data.reaction_type] = reactionUsers;
                  updatedReactions[data.message_id] = messageReactions;                
                  return updatedReactions;
                });  
                refreshMessages();
                fetchReactions();
                let notificationIncreased = false;

                if (data.sender_id !== currentUserId && !notificationIncreased) {
                    setUnreadCount(prevCount => prevCount + 1);
                    notificationIncreased = true;

                    setNotifications(prevNotifications => [
                      ...prevNotifications, 
                      { 
                        sender: data.sender_id, 
                        messageID: data.message_id, 
                        reactionType: data.reaction_type, 
                        channel_id: data.channel_id,
                        message: data.message 
                      }
                    ]);
                }
         
              } else {
              }
              break;                  
          default:
        }
      };

      const refreshMessages = () => {
        if (selectedChat) {
            fetch(`${process.env.REACT_APP_API_URL}api/messages/${selectedChat.data.id}/`)
                .then(response => response.json())
                .then(messagesData => {
                    return fetch(`${process.env.REACT_APP_API_URL}api/reactions/`)
                        .then(response => response.json())
                        .then(reactionsData => {
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
                                reactions: msg.reactions, 
                                file_url: msg.file_url,
                                thread_count: msg.thread_count
                            })));
                        });
                })
               }
      };    

      socket.current.onclose = () => {
        setIsConnected(false);
      };

      socket.current.onerror = (error) => {
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
  }, [notifications]);  

  useEffect(() => {
    if (selectedChat) {
      fetch(`${process.env.REACT_APP_API_URL}api/messages/${selectedChat.data.id}/`)
        .then(response => response.json())
        .then(data => {
              setTimeout(() => {
        scrollToBottom();
    }, 5); 
          setMessages(data.map(msg => ({
            id: msg.id,
            sender_id: msg.sender__id,  
            sender: msg.sender__username,
            message: msg.content,
            timestamp: msg.timestamp,
            file_url: msg.file_url,
            thread_count: msg.thread_count
          })));
          fetchReactions();
        })
    }
  }, [selectedChat]);

  const fetchReactions = (messageId) => {
    fetch(`${process.env.REACT_APP_API_URL}api/reactions/`)
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
  };

  const handleReactionClick = (messageId, reactionType) => {
    const userReactions = messageReactions[messageId]?.[reactionType] || new Set();
    const updatedReactions = { ...messageReactions };

    if (userReactions.has(currentUserId)) {
        userReactions.delete(currentUserId);

        handleRemoveReaction(messageId, reactionType) 
            .then(() => {
   
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
            });
    } else {
        userReactions.add(currentUserId);
        addReaction(messageId, reactionType, currentUserId)
            .then(() => {
                updatedReactions[messageId] = {
                    ...updatedReactions[messageId],
                    [reactionType]: userReactions,
                };
                setMessageReactions(updatedReactions);
            })
            .catch((error) => {
            });
    }

    if (socket) {
      const messageData = {
          type: 'react',
          message_id: messageId,
          reaction_type: reactionType,
          sender_id: currentUserId,
          added: !userReactions.has(currentUserId), 
      };
      socket.current.send(JSON.stringify(messageData));
  } else {
  }
};

  const handleRemoveReaction = (messageId, reactionType) => {
    return new Promise((resolve, reject) => {
        const userReactions = messageReactions[messageId]?.[reactionType] || new Set();
        const updatedReactions = { ...messageReactions };

            removeReaction(messageId, reactionType, currentUserId) 
                .then(() => {
                    if (userReactions.size === 0) {
                        delete updatedReactions[messageId][reactionType];
                    }
                    updatedReactions[messageId] = {
                        ...updatedReactions[messageId],
                        [reactionType]: userReactions,
                    };
                    setMessageReactions(updatedReactions);
                    resolve(); 
                })
                .catch(error => {
                    reject(error); 
                });      
    });
};


const addReaction = (messageId, reactionType, user) => {
  const token = localStorage.getItem('access_token');
  
  return fetch(`${process.env.REACT_APP_API_URL}api/reactions/`, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message: messageId, reaction_type: reactionType, user: user })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(() => fetchReactions(messageId))
};

const removeReaction = (messageId, reactionType, user) => {
  const token = localStorage.getItem('access_token');
  const requestBody = { message: messageId, reaction_type: reactionType, user: user };
  
  return fetch(`${process.env.REACT_APP_API_URL}api/reactions/delete-reaction/`, { 
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.status !== 204 ? response.json() : null;
  })
  .then(() => fetchReactions(messageId)) 
};
  
const handleDeleteMessage = (messageId) => {
    if (isConnected) {
      const message = {
        type: 'delete',
        message_id: messageId,
        chatId: selectedChat.data.id,
      };
      socket.current.send(JSON.stringify(message));
    } else {
    }
  };

  const handleEditMessage = (messageId, content) => {
    setNewMessage(content);
    setEditingMessageId(messageId);
  };

  const handleCancelEdit = () => {
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
      socket.current.send(JSON.stringify(message));
      setNewMessage('');
      setEditingMessageId(null);
    } else if (!isConnected) {
    }
  };

  const handleSendMessage = async () => {
    if ((newMessage.trim() || attachedFile) && isConnected && !editingMessageId) {
        let fileUrl = null;

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
            } catch (error) {
                return;
            }
        }

        const message = {
            type: 'new',
            message: newMessage.trim() || null,
            fileUrl: fileUrl || null,
        };

        socket.current.send(JSON.stringify(message));

        setNewMessage('');
        const textarea = document.querySelector('.message-input');
        if (textarea) {
          textarea.style.height = 'auto';
        }
        setAttachedFile(null);
        setTimeout(() => {
          scrollToBottom();
      }, 100); 
    } else {
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
    setIsBackgroundDark(true); 
  };
  
  const closeAddUserModal = () => {
    setIsAddUserModalOpen(false);
    setIsBackgroundDark(false); 
  };
  
  const getMessageClass = (senderId) => {
    return senderId === currentUserId ? 'message current-user' : 'message other-user';
  };
  
  const handleOpenThreads = (message) => {
    if (message && message.id) {
      setHideHoverActions(true);  
      if (selectedMessageId === message.id) {
        setSelectedMessage(null);
        setSelectedMessageId(null);
        setSenderId(null);
        setShowThreads(false);
      } else {
        setSelectedMessage(message);
        setSelectedMessageId(message.id); 
        setSenderId(message.sender_id); 
        setShowThreads(true);
        setSelectedThread(message); 
      }
    } else {
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

    if (file && file.type.startsWith('image/')) {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setFilePreview(e.target.result); 
      };
      fileReader.readAsDataURL(file);
    } else {
      setFilePreview(file.name);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji); 
    setShowEmojiPicker(false); 
  };

  const handleDropdownProfileToggle = () => {
    setIsDropdownProfileOpen(!isDropdownProfileOpen);
  };

  const closeModal = () => {
    setIsDropdownProfileOpen(false);
  };
  

  const baseUrl = `${process.env.REACT_APP_API_URL}`;

  const toggleEmojiPicker = () => {
    setHideHoverIcons(true);
    setActiveIcon(activeIcon === 'emoji' ? null : 'emoji');
  };


  const toggleActions = () => {
    setHideHoverIcons(true); 
    setActiveIcon(activeIcon === 'actions' ? null : 'actions');
  };

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
    window.open(fileUrl, '_blank'); 
  };
  
  const updateThreadCount = (messageId) => {
    setMessages((prevMessages) => 
      prevMessages.map((msg) => 
        msg.id === messageId ? { ...msg, thread_count: msg.thread_count + 1 } : msg
      )
    );
  };

  const handleRemoveFile = () => {
    setAttachedFile(null); 
    setFilePreview(null);  
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

  const handleOpenProfile = (user) => {
    setSelectedPartner(user);
    setIsProfileOpen(true);
  };
  
  const handleCloseProfile = () => {
    setIsProfileOpen(false);
    setSelectedPartner(null);
  };


  return (
    <div className={`chat-window${isBackgroundDark ? 'dark-background' : ''}`}>
      <div className={`chat ${isBackgroundDark ? 'dark-background' : ''} ${showThreads ? 'hide' : ''}`}>
        <ChatHeader
          selectedChat={selectedChat}
          partner={partner}
          members={members}
          handleDropdownProfileToggle={handleDropdownProfileToggle}
          isDropdownProfileOpen={isDropdownProfileOpen}
          openAddUserModal={openAddUserModal}
          closeAddUserModal={closeAddUserModal}
          isAddUserModalOpen={isAddUserModalOpen}
          closeModal={closeModal}
          channelId={channelId}
        />
  
        <div className="chat-body">
          {messages.length === 0 ? (
            <div className="no-messages"></div>
          ) : (
            <div className="chat-container">
              <div className="messages">
                {messages.map((message, index) => {
                  const senderDetails = members.find((member) => member.id === message.sender_id);
                  const messageDate = new Date(message.timestamp);
                  const today = new Date();
                  const yesterday = new Date();
                  yesterday.setDate(today.getDate() - 1);
  
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
                      return date.toLocaleDateString();
                    }
                  };
  
                  return (
                    <div key={message.id} className={getMessageClass(message.sender_id)}>
                      {index === 0 ||
                      new Date(messages[index - 1].timestamp).toLocaleDateString() !== messageDate.toLocaleDateString() ? (
                        <div className="date-separator">
                          <span>{formatDate(messageDate)}</span>
                        </div>
                      ) : null}
                      
                      <div
                        className="chat-wrapper"
                        onMouseEnter={() => handleMouseEnter(message.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="messages-wrapper">
                          {senderDetails ? (
                            <div className="sender-details">
                              {senderDetails.profile_picture ? (
                                <img
                                  src={senderDetails.profile_picture}
                                  alt={`${senderDetails.first_name} ${senderDetails.last_name}`}
                                  className="member-profile-image"
                                  onClick={() => handleOpenProfile(senderDetails)} 
                                  style={{ cursor: 'pointer' }}
                                />
                              ) : (
                                <div
                                  className="user-profile-placeholder"
                                  style={{ backgroundColor: senderDetails.color || '#ccc', cursor: 'pointer' }}
                                  onClick={() => handleOpenProfile(senderDetails)} 
                                >
                                  {senderDetails.first_name[0]}
                                  {senderDetails.last_name[0]}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="user-profile-placeholder" style={{ cursor: 'pointer' }} onClick={() => handleOpenProfile(null)}>
                              NN
                            </div>
                          )}
                        </div>

                        {editingMessageId === message.id ? (
                          <div className="message-edit">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button onClick={handleSaveMessage}>Save</button>
                            <button onClick={handleCancelEdit}>Cancel</button>
                          </div>
                        ) : (
                          <div className="Message-Text">
                            <div className="Message-Sender">
                            <strong onClick={() => handleOpenProfile(senderDetails)} style={{ cursor: 'pointer' }}>
                            {message.sender}
                            </strong>
                              <span className="message-time">{formatTimestamp(message.timestamp)}</span>
                            </div>
                            {isProfileOpen && selectedPartner && (
                                <SelectedUserProfile user={selectedPartner} onClose={handleCloseProfile} />
                              )}
                              {formatMessage(message.message)}
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
                                  <div
                                    className="attachment-link"
                                    onClick={() => handleAttachmentClick(`${baseUrl}${message.file_url}`)}
                                  >
                                    <FontAwesomeIcon icon={faPaperclip} style={{ color: 'white' }} />
                                    <span style={{ color: 'white', marginLeft: '5px' }}>Attachment</span>
                                  </div>
                                )}
                              </div>
                            )}
  
                            <div>
                              <MessageHoverActions
                                hoveredMessageId={hoveredMessageId}
                                hideHoverActions={hideHoverActions}
                                hideHoverIcons={hideHoverIcons}
                                message={message}
                                currentUserId={currentUserId}
                                activeIcon={activeIcon}
                                toggleEmojiPicker={toggleEmojiPicker}
                                handleOpenThreads={handleOpenThreads}
                                toggleActions={toggleActions}
                                handleEditMessage={handleEditMessage}
                                handleDeleteMessage={handleDeleteMessage}
                                handleReactionClick={handleReactionClick}
                                closeAll={closeAll}
                                messageId={message.id}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <MessageBottom
                        message={message}
                        currentUserId={currentUserId}
                        getTotalReactions={getTotalReactions}
                        getEmojiCount={getEmojiCount}
                        handleReactionClick={handleReactionClick}
                        showReactionTooltip={showReactionTooltip}
                        hideReactionTooltip={hideReactionTooltip}
                        isTooltipVisible={isTooltipVisible}
                        reactionUserNames={reactionUserNames}
                        handleOpenThreads={handleOpenThreads}
                      />
                      <div ref={chatEndRef} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
  
        <ChatFooter
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          toggleEmojiPicker={toggleEmojiPicker}
          activeIcon={activeIcon}
          handleReactionClick={handleReactionClick}
          messageId={selectedMessageId}
          showEmojiPicker={showEmojiPicker}
          EmojiPicker={EmojiPicker}
          handleEmojiClick={handleEmojiClick}
          setShowEmojiPicker={setShowEmojiPicker}
          filePreview={filePreview}
          attachedFile={attachedFile}
          handleRemoveFile={handleRemoveFile}
          handleFileChange={handleFileChange}
          selectedChat={selectedChat}
        />
      </div>
  
      <div className={`thread-class ${showThreads ? 'show' : ''}`}>
        {messages.map((message) => {
          const senderDetails = members.find((member) => member.id === message.sender_id);
  
          return (
            selectedMessageId === message.id && showThreads ? (
              <Threads
                key={message.id}
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
                getMessageClass={getMessageClass}
                hoveredMessageId={hoveredMessageId}
                hideHoverActions={hideHoverActions}
                hideHoverIcons={hideHoverIcons}
                message={message}
                activeIcon={activeIcon}
                toggleEmojiPicker={toggleEmojiPicker}
                handleOpenThreads={handleOpenThreads}
                toggleActions={toggleActions}
                handleEditMessage={handleEditMessage}
                handleDeleteMessage={handleDeleteMessage}
                handleReactionClick={handleReactionClick}
                closeAll={closeAll}
                MessageHoverActions={MessageHoverActions}
                handleRemoveFile={handleRemoveFile}
                selectedThread={message}
                setUnreadCount={setUnreadCount}
                formatMessage= {formatMessage}
              />
            ) : null
          );
        })}
      </div>
    </div>
  );
  
};
export default Chat;
