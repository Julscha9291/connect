# Connect App

**Connect** is a real-time chat application built with a Django backend and a React frontend. Users can register, log in, and start chatting in both private chats and group channels. The app supports threaded conversations, emoji reactions, and more.

## Features

- **User Authentication**: Register and log in using a simple form.
- **Real-time Chat**: Chat with others in real-time using WebSockets.
- **Channels & Private Chats**: Create channels with multiple users or start private conversations.
- **Message Threads**: Create threads for focused discussions on specific messages.
- **Emoji Reactions**: React to messages with emojis.
- **User Profile Management**: Manage user profiles with names and profile pictures.

## Tech Stack

- **Backend**: Django (including Django Channels for WebSocket support)
- **Frontend**: React
- **WebSockets**: For real-time communication
- **Database**: Django ORM with SQLite 

## Installation

### Backend (Django)

1. Clone the repository:

   ```bash
   git clone https://github.com/julscha9291/connect.git

2. Navigate to the backend folder:   

    ```bash
    cd connect/connect

3. Install dependencies:

   ```bash
    pip install -r requirements.txt

4. Run migrations:

   ```bash
    python manage.py migrate 

5. Start the Django development server:

   ```bash
    python manage.py runserver    

### Frontend (react) 

1. Navigate to the frontend folder:

   ```bash
   cd connect/frontend

2. Install dependencies: 

    ```bash
    npm install

3. Start the React development server:

   ```bash
    npm start

## Usage

1. Register an account and log in.
2. Join or create a channel to chat with multiple users.
3. Start a private conversation by selecting a user from the contact list.
4. React to messages with emojis or create threads for detailed discussions.

## Contribution

Feel free to submit issues, feature requests, or pull requests. Your contributions are welcome!