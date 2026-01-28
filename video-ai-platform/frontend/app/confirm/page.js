'use client';

import { useState, useEffect } from 'react';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import '../../lib/aws'; // ensures Amplify is configured

export default function ConfirmPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get email and username from URL params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const usernameParam = params.get('username');
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    if (usernameParam) {
      setUsername(decodeURIComponent(usernameParam));
    }
  }, []);

  async function handleConfirm(e) {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Use username if available, otherwise use email
    const confirmUsername = username || email;

    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: confirmUsername,  // Use the username that was created during signup
        confirmationCode: code,
      });

      console.log('Confirmation result:', { isSignUpComplete, nextStep });

      if (isSignUpComplete) {
        setMessage('Email confirmed successfully! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage(`Confirmation step: ${nextStep.signUpStep}`);
      }

    } catch (err) {
      console.error('Confirmation error:', err);
      
      if (err.name === 'CodeMismatchException') {
        setMessage('Invalid confirmation code. Please try again.');
      } else if (err.name === 'ExpiredCodeException') {
        setMessage('Confirmation code has expired. Please request a new one.');
      } else if (err.name === 'AliasExistsException') {
        setMessage('This email is already confirmed. Please sign in.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage(err.message || 'Confirmation failed');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    // Use username if available, otherwise use email
    const resendUsername = username || email;

    try {
      const output = await resendSignUpCode({
        username: resendUsername,  // Use the username that was created during signup
      });

      console.log('Resend code result:', output);
      setMessage('New confirmation code sent! Check your email.');

    } catch (err) {
      console.error('Resend code error:', err);
      
      if (err.name === 'LimitExceededException') {
        setMessage('Too many requests. Please wait before requesting a new code.');
      } else {
        setMessage(err.message || 'Failed to resend code');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '40px auto', padding: '20px' }}>
      <h1>Confirm Email</h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        Enter the confirmation code sent to your email address.
      </p>

      <form onSubmit={handleConfirm}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ 
            display: 'block', 
            width: '100%', 
            marginBottom: 12,
            padding: '8px',
            fontSize: '14px'
          }}
        />
        
        {/* Show username field if we have it from signup */}
        {username && (
          <input
            placeholder="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ 
              display: 'block', 
              width: '100%', 
              marginBottom: 12,
              padding: '8px',
              fontSize: '14px',
              backgroundColor: '#f5f5f5'
            }}
            readOnly
          />
        )}
        
        <input
          placeholder="Confirmation Code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          maxLength={6}
          style={{ 
            display: 'block', 
            width: '100%', 
            marginBottom: 12,
            padding: '8px',
            fontSize: '14px',
            letterSpacing: '2px'
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            width: '100%',
            marginBottom: '12px'
          }}
        >
          {isLoading ? 'Confirming...' : 'Confirm Email'}
        </button>
      </form>

      <button 
        onClick={handleResendCode}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: 'transparent',
          color: '#0070f3',
          border: '1px solid #0070f3',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        Resend Code
      </button>

      {message && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: message.includes('successful') || message.includes('sent') ? '#d4edda' : '#f8d7da',
          color: message.includes('successful') || message.includes('sent') ? '#155724' : '#721c24',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        <a href="/login" style={{ color: '#0070f3', textDecoration: 'none' }}>
          Back to sign in
        </a>
      </p>
    </main>
  );
}