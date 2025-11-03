import React from 'react';
import { useNavigate } from 'react-router-dom';

const RegistrationSuccess = () => {
 const navigate = useNavigate();

 return (
 <div className="registration-success">
 <div className="success-container">
 <div className="success-animation">
 <div className="checkmark-circle">
 <div className="checkmark"></div>
 </div>
 </div>

 <div className="success-content">
 <h1>Registration Submitted Successfully!</h1>
 <p className="success-subtitle">
 Thank you for joining our food delivery platform. Your application is now under review.
 </p>

 <div className="next-steps-card">
 <h2>What happens next?</h2>
 <div className="steps-list">
 <div className="step-item">
 <div className="step-icon"></div>
 <div className="step-details">
 <h3>Email Verification</h3>
 <p>Check your email inbox for a verification link. Click it to verify your email address.</p>
 </div>
 </div>

 <div className="step-item">
 <div className="step-icon"></div>
 <div className="step-details">
 <h3>Document Review</h3>
 <p>Our team will review your business documents and information within 24-48 hours.</p>
 </div>
 </div>

 <div className="step-item">
 <div className="step-icon"></div>
 <div className="step-details">
 <h3>Account Activation</h3>
 <p>Once approved, you'll receive an email confirmation and can start setting up your menu.</p>
 </div>
 </div>

 <div className="step-item">
 <div className="step-icon"></div>
 <div className="step-details">
 <h3>Start Selling</h3>
 <p>Begin receiving orders from customers in your delivery area!</p>
 </div>
 </div>
 </div>
 </div>

 <div className="important-info">
 <h3>Important Information</h3>
 <div className="info-grid">
 <div className="info-item">
 <h4>Contact Information</h4>
 <p>Email: <a href="mailto:restaurants@fooddelivery.com">restaurants@fooddelivery.com</a></p>
 <p>Phone: <a href="tel:+1-555-123-4567">+1 (555) 123-4567</a></p>
 <p>Hours: Monday - Friday, 9 AM - 6 PM</p>
 </div>

 <div className="info-item">
 <h4>Getting Started Resources</h4>
 <ul>
 <li><a href="/restaurant-guide" target="_blank">Restaurant Setup Guide</a></li>
 <li><a href="/menu-tips" target="_blank">Menu Optimization Tips</a></li>
 <li><a href="/faq" target="_blank">Frequently Asked Questions</a></li>
 <li><a href="/support" target="_blank">Support Center</a></li>
 </ul>
 </div>
 </div>
 </div>

 <div className="timeline-estimate">
 <h3>Typical Timeline</h3>
 <div className="timeline">
 <div className="timeline-item">
 <div className="time">Within 1 hour</div>
 <div className="description">Email verification link sent</div>
 </div>
 <div className="timeline-item">
 <div className="time">24-48 hours</div>
 <div className="description">Document review completed</div>
 </div>
 <div className="timeline-item">
 <div className="time">48-72 hours</div>
 <div className="description">Account activation notification</div>
 </div>
 </div>
 </div>

 <div className="action-buttons">
 <button
 className="btn btn-primary"
 onClick={() => navigate('/restaurant/login')}
 >
 Go to Login Page
 </button>
 <button
 className="btn btn-secondary"
 onClick={() => navigate('/')}
 >
 Back to Homepage
 </button>
 </div>

 <div className="additional-help">
 <h3>Need Help?</h3>
 <p>
 If you have any questions about your registration or need assistance,
 please don't hesitate to contact our restaurant support team.
 </p>
 <div className="help-buttons">
 <a href="mailto:restaurants@fooddelivery.com" className="help-btn">
 Email Support
 </a>
 <a href="/restaurant-faq" target="_blank" className="help-btn">
 View FAQ
 </a>
 <a href="/live-chat" target="_blank" className="help-btn">
 Live Chat
 </a>
 </div>
 </div>
 </div>

 <div className="registration-footer">
 <p>
 <strong>Registration ID:</strong> {0.toString(36).substr(2, 9).toUpperCase()}
 </p>
 <p className="footer-note">
 Please save this registration ID for your records. You may need it when contacting support.
 </p>
 </div>
 </div>
 </div>
 );
};

export default RegistrationSuccess;
