# CoreV2 Mental Health Platform

A comprehensive, privacy-first mental health support platform built with React, TypeScript, and modern web technologies.

## 🌟 Features

### 🔐 **Privacy & Security First**
- End-to-end encryption for sensitive data
- HIPAA-compliant security measures
- Anonymous user support
- Secure error handling with data sanitization

### 🚨 **Crisis Intervention**
- 24/7 crisis detection and response
- Direct integration with crisis hotlines (988, 911)
- Emergency contact management
- Real-time crisis escalation

### 🤖 **AI-Powered Support**
- Intelligent mental health chat assistance
- Personalized coping strategies
- Mood and wellness tracking
- Therapeutic conversation analysis

### 🏥 **Comprehensive Tools**
- Mental health assessments (GAD-7, PHQ-9)
- Mood and wellness tracking
- Daily reflections and journaling
- Offline functionality for crisis situations

### 👥 **Community Support**
- Peer-to-peer support networks
- Anonymous community interactions
- Trained helper connections
- Group support sessions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/CoreV2_Mental_Health_Platform.git
cd CoreV2_Mental_Health_Platform

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Architecture

### Frontend Stack
- **React 18.3.1** - Modern React with hooks and Suspense
- **TypeScript 5.6+** - Type safety and enhanced developer experience
- **Vite 7.x** - Fast build tool and development server
- **React Router DOM 7.x** - Client-side routing

### Key Services
- **Crisis Detection Service** - AI-powered crisis intervention
- **Encryption Service** - End-to-end data protection
- **Offline Service** - Offline functionality for crisis situations
- **Performance Service** - Real-time performance monitoring
- **Emergency Contact Service** - Crisis contact management

### Security Features
- Content Security Policy (CSP)
- Rate limiting and DDoS protection
- Input sanitization and XSS prevention
- Secure session management
- HIPAA-compliant data handling

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts for global state
├── hooks/             # Custom React hooks
├── services/          # Business logic and API services
├── utils/             # Utility functions
├── views/             # Page components
├── config/            # Configuration files
└── styles/            # CSS and styling
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=https://your-api-url.com
VITE_ENABLE_ANALYTICS=false
VITE_ENVIRONMENT=production
```

### Security Configuration

The platform includes comprehensive security configurations in `src/config/security.config.ts`:

- Encryption settings (AES-256-GCM)
- Session management
- CORS policies
- Rate limiting
- Content Security Policy

## 🚀 Deployment

### Netlify Deployment

The platform is optimized for Netlify deployment:

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Environment Variables**: Configure in Netlify dashboard
4. **Deploy**: Automatic deployments on push to main branch

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting provider
```

## 🔍 Performance

### Build Optimization
- **Bundle Splitting**: Automatic code splitting for optimal loading
- **Lazy Loading**: Route-based lazy loading
- **Compression**: Gzip and Brotli compression
- **Tree Shaking**: Unused code elimination

### Performance Metrics
- **Load Time**: < 3 seconds
- **Bundle Size**: < 500KB main bundle
- **Lighthouse Score**: 95+ across all metrics

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

## 📊 Monitoring

### Built-in Monitoring
- Real-time performance tracking
- Error boundary with security sanitization
- Memory usage monitoring
- Network performance analysis

### Logging
- Structured logging with Winston
- Security event logging
- Performance metrics collection
- Error tracking and reporting

## 🛡️ Security

### Data Protection
- Client-side encryption for sensitive data
- Secure localStorage with encryption
- PII sanitization in error reports
- HIPAA-compliant data handling

### Crisis Security
- Emergency override protocols
- Elevated logging for crisis situations
- Secure crisis note handling
- Audit trail for all crisis interventions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Maintain security standards
- Document new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Crisis Resources

**If you or someone you know is in crisis:**

- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: 911

## 🙏 Acknowledgments

- Mental health professionals who provided guidance
- Open source community for amazing tools
- Crisis intervention specialists for their expertise
- Users who provide feedback and support

## 📞 Support

- **Technical Support**: Create an issue on GitHub
- **Security Issues**: Email security@corev2.com
- **General Questions**: Email support@corev2.com

---

**Built with ❤️ for mental health support and crisis intervention**
