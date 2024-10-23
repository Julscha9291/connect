import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile, faEllipsisVertical, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';


const ThreadHoverActions = ({
    hoveredThreadId,
  hideHoverActions,
  hideThreadHoverIcons,
  message,
  currentUserId,
  activeThreadIcon,
  toggleThreadEmojiPicker,
  handleOpenThreads,
  toggleActions,
  handleEditThread,
  handleDeleteThread,
  handleThreadReactionClick,
  closeAllThreads,
  threadId,
  sender
  }) => {

return (
  <div className={`thread-hover-actions ${hoveredThreadId === threadId  ? 'visible' : ''}`}>
        {hideThreadHoverIcons && (
            <button className="close-button-message" onClick={closeAllThreads}>
              <span>x</span>
            </button>
          )}
        {!hideThreadHoverIcons && (
                  <div className="message-icon">
                    <button onClick={toggleThreadEmojiPicker}>
                      <FontAwesomeIcon icon={faSmile} />
                    </button>
                  </div>
                )}
      {activeThreadIcon === 'emoji' && (
        <div className="emoji-picker-dropdown">
          <button className="emoji-button" onClick={() => handleThreadReactionClick(threadId.id, 'like')}>
            <span role="img" aria-label="like" style={{ marginRight: '2px' }}>👍</span>
          </button>
          <button className="emoji-button" onClick={() => handleThreadReactionClick(threadId.id, 'love')}>
            <span role="img" aria-label="love" style={{ marginRight: '2px' }}>❤️</span>
          </button>
          <button className="emoji-button" onClick={() => handleThreadReactionClick(threadId.id, 'haha')}>
            <span role="img" aria-label="haha" style={{ marginRight: '2px' }}>😂</span>
          </button>
          <button className="emoji-button" onClick={() => handleThreadReactionClick(threadId.id, 'wow')}>
            <span role="img" aria-label="wow" style={{ marginRight: '2px' }}>😮</span>
          </button>
          <button className="emoji-button" onClick={() => handleThreadReactionClick(threadId.id, 'sad')}>
            <span role="img" aria-label="sad" style={{ marginRight: '2px' }}>😢</span>
          </button>
          <button className="emoji-button" onClick={() => handleThreadReactionClick(threadId.id, 'angry')}>
            <span role="img" aria-label="angry" style={{ marginRight: '2px' }}>😡</span>
          </button>
        </div>
      )}
      {!hideThreadHoverIcons && sender === currentUserId && (
          <div className="message-icon">
            <button onClick={toggleActions}>
              <FontAwesomeIcon icon={faEllipsisVertical} />
            </button>
          </div>
        )}
      {activeThreadIcon === 'actions' && sender === currentUserId && (
          <div className="message-actions-dropdown">
            <button className="button-edit-delete" onClick={() => handleEditThread(message.id, message.content)}>
              <FontAwesomeIcon icon={faEdit} /> 
            </button>
            <button className="button-edit-delete" onClick={() => handleDeleteThread(message.id)}>
              <FontAwesomeIcon icon={faTrash} /> 
            </button>
          </div>
        )}
    </div>
    );

  };

export default ThreadHoverActions;











