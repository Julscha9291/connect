import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile, faEllipsisVertical, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const MessageHoverActions = ({
  hoveredMessageId,
  hideHoverActions,
  hideHoverIcons,
  message,
  currentUserId,
  activeIcon,
  toggleEmojiPicker,
  handleOpenThreads,
  toggleActions,
  handleEditMessage,
  handleDeleteMessage,
  handleReactionClick,
  closeAll,
  messageId
}) => {

return (
  <div className={`message-hover-actions ${hoveredMessageId === messageId && !hideHoverActions ? 'visible' : ''}`}>
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

        {!hideHoverIcons && message.sender_id === currentUserId && (
      <div className="message-icon">
        <button onClick={toggleActions}>
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </button>
      </div>
    )}
    
      {activeIcon === 'actions' && message.sender_id === currentUserId && (
        <div className="message-actions-dropdown">
          <button className="button-edit-delete" onClick={() => handleEditMessage(message.id, message.message)}>
            <FontAwesomeIcon icon={faEdit} /> 
          </button>
          <button className="button-edit-delete" onClick={() => handleDeleteMessage(message.id)}>
            <FontAwesomeIcon icon={faTrash} /> 
          </button>
        </div>
      )}
</div> 
  );

};

export default MessageHoverActions;











