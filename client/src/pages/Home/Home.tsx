import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Home.module.css';
import { 
  ArrowRight, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  Star, 
  Users, 
  Mail,
  Instagram,
  Twitter,
  Linkedin,
  Phone,
  Headphones,
  Code,
  Megaphone,
  Shield,
  Clock
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <Users className={styles.featureIcon} />,
      title: "Client Management",
      description: "Organize and track all your clients in one centralized dashboard"
    },
    {
      icon: <FileText className={styles.featureIcon} />,
      title: "Smart Invoicing",
      description: "Create professional invoices and track payments effortlessly"
    },
    {
      icon: <CreditCard className={styles.featureIcon} />,
      title: "Payment Tracking",
      description: "Monitor payment status and cash flow with real-time updates"
    },
    {
      icon: <MessageSquare className={styles.featureIcon} />,
      title: "Client Communication",
      description: "Built-in messaging system to keep all communications organized"
    }
  ];

  const services = [
    {
      icon: <Code className={styles.featureIcon} />,
      title: "Web Development",
      description: "Custom websites and web applications built by our expert developers"
    },
    {
      icon: <Megaphone className={styles.featureIcon} />,
      title: "Social Media Management", 
      description: "Complete social media strategy, content creation, and community management"
    },
    {
      icon: <Headphones className={styles.featureIcon} />,
      title: "24/7 Customer Support",
      description: "Round-the-clock support to ensure your business never stops running"
    },
    {
      icon: <Shield className={styles.featureIcon} />,
      title: "Business Consulting",
      description: "Strategic guidance to scale your freelance business to the next level"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Web Designer",
      content: "Billaroo transformed how I manage my freelance business. Invoice creation is now a breeze!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Content Writer", 
      content: "The client portal feature is game-changing. My clients love the transparency.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Digital Marketer",
      content: "Their web development service helped me launch my portfolio site in just 2 weeks!",
      rating: 5
    }
  ];

  return (
    <div className={styles.homePage}>
      <Navbar variant="home" />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Scale Your Freelance Business with <span className={styles.heroHighlight}>Billaroo</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Complete business management platform + professional services to accelerate your growth.
          </p>
          <div className={styles.heroButtons}>
            {user ? (
              <a href="/dashboard" className={styles.heroPrimaryBtn}>
                Go to Dashboard
                <ArrowRight className={styles.heroArrowIcon} />
              </a>
            ) : (
              <a href="/register" className={styles.heroPrimaryBtn}>
                Get Started Free
                <ArrowRight className={styles.heroArrowIcon} />
              </a>
            )}
            <a href="#features" className={styles.heroSecondaryBtn}>Explore Platform</a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresHeader}>
          <h2 className={styles.sectionTitle}>Powerful Platform Features</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to manage your clients and finances in one place.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                {feature.icon}
              </div>
              <h3 className={styles.featureCardTitle}>{feature.title}</h3>
              <p className={styles.featureCardDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className={styles.servicesSection}>
        <div className={styles.servicesHeader}>
          <h2 className={styles.sectionTitle}>Professional Services</h2>
          <p className={styles.sectionSubtitle}>
            Let our experts handle the heavy lifting while you focus on growing your business.
          </p>
        </div>
        <div className={styles.servicesGrid}>
          {services.map((service, index) => (
            <div key={index} className={styles.serviceCard}>
              <div className={styles.serviceIconWrapper}>
                {service.icon}
              </div>
              <h3 className={styles.serviceCardTitle}>{service.title}</h3>
              <p className={styles.serviceCardDescription}>{service.description}</p>
              <a href="#contact" className={styles.serviceLearnMore}>
                Learn More <ArrowRight className={styles.serviceArrowIcon} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={styles.testimonialsSection}>
        <div className={styles.testimonialsHeader}>
          <h2 className={styles.sectionTitle}>What Our Users Say</h2>
          <p className={styles.sectionSubtitle}>
            Hear from freelancers who are thriving with Billaroo.
          </p>
        </div>
        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className={styles.testimonialCard}>
              <div className={styles.testimonialRating}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className={styles.starIcon} fill="currentColor" />
                ))}
              </div>
              <p className={styles.testimonialContent}>"{testimonial.content}"</p>
              <p className={styles.testimonialAuthor}>
                <span className={styles.testimonialName}>{testimonial.name}</span>,{" "}
                <span className={styles.testimonialRole}>{testimonial.role}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={styles.contactSection}>
        <div className={styles.contactContent}>
          <h2 className={styles.contactTitle}>Get In Touch</h2>
          <p className={styles.contactSubtitle}>
            Ready to transform your freelance business? Let's talk!
          </p>
          
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <Mail className={styles.contactIcon} />
                <div>
                  <h4 className={styles.contactItemTitle}>Email</h4>
                  <a href="mailto:hello@billaroo.com" className={styles.contactLink}>
                    hello@billaroo.com
                  </a>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <Phone className={styles.contactIcon} />
                <div>
                  <h4 className={styles.contactItemTitle}>Phone</h4>
                  <a href="tel:+1234567890" className={styles.contactLink}>
                    +1 (234) 567-890
                  </a>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <Clock className={styles.contactIcon} />
                <div>
                  <h4 className={styles.contactItemTitle}>Support Hours</h4>
                  <span className={styles.contactText}>24/7 Available</span>
                </div>
              </div>
            </div>
            
            <div className={styles.socialMedia}>
              <h4 className={styles.socialTitle}>Follow Us</h4>
              <div className={styles.socialLinks}>
                <a href="https://instagram.com/billaroo" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                  <Instagram className={styles.socialIcon} />
                  <span>Instagram</span>
                </a>
                <a href="https://twitter.com/billaroo" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                  <Twitter className={styles.socialIcon} />
                  <span>Twitter</span>
                </a>
                <a href="https://linkedin.com/company/billaroo" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                  <Linkedin className={styles.socialIcon} />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Grow Your Freelance Business?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of freelancers who trust Billaroo to manage and scale their business.
          </p>
          <div className={styles.ctaButtons}>
            {user ? (
              <a href="/dashboard" className={styles.ctaButton}>
                Go to Dashboard
                <ArrowRight className={styles.ctaArrowIcon} />
              </a>
            ) : (
              <a href="/register" className={styles.ctaButton}>
                Start For Free
                <ArrowRight className={styles.ctaArrowIcon} />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <h3 className={styles.footerLogo}>Billaroo</h3>
          <p className={styles.footerSlogan}>
            Empowering freelancers to build better businesses
          </p>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>Privacy Policy</a>
            <a href="#" className={styles.footerLink}>Terms of Service</a>
            <a href="#contact" className={styles.footerLink}>Contact</a>
          </div>
          <p className={styles.footerCopyright}>
            &copy; {new Date().getFullYear()} Billaroo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}