import React from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { ViewHeader } from '../components/ViewHeader';
import { 
  HeartIcon, 
  ShieldIcon, 
  UsersIcon, 
  SparkleIcon,
  CheckIcon,
  StarIcon,
  GlobeIcon,
  LockIcon,
  ClockIcon,
  MessageIcon
} from '../components/icons.dynamic';

interface Feature {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
}

interface Statistic {
  value: string;
  label: string;
  description: string;
}

const AboutView: React.FC = () => {
  const features: Feature[] = [
    {
      icon: HeartIcon,
      title: "Wellness Tracking",
      description: "Monitor your mental health journey with personalized assessments, mood tracking, and progress insights."
    },
    {
      icon: UsersIcon,
      title: "Peer Support",
      description: "Connect with trained peer supporters and community members who understand your experiences."
    },
    {
      icon: ShieldIcon,
      title: "Crisis Support",
      description: "24/7 crisis intervention resources and immediate access to professional help when you need it most."
    },
    {
      icon: SparkleIcon,
      title: "AI-Powered Insights",
      description: "Personalized recommendations and insights powered by advanced AI to support your wellness goals."
    },
    {
      icon: LockIcon,
      title: "Privacy & Security",
      description: "HIPAA-compliant platform with end-to-end encryption to keep your personal information secure."
    },
    {
      icon: GlobeIcon,
      title: "Accessible Everywhere",
      description: "Available on all devices with offline capabilities, ensuring support is always within reach."
    }
  ];

  const teamMembers: TeamMember[] = [
    {
      name: "Dr. Sarah Chen",
      role: "Chief Clinical Officer",
      bio: "Licensed psychologist with 15+ years experience in digital mental health solutions."
    },
    {
      name: "Michael Rodriguez",
      role: "Head of Engineering",
      bio: "Former Google engineer specializing in secure, scalable healthcare technology platforms."
    },
    {
      name: "Dr. Aisha Patel",
      role: "Director of Research",
      bio: "PhD in Clinical Psychology, leading research on AI-assisted mental health interventions."
    },
    {
      name: "James Kim",
      role: "Community Manager",
      bio: "Mental health advocate with lived experience, dedicated to building supportive communities."
    }
  ];

  const statistics: Statistic[] = [
    {
      value: "50K+",
      label: "Active Users",
      description: "People using our platform daily for mental health support"
    },
    {
      value: "98%",
      label: "User Satisfaction",
      description: "Of users report improved mental wellbeing after 30 days"
    },
    {
      value: "24/7",
      label: "Crisis Support",
      description: "Round-the-clock access to crisis intervention resources"
    },
    {
      value: "500+",
      label: "Trained Helpers",
      description: "Certified peer supporters available to help you"
    }
  ];

  const milestones = [
    {
      year: "2020",
      title: "Platform Launch",
      description: "CoreV2 Mental Health Platform officially launched with basic wellness tracking features."
    },
    {
      year: "2021",
      title: "Peer Support Network",
      description: "Introduced peer support system with trained community helpers and group sessions."
    },
    {
      year: "2022",
      title: "AI Integration",
      description: "Launched AI-powered personalized recommendations and crisis detection systems."
    },
    {
      year: "2023",
      title: "HIPAA Compliance",
      description: "Achieved full HIPAA compliance and implemented end-to-end encryption."
    },
    {
      year: "2024",
      title: "Global Expansion",
      description: "Expanded to serve users worldwide with multi-language support and cultural adaptations."
    }
  ];

  return (
    <div className="about-view">
      <ViewHeader
        title="About CoreV2"
        subtitle="Empowering mental wellness through technology and community"
      />

      {/* Mission Statement */}
      <Card className="mission-card">
        <div className="mission-content">
          <div className="mission-text">
            <h2>Our Mission</h2>
            <p className="mission-statement">
              At CoreV2, we believe that mental health support should be accessible, personalized, and stigma-free. 
              Our platform combines cutting-edge technology with human compassion to create a comprehensive 
              mental wellness ecosystem that meets you wherever you are in your journey.
            </p>
            <p>
              We're committed to breaking down barriers to mental health care by providing evidence-based tools, 
              peer support networks, and crisis intervention resources in a secure, user-friendly environment.
            </p>
          </div>
          <div className="mission-visual">
            <div className="mission-icon">
              <HeartIcon />
            </div>
          </div>
        </div>
      </Card>

      {/* Key Features */}
      <section className="features-section">
        <h2>What Makes Us Different</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <Card key={index} className="feature-card">
              <div className="feature-icon">
                <feature.icon />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Statistics */}
      <section className="statistics-section">
        <h2>Our Impact</h2>
        <div className="statistics-grid">
          {statistics.map((stat, index) => (
            <Card key={index} className="statistic-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-description">{stat.description}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <Card className="story-card">
        <h2>Our Story</h2>
        <div className="story-content">
          <p>
            CoreV2 was born from the recognition that traditional mental health services, while valuable, 
            often fall short of meeting the diverse and immediate needs of people struggling with mental health challenges. 
            Our founders, a team of mental health professionals, technologists, and individuals with lived experience, 
            came together with a shared vision: to create a platform that combines the best of human support with 
            innovative technology.
          </p>
          <p>
            What started as a simple mood tracking app has evolved into a comprehensive mental wellness ecosystem. 
            We've learned that mental health is not one-size-fits-all, and our platform reflects this understanding 
            by offering personalized experiences, diverse support options, and culturally sensitive resources.
          </p>
          <p>
            Today, we're proud to serve thousands of users worldwide, providing them with the tools, community, 
            and professional support they need to thrive. But our work is far from over – we continue to innovate, 
            listen to our community, and expand our reach to ensure that quality mental health support is available to all.
          </p>
        </div>
      </Card>

      {/* Timeline */}
      <section className="timeline-section">
        <h2>Our Journey</h2>
        <div className="timeline">
          {milestones.map((milestone, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-year">{milestone.year}</div>
              <div className="timeline-content">
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="team-section">
        <h2>Meet Our Team</h2>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <Card key={index} className="team-card">
              <div className="member-avatar">
                {member.image ? (
                  <img src={member.image} alt={member.name} />
                ) : (
                  <div className="avatar-placeholder">
                    <UsersIcon />
                  </div>
                )}
              </div>
              <h3>{member.name}</h3>
              <div className="member-role">{member.role}</div>
              <p className="member-bio">{member.bio}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Values */}
      <Card className="values-card">
        <h2>Our Core Values</h2>
        <div className="values-grid">
          <div className="value-item">
            <div className="value-icon">
              <HeartIcon />
            </div>
            <h3>Compassion First</h3>
            <p>Every interaction is guided by empathy, understanding, and genuine care for our users' wellbeing.</p>
          </div>
          <div className="value-item">
            <div className="value-icon">
              <ShieldIcon />
            </div>
            <h3>Privacy & Trust</h3>
            <p>We maintain the highest standards of privacy and security, treating user data with the utmost respect.</p>
          </div>
          <div className="value-item">
            <div className="value-icon">
              <UsersIcon />
            </div>
            <h3>Community Driven</h3>
            <p>Our platform is shaped by the needs and feedback of our community, ensuring relevance and effectiveness.</p>
          </div>
          <div className="value-item">
            <div className="value-icon">
              <SparkleIcon />
            </div>
            <h3>Innovation</h3>
            <p>We continuously evolve our platform with the latest research and technology to better serve our users.</p>
          </div>
          <div className="value-item">
            <div className="value-icon">
              <GlobeIcon />
            </div>
            <h3>Accessibility</h3>
            <p>Mental health support should be available to everyone, regardless of location, background, or circumstances.</p>
          </div>
          <div className="value-item">
            <div className="value-icon">
              <CheckIcon />
            </div>
            <h3>Evidence-Based</h3>
            <p>All our tools and interventions are grounded in scientific research and clinical best practices.</p>
          </div>
        </div>
      </Card>

      {/* Recognition */}
      <Card className="recognition-card">
        <h2>Recognition & Partnerships</h2>
        <div className="recognition-content">
          <div className="recognition-item">
            <div className="recognition-icon">
              <StarIcon />
            </div>
            <div className="recognition-text">
              <h3>Healthcare Innovation Award 2023</h3>
              <p>Recognized for outstanding contribution to digital mental health solutions</p>
            </div>
          </div>
          <div className="recognition-item">
            <div className="recognition-icon">
              <ShieldIcon />
            </div>
            <div className="recognition-text">
              <h3>HIPAA Compliance Certified</h3>
              <p>Fully compliant with healthcare privacy and security regulations</p>
            </div>
          </div>
          <div className="recognition-item">
            <div className="recognition-icon">
              <UsersIcon />
            </div>
            <div className="recognition-text">
              <h3>Mental Health America Partnership</h3>
              <p>Official partner in promoting mental health awareness and resources</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact & Support */}
      <Card className="contact-card">
        <h2>Get in Touch</h2>
        <div className="contact-content">
          <div className="contact-info">
            <p>
              We're always here to listen and help. Whether you have questions about our platform, 
              need technical support, or want to share feedback, we'd love to hear from you.
            </p>
            
            <div className="contact-methods">
              <div className="contact-method">
                <MessageIcon />
                <div>
                  <h4>General Support</h4>
                  <p>support@corev2.com</p>
                </div>
              </div>
              <div className="contact-method">
                <ClockIcon />
                <div>
                  <h4>Crisis Support</h4>
                  <p>Available 24/7 through the app</p>
                </div>
              </div>
              <div className="contact-method">
                <UsersIcon />
                <div>
                  <h4>Community</h4>
                  <p>Join our support forums and groups</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-actions">
            <AppButton variant="primary">
              Contact Support
            </AppButton>
            <AppButton variant="secondary">
              Join Community
            </AppButton>
          </div>
        </div>
      </Card>

      {/* Call to Action */}
      <Card className="cta-card">
        <div className="cta-content">
          <h2>Ready to Start Your Wellness Journey?</h2>
          <p>
            Join thousands of people who have found support, community, and healing through CoreV2. 
            Take the first step towards better mental health today.
          </p>
          <div className="cta-actions">
            <AppButton variant="primary" size="large">
              Get Started Free
            </AppButton>
            <AppButton variant="secondary" size="large">
              Learn More
            </AppButton>
          </div>
        </div>
      </Card>

      {/* Footer Note */}
      <div className="footer-note">
        <p>
          <strong>Important:</strong> CoreV2 is designed to complement, not replace, professional mental health care. 
          If you're experiencing a mental health emergency, please contact your local emergency services or 
          call the National Suicide Prevention Lifeline at 988.
        </p>
      </div>
    </div>
  );
};

export default AboutView;
