import React from 'react';

const ThreadBottom = ({
    thread,
    message,
    currentUserId,
    getTotalThreadReactions,
    handleThreadReactionClick,
    getThreadEmojiCount,
    showReactionTooltip,
    hideThreadReactionTooltip,
    isThreadTooltipVisible,
    reactionThreadUserNames
}) => {

    
  return (

<div className={`thread-bottom ${thread.sender === currentUserId ? 'thread-right' : 'thread-left'}`}>
  <div className={`message-reactions ${getTotalThreadReactions(thread.id) === 0 ? 'no-reactions' : ''}`}>
     <div class="reaction-wrapper">
            {getThreadEmojiCount(thread.id, 'like') > 0 && (
            <span
            className="emoji-display"
            onClick={() =>
                handleThreadReactionClick(thread.id, 'like', getThreadEmojiCount(thread.id, 'like'))
                    }     
            onMouseEnter={() => showReactionTooltip(thread.id, 'like')}
            onMouseLeave={() => hideThreadReactionTooltip(thread.id, 'like')}
            >
            <span className="emoji" role="img" aria-label="like">👍</span>
            <span class="reaction-count">{getThreadEmojiCount(thread.id, 'like')}</span>

        {isThreadTooltipVisible(message, 'like') && (
         <div className="reaction-tooltip">
            <span className="reaction-text" role="img" aria-label="like">👍</span>
            <div class="user-text">
                {reactionThreadUserNames[`${message}_like`] || 'Laden...'} {/* Benutzer für "like" */}
            </div> 
            </div>
            )}
            </span>
            )}
        {getThreadEmojiCount(message, 'love') > 0 && (
            <span
          className="emoji-display"
          onClick={() =>
            handleThreadReactionClick(message, 'love', getThreadEmojiCount(message, 'love'))
            }
          onMouseEnter={() => showReactionTooltip(message, 'love')}
          onMouseLeave={() => hideThreadReactionTooltip(message, 'love')}
            >
            <span className="emoji" role="img" aria-label="love">❤️</span>
            <span class="reaction-count">{getThreadEmojiCount(message, 'love')}</span>

              {isThreadTooltipVisible(message, 'love') && (
                <div className="reaction-tooltip">
                    <span className="reaction-text" role="img" aria-label="like">❤️</span>
                        <div class="user-text">
                            {reactionThreadUserNames[`${message}_love`] || 'Laden...'} {/* Benutzer für "love" */}
                        </div>
                </div>
                )}
            </span>
            )}
        {getThreadEmojiCount(message, 'haha') > 0 && (
            <span
                className="emoji-display"
                onClick={() =>
                    handleThreadReactionClick(message, 'haha', getThreadEmojiCount(message, 'haha'))
                }
                onMouseEnter={() => showReactionTooltip(message, 'haha')}
                onMouseLeave={() => hideThreadReactionTooltip(message, 'haha')}
                >
                <span className="emoji" role="img" aria-label="haha">😂</span>
                <span class="reaction-count">{getThreadEmojiCount(message, 'haha')}</span>

                {isThreadTooltipVisible(message, 'haha') && (
                    <div className="reaction-tooltip">
                        <span className="reaction-text" role="img" aria-label="like">😂</span>
                         <div class="user-text">
                                {reactionThreadUserNames[`${message}_haha`] || 'Laden...'} {/* Benutzer für "love" */}
                        </div>
                        </div>
                    )}
                        </span>
                    )}
            {getThreadEmojiCount(message, 'wow') > 0 && (
                <span
                    className="emoji-display"
                    onClick={() =>
                        handleThreadReactionClick(message, 'wow', getThreadEmojiCount(message, 'wow'))
                    }
                    onMouseEnter={() => showReactionTooltip(message, 'wow')}
                    onMouseLeave={() => hideThreadReactionTooltip(message, 'wow')}
                >
                <span className="emoji" role="img" aria-label="wow">😮</span>
                <span class="reaction-count">{getThreadEmojiCount(message, 'wow')}</span>

                {isThreadTooltipVisible(message, 'wow') && (
                    <div className="reaction-tooltip">
                    <span className="reaction-text" role="img" aria-label="like">😮</span>
                    <div class="user-text">
                        {reactionThreadUserNames[`${message}_wow`] || 'Laden...'} {/* Benutzer für "love" */}
                    </div>
                    </div>
                    )}
                 </span>
                )}
            {getThreadEmojiCount(message, 'sad') > 0 && (
                    <span
                    className="emoji-display"
                    onClick={() =>
                        handleThreadReactionClick(message, 'sad', getThreadEmojiCount(message, 'sad'))
                    }
                    onMouseEnter={() => showReactionTooltip(message, 'sad')}
                    onMouseLeave={() => hideThreadReactionTooltip(message, 'sad')}
                    >
                    <span className="emoji" role="img" aria-label="sad">😢</span>
                    <span class="reaction-count">{getThreadEmojiCount(message, 'sad')}</span>

                    {isThreadTooltipVisible(message, 'sad') && (
                        <div className="reaction-tooltip">
                            <span className="reaction-text" role="img" aria-label="like">😢</span>
                            <div class="user-text">
                        {reactionThreadUserNames[`${message}_sad`] || 'Laden...'} {/* Benutzer für "love" */}
                            </div>
                        </div>
                    )}
                    </span>
                )}
            {getThreadEmojiCount(message, 'angry') > 0 && (
                    <span
                    className="emoji-display"
                    onClick={() =>
                        handleThreadReactionClick(message, 'angry', getThreadEmojiCount(message, 'angry'))
                    }
                    onMouseEnter={() => showReactionTooltip(message, 'angry')}
                    onMouseLeave={() => hideThreadReactionTooltip(message, 'angry')}
                    >
                    <span className="emoji" role="img" aria-label="angry">😡</span>
                    <span class="reaction-count">{getThreadEmojiCount(message, 'angry')}</span>

                    {isThreadTooltipVisible(message, 'angry') && (
                        <div className="reaction-tooltip">
                                    <span className="reaction-text" role="img" aria-label="like">😡</span>
                                    <div class="user-text">
                                        {reactionThreadUserNames[`${message}_angry`] || 'Laden...'} {/* Benutzer für "love" */}
                                    </div>
                        </div>
                    )}
                    </span>
                )}
             </div>

    </div>
 </div> 
)};

export default ThreadBottom;
