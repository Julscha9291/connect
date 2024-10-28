// ChatHeader.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile, faPaperclip, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const ChatFooter = ({
    newMessage, 
    setNewMessage, 
    handleSendMessage, 
    showEmojiPicker,
    EmojiPicker,
    handleEmojiClick,
    setShowEmojiPicker,
    filePreview,
    attachedFile,
    handleRemoveFile,
    handleFileChange
  }) => {

    const handleInputChange = (e) => {
      setNewMessage(e.target.value);
      e.target.style.height = 'auto'; 
      e.target.style.height = `${e.target.scrollHeight}px`;
    };
  
    return (
    <div> 
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
                style={{ display: 'none' }}  
                onChange={handleFileChange}  
              />
        
          <div className="footer-left">
          <textarea
              className="message-input"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Write a message..."
              rows="1" 
              style={{ resize: 'none', overflow: 'hidden' }} 
            />
        </div>
    
        <div className="footer-right">
        <button className="send-btn" onClick={() => setShowEmojiPicker((prev) => !prev)}>
               <FontAwesomeIcon icon={faSmile} /> 
              </button>

          <button className="send-btn" onClick={handleSendMessage}>
          <FontAwesomeIcon icon={faPaperPlane} /> 
          </button>
        </div>      
    </div>
    
    <div className="chat-attach">
      {filePreview && (
        <div className="file-preview">
              {attachedFile ? (
                attachedFile.type.startsWith('image/') ? (
                    <img
                        src={filePreview}
                        alt="Preview"
                        style={{ width: '200px', height: 'auto' }} 
                    />
                ) : (
                    <p>{attachedFile.name}</p>
                )
            ) : null} 
          <button className="remove-file-btn" onClick={handleRemoveFile}>
            &times;
          </button>
        </div>
      )}
    </div>
  </div>
</div>
);  
};
  
export default ChatFooter;
  