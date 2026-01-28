'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import '../lib/aws'; // ensures Amplify is configured

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      await getCurrentUser();
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <main style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          marginBottom: '16px',
          color: '#333'
        }}>
          Welcome to AWS Cognito Auth
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#666',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          {isAuthenticated 
            ? "You're already signed in! Head to your dashboard."
            : "Secure authentication powered by AWS Cognito and Next.js"
          }
        </p>

        {isAuthenticated ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href="/dashboard"
              style={{
                display: 'block',
                padding: '12px 24px',
                backgroundColor: '#667eea',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#5568d3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#667eea'}
            >
              Go to Dashboard
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href="/login"
              style={{
                display: 'block',
                padding: '12px 24px',
                backgroundColor: '#667eea',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#5568d3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#667eea'}
            >
              Sign In
            </a>
            
            <a
              href="/signup"
              style={{
                display: 'block',
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#667eea';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#667eea';
              }}
            >
              Create Account
            </a>
          </div>
        )}

        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e0e0e0'
        }}>
          <h3 style={{
            fontSize: '16px',
            marginBottom: '12px',
            color: '#333'
          }}>
            Features
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '14px',
            color: '#666',
            textAlign: 'left'
          }}>
            <li style={{ marginBottom: '8px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>✓</span>
              Secure user authentication
            </li>
            <li style={{ marginBottom: '8px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>✓</span>
              Email verification
            </li>
            <li style={{ marginBottom: '8px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>✓</span>
              Password management
            </li>
            <li style={{ marginBottom: '8px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>✓</span>
              AWS Cognito integration
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}