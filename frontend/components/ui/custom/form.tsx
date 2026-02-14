import React from 'react';
import styled from 'styled-components';

const Form = () => {
  return (
    <StyledWrapper>
      <div className="main-container">
        <div className="card-box">
          <div className="left-panel">
            <div className="noise-texture" />
            <div className="brand-header">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx={12} cy={12} r={9} stroke="white" strokeWidth={2} />
                <circle cx={12} cy={12} r={4} fill="white" />
              </svg>
              <span>DesktopLogin</span>
            </div>
            <div className="hero-text">
              <div className="hero-title">Get Started with Us</div>
              <div className="hero-desc">
                Complete these easy steps to register your account.
              </div>
              <div className="step-list">
                <div className="step-item active-step">
                  <div className="step-num">1</div>
                  <span>Sign up your account</span>
                </div>
                <div className="step-item">
                  <div className="step-num">2</div>
                  <span>Set up your workspace</span>
                </div>
                <div className="step-item">
                  <div className="step-num">3</div>
                  <span>Set up your profile</span>
                </div>
              </div>
            </div>
          </div>
          <div className="right-panel">
            <div className="form-wrapper">
              <div className="form-header-group">
                <div className="form-title">Sign Up Account</div>
                <div className="form-desc">
                  Enter your personal data to create your account.
                </div>
              </div>
              <div className="social-btn-group">
                <button className="social-button">
                  <svg viewBox="0 0 24 24" width={20} xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
                <button className="social-button">
                  <svg viewBox="0 0 24 24" width={20} fill="white">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Github
                </button>
              </div>
              <div className="divider-text">Or</div>
              <div className="row-inputs">
                <div className="input-box">
                  <label className="input-label">First Name</label>
                  <input className="input-field" type="text" placeholder="eg. John" />
                </div>
                <div className="input-box">
                  <label className="input-label">Last Name</label>
                  <input className="input-field" type="text" placeholder="eg. Francisco" />
                </div>
              </div>
              <div className="input-box">
                <label className="input-label">Email</label>
                <input className="input-field" type="email" placeholder="eg. johnfrans@gmail.com" />
              </div>
              <div className="input-box">
                <label className="input-label">Password</label>
                <div className="password-wrapper">
                  <input className="input-field" type="password" placeholder="Enter your password" />
                  <svg className="eye-icon" viewBox="0 0 24 24" width={20} fill="none" stroke="#666" strokeWidth={2}>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                  </svg>
                </div>
              </div>
              <div className="hint-text">Must be at least 8 characters.</div>
              <button className="submit-button">Sign Up</button>
              <div className="footer-text">
                Already have an account? <a href="#">Log in</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  /* SCOPED ROOT - Replaces Body */
  .main-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%; /* No vh allowed */
    background-color: #000;
    padding: 20px;
    font-family: "Inter", sans-serif;
    color: white;
  }

  /* Universal Reset specifically for this component */
  .main-container * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* MAIN CARD */
  .main-container .card-box {
    display: flex;
    flex-wrap: wrap; /* Allows stacking */
    width: 100%;
    max-width: 1000px;
    background: #000;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid #1a1a1a;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  }

  /* LEFT SIDE */
  .main-container .left-panel {
    flex: 1 1 340px; /* Wraps if under 340px */
    position: relative;
    background: radial-gradient(
      circle at 50% 10%,
      #d8b4fe 0%,
      #7e22ce 30%,
      #3b0764 60%,
      #000 100%
    );
    padding: 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 450px;
  }

  .main-container .noise-texture {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
    opacity: 0.6;
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  .main-container .brand-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    font-size: 18px;
  }

  .main-container .hero-text {
    position: relative;
    z-index: 2;
    margin-top: auto;
    margin-bottom: auto;
  }

  /* Fake H1 */
  .main-container .hero-title {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.1;
    margin-bottom: 16px;
  }

  .main-container .hero-desc {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 32px;
    font-size: 15px;
  }

  .main-container .step-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .main-container .step-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    transition: 0.3s;
    font-size: 14px;
  }

  .main-container .active-step {
    background: white;
    color: black;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    border: none;
  }

  .main-container .step-num {
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    font-weight: bold;
  }

  .main-container .active-step .step-num {
    background: black;
    color: white;
  }

  /* RIGHT SIDE */
  .main-container .right-panel {
    flex: 1 1 340px;
    background: black;
    padding: 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .main-container .form-wrapper {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .main-container .form-header-group {
    margin-bottom: 32px;
  }

  /* Fake H2 */
  .main-container .form-title {
    color: white;
    font-size: 26px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .main-container .form-desc {
    color: #888;
    font-size: 14px;
  }

  .main-container .social-btn-group {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }

  .main-container .social-button {
    flex: 1;
    background: transparent;
    border: 1px solid #333;
    color: white;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: 0.2s;
    font-family: "Inter", sans-serif;
    font-size: 14px;
  }

  .main-container .social-button:hover {
    background: #111;
    border-color: #555;
  }

  .main-container .divider-text {
    display: flex;
    align-items: center;
    color: #666;
    font-size: 13px;
    margin-bottom: 24px;
  }

  .main-container .divider-text::before,
  .main-container .divider-text::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #333;
    margin: 0 16px;
  }

  /* INPUTS */
  .main-container .row-inputs {
    display: flex;
    gap: 12px;
  }

  .main-container .input-box {
    margin-bottom: 20px;
    width: 100%;
    min-width: 0; /* Prevents overflow in flexbox */
  }

  .main-container .input-label {
    display: block;
    color: #ccc;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .main-container .input-field {
    width: 100%;
    background: #121212;
    border: 1px solid #1a1a1a;
    padding: 14px;
    border-radius: 8px;
    color: white;
    outline: none;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    transition: 0.2s;
  }

  .main-container .input-field:focus {
    background: #1a1a1a;
    border-color: #444;
  }

  .main-container .password-wrapper {
    position: relative;
  }

  .main-container .eye-icon {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
  }

  .main-container .hint-text {
    color: #666;
    font-size: 12px;
    margin-top: -10px;
    margin-bottom: 24px;
  }

  .main-container .submit-button {
    width: 100%;
    background: white;
    color: black;
    border: none;
    padding: 16px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
    font-family: "Inter", sans-serif;
    font-size: 15px;
  }

  .main-container .submit-button:hover {
    background: #e5e5e5;
  }

  .main-container .footer-text {
    text-align: center;
    margin-top: 24px;
    color: #888;
    font-size: 13px;
  }

  .main-container .footer-text a {
    color: white;
    text-decoration: none;
  }

  /* Mobile Tweak specifically for the preview card size */
  @media (max-width: 500px) {
    .main-container .left-panel,
    .main-container .right-panel {
      padding: 24px;
    }

    .main-container .hero-title {
      font-size: 28px;
    }

    .main-container .row-inputs {
      flex-direction: column;
      gap: 0;
    }
  }`;

export default Form;
