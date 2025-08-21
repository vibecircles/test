# VibeCircles Social Network

A modern social networking platform built with Node.js, Express, and Supabase, featuring a beautiful frontend with full API integration.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with secure password hashing
- 👥 **User Management**: User profiles, friend requests, and privacy settings
- 📝 **Posts & Comments**: Create, edit, delete posts with likes and comments
- 🎉 **Events & Birthdays**: Event management with RSVP functionality and birthday tracking
- 👥 **Groups/Circles**: Create and manage social groups with different privacy levels
- 🔒 **Privacy Controls**: Granular privacy settings for profiles and posts
- 📱 **Responsive Design**: Beautiful, modern UI that works on all devices
- 🚀 **Real-time Ready**: Built with real-time capabilities in mind

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - Database and authentication
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Styling with modern features
- **JavaScript** - Interactive functionality
- **Bootstrap** - Responsive framework
- **Font Awesome** - Icons

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vibecircles-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   
   # Other configurations...
   ```

4. **Set up Supabase Database**
   
   Run the SQL schema from `database/schema/vibecircles_schema.sql` in your Supabase SQL editor.

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/posts` - Get user posts
- `POST /api/users/:id/friend-request` - Send friend request
- `PUT /api/users/:id/friend-request` - Accept/reject friend request
- `GET /api/users/:id/friends` - Get user friends
- `GET /api/users/friend-requests/pending` - Get pending friend requests
- `DELETE /api/users/:id/friend` - Remove friend
- `POST /api/users/:id/block` - Block user

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comments` - Add comment
- `GET /api/posts/:id/comments` - Get post comments

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/rsvp` - RSVP to event
- `GET /api/events/birthdays/upcoming` - Get upcoming birthdays
- `GET /api/events/:id/attendees` - Get event attendees

### Groups
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get single group
- `POST /api/groups` - Create new group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group
- `GET /api/groups/:id/members` - Get group members
- `PUT /api/groups/:id/members/:userId/role` - Update member role
- `DELETE /api/groups/:id/members/:userId` - Remove member

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - Go to your project settings
   - Add all environment variables from your `.env` file

### Deploy to Railway

1. **Connect your GitHub repository to Railway**
2. **Set environment variables in Railway dashboard**
3. **Deploy automatically on push**

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_KEY` | Your Supabase service key | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | No (default: 7d) |
| `CORS_ORIGIN` | Allowed CORS origins | No |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port | No (default: 3000) |

## Database Schema

The application uses the following main tables:

- **users** - User accounts and authentication
- **profiles** - User profile information
- **posts** - Social media posts
- **comments** - Post comments
- **likes** - Post and comment likes
- **friendships** - Friend relationships
- **groups** - Social groups/circles
- **group_memberships** - Group membership
- **events** - Events and birthdays
- **event_attendees** - Event RSVPs
- **notifications** - User notifications
- **user_settings** - User preferences

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable rounds
- **CORS Protection** - Configurable cross-origin requests
- **Rate Limiting** - API request rate limiting
- **Helmet** - Security headers
- **Input Validation** - Request data validation
- **SQL Injection Protection** - Using Supabase client

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email support@vibecircles.com or create an issue in the repository.

## Roadmap

- [ ] Real-time messaging
- [ ] File upload functionality
- [ ] Push notifications
- [ ] Mobile app
- [ ] Advanced search
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] API rate limiting improvements
- [ ] Caching layer
- [ ] Performance optimizations
