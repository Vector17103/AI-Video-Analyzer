'use client';

import { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import '../../lib/aws'; // ensures Amplify is configured

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Since your pool uses email alias, you can sign in directly with email
      const { isSignedIn, nextStep } = await signIn({
        username: email,  // Use email directly for sign in
        password,
      });

      console.log('Sign in result:', { isSignedIn, nextStep });

      if (isSignedIn) {
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        setMessage('Please confirm your email first.');
        setTimeout(() => {
          window.location.href = `/confirm?email=${encodeURIComponent(email)}`;
        }, 2000);
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setMessage('You need to set a new password.');
      }

    } catch (err) {
      console.error('Login error:', err);
      
      if (err.name === 'UserNotConfirmedException') {
        setMessage('Please confirm your email first. Redirecting to confirmation page...');
        setTimeout(() => {
          window.location.href = `/confirm?email=${encodeURIComponent(email)}`;
        }, 2000);
      } else if (err.name === 'NotAuthorizedException') {
        setMessage('Incorrect email or password.');
      } else if (err.name === 'UserNotFoundException') {
        setMessage('No account found with this email.');
      } else {
        setMessage(err.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '40px auto', padding: '20px' }}>
      <h1>Sign In</h1>
      <form onSubmit={handleLogin}>
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
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ 
            display: 'block', 
            width: '100%', 
            marginBottom: 12,
            padding: '8px',
            fontSize: '14px'
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
            width: '100%'
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {message && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: message.includes('successful') ? '#d4edda' : '#f8d7da',
          color: message.includes('successful') ? '#155724' : '#721c24',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        Don't have an account?{' '}
        <a href="/signup" style={{ color: '#0070f3', textDecoration: 'none' }}>
          Create one
        </a>
      </p>

      <p style={{ marginTop: '10px', textAlign: 'center', fontSize: '14px' }}>
        <a href="/forgot-password" style={{ color: '#0070f3', textDecoration: 'none' }}>
          Forgot password?
        </a>
      </p>
    </main>
  );
}