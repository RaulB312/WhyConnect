# Why Connect

## Project Overview

**Why Connect** is a full-stack social media web application built with a React and Node.js + Express backend. It supports user authentication, email verification, image uploads, notifications, and search features.


## Repository

The complete source code (without compiled binaries and `node_modules`) is hosted at:

[https://github.com/RaulB312/WhyConnect](https://github.com/RaulB312/WhyConnect)


## Project Structure

The project is organized into two main folders at the root level: `backend` and `frontend`. Additionally, the root contains configuration files such as `package.json`, `package-lock.json`, and `.gitignore`.

### Root Directory

-   `backend/` — Contains the backend server code and related files.
    
-   `frontend/` — Contains the frontend React application code.
    
-   `package.json` — Node.js project configuration and dependencies.
    
-   `package-lock.json` — Exact versions of installed npm packages.
    
-   `.gitignore` — Specifies files and folders to be ignored by Git.
    

### Backend Folder Structure

-   `controllers/`  
    Contains the controller logic handling incoming requests and responses.
    
    -   `auth.controller.js`
        
    -   `notification.controller.js`
        
    -   `post.controller.js`
        
    -   `search.controller.js`
        
    -   `user.controller.js`
        
-   `db/`  
    Contains database connection logic.
    
    -   `connectToMongoDB.js`
        
-   `lib/utils/`  
    Generates the token after authentification.
    
    -   `generateToken.js`
        
-   `middleware/`  
    Middleware functions for request handling.
    
    -   `protectRoute.js` (authentication guard)
        
    -   `rateLimiter.js` (rate limiting middleware)
        
-   `models/`  
    Mongoose schemas and models.
    
    -   `email-verification-token.js`
        
    -   `notification.model.js`
        
    -   `password-reset-token.js`
        
    -   `post.model.js`
        
    -   `user.model.js`
        
-   `routes/`  
    Express route definitions.
    
    -   `auth.route.js`
        
    -   `notification.route.js`
        
    -   `search.route.js`
        
    -   `user.route.js`
        
-   `utils/`  
    Helper functions for specific features.
    
    -   `mentions.js` (extract and handle user mentions)
        
-   `server.js`  
    Entry point of the backend application.
    

----------

### Frontend Folder Structure

-   `src/`  
    Main source folder for the React frontend application.
    
    -   `components/`  
        Reusable UI components, organized into subfolders:
        
        -   `common/`  
            Contains general-purpose components:  
            `LoadingSpinner.js`, `Post.jsx`, `PostPage.jsx`, `Posts.jsx`, `RightPanel.jsx`, `SavedPage.jsx`, `SearchPage.jsx`, `Sidebar.jsx`
            
        -   `skeletons/`  
            Components used for loading skeleton screens:  
            `PostSkeleton.jsx`, `ProfileHeaderSkeleton.jsx`, `RightPaneSkeleton.jsx`
            
    -   `hooks/`  
        Custom React hooks:  
        `useFollow.jsx`, `useInfiniteScroll.jsx`, `useLikePost.jsx`, `usePaginatedPosts.jsx`, `useUpdateUserProfile.jsx`
        
    -   `pages/`  
        Contains page-level components organized by feature:
        
        -   `auth/`
            
            -   `login/` — `LoginPage.jsx`
                
            -   `signup/` — `SignUpPage.jsx`
                
        -   `home/`
            
            -   `CreatePost.jsx`
                
            -   `HomePage.jsx`
                
        -   `notification/`
            
            -   `NotificationPage.jsx`
                
        -   `profile/`
            
            -   `EditProfileModal.jsx`
                
            -   `ProfilePage.jsx`
                
    -   `utils/`
        
        -   `date/`
            
            -   `index.js` (date formatting utilities)
                
    -   Root of `src/`
        
        -   `App.jsx` (main app component)
            
        -   `index.css` (global styles)
            
        -   `main.jsx` (React entry point)
            

## Build Steps

1.  **Clone the repository:**
    
    ```bash
    git clone https://github.com/RaulB312/WhyConnect.git
    cd why-connect
    ```
    
2.  **Install backend dependencies:**
    
    ```bash
    cd backend
    npm install
    ```
    
3.  **Install frontend dependencies:**
    
    ```bash
    cd ../frontend
    npm install
    ```
    
4.  **Configure environment variables:**
    
    Create a `.env` file inside the `backend` folder with the necessary variables:
    
    ```
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    NODE_ENV=development
    BREVO_SMTP_HOST=your_brevo_smtp_user
    BREVO_API_KEY=your_brevo_api_key
    BREVO_EMAIL=your_email_address
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    
    ```

## Installation & Launch

### Backend
    
-   From the `backend` directory, run:
    
    ```bash
    npm run dev
    ```
    
    This will start the backend server.
    

### Frontend (React)

-   From the `frontend` directory, run:
    
    ```bash
    npm run dev
    ```
    
-   Open your browser at `http://localhost:3000` to access the app.
   

## Usage

-   Visit the frontend URL.
    
-   Register or log in to use the social media platform.
    
-   Navigate through posts, profiles, notifications, and search functionalities.
    

## Notes
    
-   The app depends on the .env file which contain the api keys. Without those the app will not work.
