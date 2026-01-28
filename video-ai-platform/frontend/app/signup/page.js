'use client';

import { useState } from 'react';
import { signUp } from 'aws-amplify/auth';
import '../../lib/aws'; // ensures Amplify is configured

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // FIXED: Generate a unique username since pool uses email alias
      // Use email prefix + timestamp to create unique username
      const username = email.split('@')[0] + Date.now();
      
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: username,  // Use generated username, NOT email
        password,
        options: {
          userAttributes: {
            email,  // Email goes in userAttributes
          },
          autoSignIn: true,
        },
      });

      setMessage('Signup successful! Check your email for the confirmation code.');
      console.log('Sign up result:', { isSignUpComplete, userId, nextStep });
      
      // Navigate to confirm page after 2 seconds
      setTimeout(() => {
        window.location.href = `/confirm?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`;
      }, 2000);

    } catch (err) {
      console.error('Signup error:', err);
      setMessage(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '40px auto', padding: '20px' }}>
      <h1>Create Account</h1>
      <form onSubmit={handleSignup}>
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
          placeholder="Password (min 8 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
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
          {isLoading ? 'Creating account...' : 'Create account'}
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
        Already have an account?{' '}
        <a href="/login" style={{ color: '#0070f3', textDecoration: 'none' }}>
          Sign in
        </a>
      </p>
    </main>
  );
}