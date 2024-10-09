import React from 'react';

const MessageBottom = ({
  message,
  currentUserId,
  getTotalReactions,
  getEmojiCount,
  handleReactionClick,
  showReactionTooltip,
  hideReactionTooltip,
  isTooltipVisible,
  reactionUserNames,
  handleOpenThreads,
}) => {
  return (

<div className={`message-bottom ${message.sender_id === currentUserId ? 'message-right' : 'message-left'}`}>
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
                        <span className="reaction-text" role="img" aria-label="haha">😂</span>
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
                    <span className="reaction-text" role="img" aria-label="wow">😮</span>
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
                            <span className="reaction-text" role="img" aria-label="sad">😢</span>
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
)};

export default MessageBottom;
