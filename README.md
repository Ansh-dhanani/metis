# Metis - AI-Powered Recruitment Platform

An intelligent recruitment platform that automates candidate evaluation through resume parsing, live AI interviews, and intelligent scoring algorithms.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

Metis revolutionizes the recruitment process by automating candidate evaluation through a two-round assessment system:

1. **Round 1 (30%)**: Resume parsing and evaluation using AI
2. **Round 2 (70%)**: Live AI-powered interview with contextual questions
3. **Final Scoring**: Weighted algorithm combining both rounds with detailed feedback

The platform supports both candidates and HR recruiters, providing a seamless experience from application to final candidate selection.

## Features

### For Candidates
- Resume upload with automatic parsing and form auto-fill
- Live AI interview with voice and text input support
- Real-time feedback and scoring
- Application status tracking
- Profile management with skills and experience tracking

### For HR Recruiters
- Job posting creation and management
- Automated candidate evaluation pipeline
- Intelligent leaderboard with ranked candidates
- Interview transcript review
- Comprehensive candidate analytics
- Bulk candidate management

### Core Functionality
- **Resume Parser**: Extracts skills, experience, education from PDF/DOC/DOCX files
- **AI Interviewer**: Context-aware questioning based on candidate's resume
- **Scoring Engine**: Weighted algorithm combining resume analysis and interview performance
- **Real-time Communication**: WebSocket-based live interviews
- **Responsive Design**: Mobile-friendly interface built with modern web technologies

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Authentication**: NextAuth.js with OAuth support
- **Real-time**: Socket.io client for live interviews

### Backend
- **Framework**: Flask with Flask-SocketIO
- **Language**: Python 3.11+
- **Database**: MongoDB with MongoEngine ODM
- **Authentication**: JWT tokens with role-based access
- **Real-time**: SocketIO for WebSocket communication
- **AI Integration**: Groq API for LLM services

### AI/ML Components
- **Resume Parser**: Custom METIS model for document analysis
- **Interview Engine**: LangGraph for conversational AI
- **Scoring Algorithm**: Custom weighted scoring system
- **Voice Processing**: Speech-to-text integration

### Infrastructure
- **Deployment**: Docker containerization
- **Hosting**: Vercel (frontend), Railway/Render (backend)
- **Database**: MongoDB Atlas or self-hosted MongoDB
- **Caching**: Redis for session management
- **Monitoring**: Built-in logging and error tracking

## Prerequisites

Before installing Metis, ensure you have the following:

- **Python**: Version 3.11 or higher
- **Node.js**: Version 20+ (or Bun runtime)
- **MongoDB**: Local installation or MongoDB Atlas account
- **Git**: For version control
- **Docker**: Optional, for containerized deployment

### API Keys Required
- **Groq API Key**: For AI language model services
- **MongoDB Connection String**: Database access
- **OAuth Credentials**: Google/GitHub/LinkedIn (optional)

## Installation

### Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/metis.git
   cd metis
   ```

2. **Backend Setup**
   ```bash
   cd backend

   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate

   # Install dependencies
   pip install -r requirements.txt

   # Copy environment template
   cp .env.example .env

   # Edit .env with your configuration (see Configuration section)
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend

   # Install dependencies
   bun install
   # or: npm install

   # Copy environment template
   cp .env.example .env.local

   # Edit .env.local if needed
   ```

4. **Database Setup**
   ```bash
   # Ensure MongoDB is running locally or configure Atlas connection
   # Update MONGO_URI in backend/.env
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   python app.py

   # Terminal 2: Frontend
   cd frontend
   bun run dev
   # or: npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Configuration

### Backend Environment Variables (.env)

Create a `.env` file in the `backend/` directory with the following variables. You can copy from `backend/.env.example`:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/metis
# For MongoDB Atlas, use:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/metis

# AI Services
GROQ_API_KEY=your_groq_api_key_here

# Security Keys
SECRET_KEY=your_random_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here

# Environment Settings
FLASK_ENV=development
DEBUG=True

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# WebSocket Configuration (for production)
# WS_URL=wss://your-backend-domain.com

# Optional: Redis Configuration (for production caching)
# REDIS_URL=redis://localhost:6379

# Optional: Email Configuration
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# Optional: File Upload Settings
# MAX_FILE_SIZE=5242880  # 5MB in bytes
# UPLOAD_FOLDER=uploads/

