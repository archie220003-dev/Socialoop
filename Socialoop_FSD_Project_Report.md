# Technical Report: Socialoop Social Media Platform
**Full Stack Development (FSD) & Design Analysis of Algorithms (DAA) Graduation Project**

---

## 1. Executive Summary
Socialoop is a high-performance, real-time social media platform designed with a premium "glassmorphism" aesthetic. The project demonstrates a robust integration of the MERN (MongoDB, Express, React, Node.js) stack, supplemented by advanced algorithmic implementations for content discovery and real-time synchronization via WebSockets.

---

## 2. Technology Stack
| Layer | Technology | Key Usage |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | Component-based UI with Context API for state management. |
| **Backend** | Node.js / Express | RESTful API service & real-time socket server. |
| **Database** | MongoDB | NoSQL document storage for scalability and flexibility. |
| **Real-Time** | Socket.io | Bidirectional communication for messaging & notifications. |
| **Media** | Cloudinary | Cloud-based image optimization and streaming storage. |
| **Style** | Vanilla CSS | Custom design system using glassmorphic principles (HSL color tokens). |

---

## 3. System Architecture
Socialoop follows a **Single Page Application (SPA)** architecture with a decoupled REST API.

### Data Flow
1. **Request**: The React frontend sends an HTTP request (w/ JWT in headers) to the Express backend.
2. **Auth**: Middleware validates the JWT and checks user roles (User vs Admin).
3. **Processing**: Controllers execute business logic, interacting with the MongoDB models via Mongoose.
4. **Algos**: For the Feed and Trending sections, the backend invokes dedicated algorithmic modules.
5. **Real-time**: If an action (like a message) occurs, the Socket server emits events to relevant clients.
6. **Response**: JSON payload is sent back to the client, and the UI updates reactively.

---

## 4. Advanced Algorithmic Implementations (DAA)
One of the core strengths of Socialoop is the use of custom data structures and algorithms to handle large datasets efficiently.

### 4.1. Feed Ranking (Max Heap / Priority Queue)
Instead of simple chronological sorting, the Home Feed utilizes a **Max Heap** implementation located in `FeedRanking.js`.
- **Logic**: Each post is assigned a weight based on Engagement (Upvotes - Downvotes) and Recency (Linear Decay).
- **Efficiency**: 
  - Building the Heap: O(N log K)
  - Extracting top K posts: O(K log N)
- **Benefit**: Ensures users find relevant content immediately without processing the entire database on every request.

### 4.2. Trending Algorithm (Time-Decay Scoring)
Global trending content is calculated using a **Time-Decay algorithm** (Hacker News standard).
- **Formula**: Score = Engagement / (Hours + 2)^G (where G = 1.8).
- **Impact**: Automatically penalizes older posts exponentially, allowing new, high-engagement content to "break through" quickly.

---

## 5. Feature Breakdown
- **Unified Auth**: Secure registration and login with JWT persistent sessions.
- **Community Management**: Dynamic community creation with member-restricted posting.
- **Rich Posting**: Markdown support, image uploads via Cloudinary, and threaded commenting.
- **Nested Comments**: Multi-level recursion in the UI to support deep discussions.
- **Real-Time Mesh**: Instant notifications for likes, replies, and mentions.
- **Live Search**: Debounced search indexing for users and communities.
- **Admin Dashboard**: Elevated "Super User" status with content moderation capabilities and unique visual badges.

---

## 6. Database Schema (MongoDB/Mongoose)
### 6.1. User Model
Fields: `username`, `email`, `password`, `role` (user/admin), `avatar`, `bio`, `followers/following`, `savedPosts`.
### 6.2. Post Model
Fields: `author`, `community`, `title`, `body`, `image`, `upvotedBy`, `downvotedBy`, `score`.
### 6.3. Comment Model
Fields: `post`, `author`, `body`, `likes`, `parentComment` (self-referencing).

---

## 7. Security Measures
1. **JWT Authentication**: Stateless authentication ensuring server scalability.
2. **Password Hashing**: Bcryptjs implementation for hashing passwords before storage.
3. **Role-Based Access Control (RBAC)**: Distinct permissions for administrators to moderate platform content.
4. **Environment Isolation**: Secure management of API keys (MongoDB URL, Cloudinary, etc.) via `.env` files.

---

## 8. Conclusion
Socialoop represents a complete end-to-end solution for a modern social platform. By combining high-fidelity UI design with efficient computer science algorithms (DAA), it provides a robust showcase of full-stack engineering proficiency.
