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
              style={{ width: '200px', height: 'auto' }} 
            />
          ) : (
            <p>{attachedFile?.name}</p> 
          )}
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
  