# Optional: Logging Configuration
# LOG_LEVEL=INFO
# LOG_FILE=logs/app.log
```

### Frontend Environment Variables (.env.local)

Create a `.env.local` file in the `frontend/` directory with the following variables. You can copy from `frontend/.env.example`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000

# Authentication Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# OAuth Providers (Optional)
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Production Configuration (when deploying)
# NEXT_PUBLIC_API_URL=https://your-backend-api.com
# NEXT_PUBLIC_WS_URL=wss://your-backend-api.com
# NEXTAUTH_URL=https://your-frontend-domain.com

# Optional: Analytics
# NEXT_PUBLIC_GA_ID=your_google_analytics_id
# NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# Optional: Error Tracking
# NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Optional: CDN Configuration
# NEXT_PUBLIC_CDN_URL=https://your-cdn-domain.com

# Development Configuration
# NODE_ENV=development
```

## Usage

### For Candidates

1. **Registration**: Create an account with email/password or OAuth
2. **Profile Setup**: Complete your profile with personal information
3. **Resume Upload**: Upload your resume for automatic parsing
4. **Job Search**: Browse available job postings
5. **Application**: Apply to jobs with auto-filled information
6. **AI Interview**: Complete the live AI interview when scheduled
7. **Results**: View your scores and feedback

### For HR Recruiters

1. **Registration**: Create an HR account
2. **Job Creation**: Post new job openings with requirements
3. **Candidate Review**: Monitor applications and automated evaluations
4. **Interview Oversight**: Review AI interview transcripts
5. **Decision Making**: Use the leaderboard to select top candidates
6. **Analytics**: Access detailed recruitment analytics

### Admin Features

- User management and role assignment
- System configuration and settings
- Analytics dashboard
- Bulk operations and data export

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
User login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "userId": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate"
  }
}
```

#### POST /api/auth/register
User registration.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "candidate"
}
```

### Job Management Endpoints

#### GET /api/jobs
Retrieve paginated list of jobs.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search query
- `location`: Filter by location
- `type`: Filter by job type

#### POST /api/jobs
Create a new job posting (HR only).

**Request Body:**
```json
{
  "title": "Software Engineer",
  "description": "Job description here",
  "requirements": ["Python", "React", "MongoDB"],
  "location": "Remote",
  "type": "full-time",
  "salary": {
    "min": 50000,
    "max": 80000,
    "currency": "USD"
  }
}
```

#### GET /api/jobs/{job_id}
Retrieve detailed job information.

### Application Endpoints

#### POST /api/applications
Submit a job application.

**Request Body:**
```json
{
  "jobId": "job_id_here",
  "resume": "uploaded_file",
  "coverLetter": "Optional cover letter",
  "answers": {
    "experience": "5 years",
    "availability": "immediate"
  }
}
```

#### GET /api/applications/candidate/{user_id}
Get applications for a candidate.

#### GET /api/applications/job/{job_id}
Get applications for a job (HR only).

### Interview Endpoints

#### POST /api/interview/start
Start an AI interview session.

**Request Body:**
```json
{
  "applicationId": "application_id",
  "jobId": "job_id"
}
```

#### WebSocket /interview
Real-time interview communication.

**Message Format:**
```json
{
  "type": "answer",
  "content": "User's answer here",
  "questionId": "current_question_id"
}
```

### User Management Endpoints

#### GET /api/users/profile
Get current user profile.

#### PUT /api/users/profile
Update user profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "skills": ["Python", "JavaScript"],
  "experience": "5 years",
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor's",
      "field": "Computer Science",
      "year": 2020
    }
  ]
}
```

#### POST /api/users/upload-resume
Upload and parse resume.

**Request Body:** FormData with file

### Scoring and Evaluation Endpoints

#### GET /api/evaluation/{application_id}
Get evaluation results for an application.

#### GET /api/rankings/job/{job_id}
Get candidate rankings for a job (HR only).

## Deployment

### Docker Deployment (Recommended)

1. **Prepare Environment**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Build and Deploy**
   ```bash
   docker-compose up -d
   ```

3. **Access Application**
   - Frontend: https://your-domain.com
   - Backend: https://your-backend-domain.com

### Manual Deployment

#### Backend Deployment
```bash
# Using Railway
railway login
railway link
railway up

# Using Render
# Connect GitHub repository and deploy
```

#### Frontend Deployment
```bash
# Using Vercel
vercel --prod

