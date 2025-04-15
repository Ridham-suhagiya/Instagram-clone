# Instagram API Integration Backend

This backend application is built using Node.js and Express.js to integrate with the Instagram Graph API. It provides endpoints for OAuth authentication, fetching user profiles, media, comments, and posting comments or replies. It also includes webhook verification for Instagram.

## Features

1. **OAuth Authentication**:
   - Handles Instagram OAuth flow to authenticate users.
   - Exchanges authorization codes for access tokens.

2. **Webhook Verification**:
   - Verifies Instagram webhook subscriptions.

3. **User Profile Fetching**:
   - Fetches Instagram user profile details such as username, account type, media count, followers, and more.

4. **Media and Comments**:
   - Fetches user media (feeds) along with associated comments.
   - Allows posting comments on media and replying to comments.

5. **Session Authentication**:
   - Verifies if a user session is authenticated.

## Environment Variables

The application uses the following environment variables:

| Variable Name           | Description                                      |
|-------------------------|--------------------------------------------------|
| `INSTAGRAM_CLIENT_ID`   | Instagram App Client ID.                         |
| `INSTAGRAM_CLIENT_SECRET` | Instagram App Client Secret.                   |
| `FRONTEND_URL`          | URL of the frontend application.                 |
| `INSTAGRAM_TOKEN`       | Webhook verification token for Instagram.        |

## Endpoints

### 1. **OAuth Authentication**
- **GET `/auth/instagram`**:
  - Redirects users to Instagram's OAuth page.
  - Handles webhook verification if applicable.

- **GET `/auth/instagram/callback`**:
  - Handles the callback from Instagram after user authentication.
  - Exchanges the authorization code for an access token.

### 2. **User Profile**
- **GET `/instagram/profile`**:
  - Fetches the authenticated user's Instagram profile details.

### 3. **User Feeds (Media)**
- **GET `/instagram/feeds`**:
  - Fetches the user's media along with comments for each media.

### 4. **Post Comments**
- **POST `/instagram/comment`**:
  - Posts a comment on a specific Instagram media.
  - **Request Body**:
    - `mediaId`: ID of the media to comment on.
    - `message`: Comment message.

- **POST `/instagram/reply`**:
  - Replies to a specific comment on Instagram.
  - **Request Body**:
    - `commentId`: ID of the comment to reply to.
    - `message`: Reply message.

### 5. **Session Authentication**
- **GET `/instagram/authenticateSession`**:
  - Verifies if the user session is authenticated.

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure the environment variables:
   ```plaintext
   INSTAGRAM_CLIENT_ID=<your-client-id>
   INSTAGRAM_CLIENT_SECRET=<your-client-secret>
   FRONTEND_URL=<your-frontend-url>
   INSTAGRAM_TOKEN=<your-webhook-verification-token>
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. The server will run on `http://localhost:5000`.

## Docker Support

The application includes a `Dockerfile` for containerization. To build and run the application in a Docker container:

1. Build the Docker image:
   ```bash
   docker build -t instagram-backend .
   ```

2. Run the Docker container:
   ```bash
   docker run -p 5000:5000 --env-file .env instagram-backend
   ```

## Dependencies

- **Express**: Web framework for building APIs.
- **Axios**: HTTP client for making API requests.
- **dotenv**: Loads environment variables from a `.env` file.
- **cors**: Enables Cross-Origin Resource Sharing.

## Notes

- The application uses an in-memory storage (`usersTokenMapper`) to map user IDs to access tokens. This is not suitable for production and should be replaced with a persistent database.
- Ensure that the `REDIRECT_URI` in the code matches the URI configured in your Instagram App settings.

## License

This project is licensed under the ISC License.
