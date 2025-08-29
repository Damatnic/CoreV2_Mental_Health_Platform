# 🧠 CoreV2 Mental Health Platform

A comprehensive, HIPAA-compliant mental health platform with crisis intervention, AI-powered support, and teletherapy capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- PostgreSQL 14+
- Redis

### Installation

1. **Clone and Install**
```bash
git clone [repository-url]
cd CoreV2_Mental_Health_Platform
npm install
```

2. **Backend Setup**
```bash
cd src/backend
npm install
docker-compose up -d
npm run dev
```

3. **Frontend Setup**
```bash
npm run dev
```

4. **Environment Configuration**
Create `.env` file in root:
```env
# Backend
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/mental_health
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379

# Frontend
VITE_API_URL=http://localhost:3001/api
VITE_WEBSOCKET_URL=http://localhost:3001

# Third-party APIs (obtain your own keys)
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SENDGRID_API_KEY=
```

## ✨ Key Features

### 🚨 Crisis Intervention
- 988 Suicide & Crisis Lifeline integration
- Emergency panic button
- Real-time crisis detection
- Multi-language support
- Location-based resources

### 🤖 AI-Powered Support
- Therapeutic chatbot with GPT-4/Claude
- Sentiment analysis
- Crisis detection in conversations
- Personalized responses

### 📊 Mental Health Tracking
- Mood tracking with analytics
- Symptom monitoring
- Sleep pattern analysis
- Medication reminders
- Progress reports

### 💬 Teletherapy
- WebRTC video sessions
- Appointment scheduling
- Secure messaging
- Screen sharing
- Session recording (with consent)

### 🎮 Wellness Features
- Gamification system
- Wellness curriculum (CBT/DBT)
- Music therapy
- Biometric monitoring
- Support forums

## 📁 Project Structure

```
CoreV2_Mental_Health_Platform/
├── src/
│   ├── backend/          # Express.js backend
│   ├── components/       # React components
│   ├── services/         # Business logic
│   ├── hooks/           # React hooks
│   ├── contexts/        # React contexts
│   ├── utils/           # Utilities
│   └── views/           # Page components
├── docs/                # Documentation
├── public/              # Static assets
└── tests/               # Test files
```

## 🔒 Security & Compliance

- **HIPAA Compliant**: Full PHI encryption and audit logging
- **Authentication**: JWT with 2FA support
- **Data Encryption**: AES-256-GCM for sensitive data
- **Session Management**: Secure token handling
- **Rate Limiting**: DDoS protection

## 📚 Documentation

- [API Documentation](docs/api/)
- [Deployment Guide](docs/deployment/)
- [Crisis Protocol](docs/CRISIS_INTEGRATION_GUIDE.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🧪 Testing

```bash
# Run tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🚀 Deployment

See [Deployment Guide](docs/deployment/NETLIFY_DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📊 Status

- **Frontend**: ✅ Complete (100%)
- **Backend**: ✅ Complete (100%)
- **Database**: ✅ Schema ready
- **Authentication**: ✅ Implemented
- **Real-time**: ✅ WebSocket ready
- **Crisis Safety**: ✅ Fully integrated

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions, please file an issue on GitHub.

---

**Platform Status**: Production-Ready 🚀
**Last Updated**: December 2024