# Configure environment variables in Vercel dashboard
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database connection established
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] WebSocket support verified (Railway/Render)
- [ ] File upload limits configured
- [ ] Rate limiting implemented
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented

## Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
bun test
# or: npm test
```

### End-to-End Testing
```bash
cd frontend
bun run test:e2e
# or: npm run test:e2e
```

### Manual Testing Checklist

#### Candidate Flow
- [ ] User registration and login
- [ ] Profile completion
- [ ] Resume upload and parsing
- [ ] Job search and filtering
- [ ] Application submission
- [ ] AI interview completion
- [ ] Results viewing

#### HR Flow
- [ ] HR registration and login
- [ ] Job posting creation
- [ ] Candidate application review
- [ ] Interview transcript access
- [ ] Leaderboard functionality
- [ ] Analytics dashboard

## Project Structure

```
metis/
├── backend/
│   ├── api/                 # API route handlers
│   ├── models/             # Database models and AI models
│   ├── routes/             # Flask route definitions
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   ├── app.py              # Main Flask application
│   ├── wsgi.py             # WSGI entry point
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── app/                # Next.js app router pages
│   │   ├── dashboard/      # Protected dashboard pages
│   │   ├── auth/          # Authentication pages
│   │   └── api/           # Next.js API routes
│   ├── components/        # Reusable React components
│   ├── contexts/          # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries and API clients
│   ├── types/             # TypeScript type definitions
│   └── package.json       # Node.js dependencies
├── model/                 # AI model files and training data
├── docs/                  # Documentation files
├── docker-compose.yml     # Docker orchestration
├── Dockerfile            # Container configuration
├── LICENSE               # License file
└── README.md             # This file
```

## Contributing

We welcome contributions to Metis! Please follow these guidelines:

### Development Workflow

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/metis.git
   cd metis
   git checkout -b feature/your-feature-name
   ```

2. **Set Up Development Environment**
   ```bash
   # Follow installation instructions above
   ```

3. **Make Changes**
   - Write clear, concise commit messages
   - Add tests for new features
   - Update documentation as needed
   - Ensure code follows existing style guidelines

4. **Testing**
   ```bash
   # Run all tests
   cd backend && pytest
   cd ../frontend && bun test
   ```

5. **Submit Pull Request**
   - Provide detailed description of changes
   - Reference any related issues
   - Ensure CI checks pass

### Code Style Guidelines

- **Python**: Follow PEP 8 with Black formatter
- **TypeScript**: Use ESLint and Prettier
- **Commits**: Use conventional commit format
- **Documentation**: Update README and docs for API changes

### Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Provide detailed steps to reproduce bugs
- Include relevant error messages and logs
- Specify your environment (OS, browser, versions)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

### Getting Help

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: [GitHub Issues](https://github.com/yourusername/metis/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/metis/discussions)
- **Email**: Contact the maintainers

### Troubleshooting

#### Common Issues

**WebSocket Connection Failed**
- Ensure backend is deployed to WebSocket-compatible platform (Railway/Render)
- Check firewall settings and CORS configuration
- Verify WebSocket URLs in environment variables

**Resume Parsing Failed**
- Check file format (PDF/DOC/DOCX supported)
- Verify file size limits
- Ensure METIS model is properly configured

**AI Interview Not Starting**
- Confirm Groq API key is valid
- Check WebSocket connection
- Review server logs for errors

**Database Connection Issues**
- Verify MongoDB connection string
- Check network connectivity
- Ensure database user has proper permissions

### Performance Optimization

- Use Redis for session caching in production
- Implement rate limiting for API endpoints
- Configure proper database indexing
- Use CDN for static assets
- Monitor memory usage in AI processing

---

## Contributors

<a href="https://github.com/Ansh-dhanani/metis/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Ansh-dhanani/metis" />
</a>

---

We would like to thank the following contributors for their valuable contributions to Metis:

### Core Team

- **Ansh** - Project Lead & Full-Stack Developer
  - Frontend Architecture (Next.js, TypeScript, Tailwind CSS)
  - Backend Development (Flask, Python, MongoDB)
  - AI Integration (Groq API, LangGraph, Resume Parsing)
  - System Design & Deployment

### Contributors

We welcome contributions from the community! See our [Contributing Guidelines](#contributing) to get started.

---

**Metis** - Transforming recruitment through intelligent automation.
