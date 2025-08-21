# VibeCircles Deployment Guide

This guide will help you deploy VibeCircles to Vercel with Supabase as the database.

## Prerequisites

- Node.js (v18 or higher)
- Git
- Vercel account
- Supabase account

## Step 1: Set up Supabase Database

### 1.1 Create Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `vibecircles`
   - Database Password: Create a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

### 1.2 Set up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `database/schema/vibecircles_schema.sql`
3. Paste and run the SQL to create all tables

### 1.3 Get Supabase Credentials

1. Go to Settings → API in your Supabase dashboard
2. Copy the following values:
   - Project URL
   - Anon (public) key
   - Service (secret) key

## Step 2: Prepare Your Code

### 2.1 Install Dependencies

```bash
npm install
```

### 2.2 Create Environment File

```bash
cp env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT Configuration
JWT_SECRET=your_very_long_and_random_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://your-vercel-domain.vercel.app

# Security
BCRYPT_ROUNDS=12
```

### 2.3 Generate JWT Secret

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Use this output as your `JWT_SECRET`.

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 3.2 Login to Vercel

```bash
vercel login
```

### 3.3 Deploy

```bash
vercel
```

Follow the prompts:
- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project: `N`
- Project name: `vibecircles-frontend`
- Directory: `./` (current directory)
- Override settings: `N`

### 3.4 Set Environment Variables

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from your `.env` file:

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | Your Supabase URL | Production |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | Production |
| `SUPABASE_SERVICE_KEY` | Your Supabase service key | Production |
| `JWT_SECRET` | Your JWT secret | Production |
| `JWT_EXPIRES_IN` | `7d` | Production |
| `NODE_ENV` | `production` | Production |
| `CORS_ORIGIN` | Your Vercel domain | Production |

### 3.5 Redeploy

After setting environment variables, redeploy:

```bash
vercel --prod
```

## Step 4: Configure Supabase

### 4.1 Set up Row Level Security (RLS)

In your Supabase SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
```

### 4.2 Create RLS Policies

```sql
-- Users table policies
CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Profiles table policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Posts table policies
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (privacy = 'public');

CREATE POLICY "Users can view friends' posts" ON posts
    FOR SELECT USING (
        privacy = 'friends' AND 
        EXISTS (
            SELECT 1 FROM friendships 
            WHERE (user_id = posts.user_id AND friend_id = auth.uid() AND status = 'accepted')
            OR (user_id = auth.uid() AND friend_id = posts.user_id AND status = 'accepted')
        )
    );

CREATE POLICY "Users can view own posts" ON posts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);
```

### 4.3 Configure CORS in Supabase

1. Go to Settings → API in Supabase
2. Add your Vercel domain to the allowed origins:
   - `https://your-domain.vercel.app`
   - `https://your-domain.vercel.app/*`

## Step 5: Test Your Deployment

### 5.1 Test API Endpoints

Visit your Vercel domain and test:

- Health check: `https://your-domain.vercel.app/health`
- API documentation: Check the README.md for all endpoints

### 5.2 Test Frontend

1. Visit your Vercel domain
2. Try to register a new user
3. Test login functionality
4. Test creating posts
5. Test birthday functionality

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain in Vercel

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

### 6.2 Update Environment Variables

Update `CORS_ORIGIN` to include your custom domain:

```env
CORS_ORIGIN=https://your-domain.vercel.app,https://your-custom-domain.com
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check that your Vercel domain is in Supabase CORS settings
   - Verify `CORS_ORIGIN` environment variable

2. **Database Connection Errors**
   - Verify Supabase credentials in environment variables
   - Check that your Supabase project is active

3. **JWT Errors**
   - Ensure `JWT_SECRET` is set and is a long, random string
   - Check that `JWT_EXPIRES_IN` is properly formatted

4. **404 Errors on API Routes**
   - Verify `vercel.json` configuration
   - Check that all API routes are properly exported

### Debug Mode

To enable debug mode, set:

```env
NODE_ENV=development
```

This will show more detailed error messages.

## Monitoring

### Vercel Analytics

1. Go to your Vercel project
2. Click "Analytics" to view:
   - Page views
   - Performance metrics
   - Error rates

### Supabase Monitoring

1. Go to your Supabase dashboard
2. Check:
   - Database performance
   - API usage
   - Error logs

## Security Checklist

- [ ] JWT secret is long and random
- [ ] Supabase service key is kept secret
- [ ] CORS origins are properly configured
- [ ] RLS policies are in place
- [ ] Environment variables are set in Vercel
- [ ] HTTPS is enabled (automatic with Vercel)

## Performance Optimization

1. **Enable Vercel Edge Functions** (if needed)
2. **Use Supabase Connection Pooling**
3. **Implement Caching** (Redis, etc.)
4. **Optimize Images** (use WebP format)
5. **Minimize Bundle Size**

## Backup Strategy

1. **Database Backups**: Supabase provides automatic backups
2. **Code Backups**: Use Git with GitHub/GitLab
3. **Environment Variables**: Document all variables
4. **Regular Testing**: Test deployment process regularly

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Vercel and Supabase documentation
3. Check the application logs in Vercel dashboard
4. Create an issue in the project repository

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure CI/CD pipeline
3. Set up staging environment
4. Implement backup strategies
5. Plan for scaling
