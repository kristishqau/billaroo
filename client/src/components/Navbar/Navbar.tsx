import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  variant?: 'home' | 'dashboard';
}

export default function Navbar({ variant = 'home' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('mobile-menu-open');
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-menu-open');
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getNavLinks = () => {
    if (variant === 'dashboard' && user) {
      return [
        { href: '/dashboard', label: 'Dashboard', show: true },
        { href: '/clients', label: 'Clients', show: user.role === 'freelancer' },
        { href: '/projects', label: 'Projects', show: true },
        { href: '/invoices', label: 'Invoices', show: user.role === 'freelancer' },
        { href: '/messages', label: 'Messages', show: true },
        { href: '/profile', label: 'Profile', show: true },
      ];
    }

    return [
      { href: '#features', label: 'Platform', show: true },
      { href: '#services', label: 'Services', show: true },
      { href: '#testimonials', label: 'Testimonials', show: true },
      { href: '#contact', label: 'Contact', show: true },
    ];
  };

  const navLinks = getNavLinks().filter(link => link.show);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeMobileMenu();
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContent}>
        <a href="/" className={styles.logo}>Billaroo</a>
        
        <div className={styles.desktopNav}>
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a 
                  href={link.href} 
                  className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          
          <div className={styles.authLinks}>
            {user ? (
              <div className={styles.userSection}>
                <span className={styles.welcomeText}>
                  {user.username} ({user.role})
                </span>
                <button onClick={logout} className={styles.logoutBtn}>
                  Logout
                </button>
              </div>
            ) : (
              <>
                <a href="/login" className={styles.loginBtn}>Login</a>
                <a href="/register" className={styles.signupBtn}>Sign Up</a>
              </>
            )}
          </div>
        </div>

        <button
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open mobile menu"
        >
          <Menu className={styles.menuIcon} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className={styles.mobileMenuOverlay}
          onClick={handleOverlayClick}
        >
          <div className={styles.mobileMenuContent}>
            <button
              className={styles.mobileMenuCloseButton}
              onClick={closeMobileMenu}
              aria-label="Close mobile menu"
            >
              <X className={styles.closeIcon} />
            </button>
            
            <nav className={styles.mobileNav}>
              <ul className={styles.mobileNavList}>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a 
                      href={link.href} 
                      className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.active : ''}`}
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className={styles.mobileAuthLinks}>
              {user ? (
                <div className={styles.mobileUserSection}>
                  <span className={styles.mobileWelcomeText}>
                    {user.username} ({user.role})
                  </span>
                  <button onClick={() => {
                    logout();
                    closeMobileMenu();
                  }} className={styles.mobileLogoutBtn}>
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <a href="/login" className={styles.mobileLoginBtn} onClick={closeMobileMenu}>Login</a>
                  <a href="/register" className={styles.mobileSignupBtn} onClick={closeMobileMenu}>Sign Up</a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}