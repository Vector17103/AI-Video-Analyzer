'use client';

/**
 * Amplify Configuration Test Page
 * This will help us diagnose exactly what's wrong
 */

import { useEffect, useState } from 'react';

export default function TestAmplify() {
  const [results, setResults] = useState({
    amplifyLoaded: false,
    configFound: false,
    configDetails: null,
    error: null,
  });

  useEffect(() => {
    runTests();
  }, []);

  async function runTests() {
    const testResults = {
      amplifyLoaded: false,
      configFound: false,
      configDetails: null,
      error: null,
    };

    try {
      // Test 1: Check if Amplify is loaded
      const { Amplify } = await import('aws-amplify');
      testResults.amplifyLoaded = true;
      console.log('✓ Amplify imported');

      // Test 2: Get current config
      const config = Amplify.getConfig();
      console.log('Current Amplify config:', config);
      
      if (config && config.Auth) {
        testResults.configFound = true;
        testResults.configDetails = {
          hasAuth: !!config.Auth,
          hasCognito: !!config.Auth?.Cognito,
          userPoolId: config.Auth?.Cognito?.userPoolId || 'Not found',
          userPoolClientId: config.Auth?.Cognito?.userPoolClientId || 'Not found',
          region: config.Auth?.Cognito?.region || 'Not found',
          loginWith: config.Auth?.Cognito?.loginWith || 'Not found',
        };
      }

      // Test 3: Try to use getCurrentUser
      try {
        const { getCurrentUser } = await import('aws-amplify/auth');
        await getCurrentUser();
        testResults.configDetails.userStatus = 'Logged in';
      } catch (err) {
        testResults.configDetails.userStatus = err.message;
      }

    } catch (error) {
      testResults.error = error.message;
      console.error('Test error:', error);
    }

    setResults(testResults);
  }

  return (
    <div style={{ 
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ marginBottom: '30px' }}>Amplify Configuration Test</h1>

      {/* Test 1: Amplify Loaded */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: results.amplifyLoaded ? '#d4edda' : '#f8d7da',
        border: '1px solid',
        borderColor: results.amplifyLoaded ? '#c3e6cb' : '#f5c6cb',
        borderRadius: '5px'
      }}>
        <h2>Test 1: Amplify Import</h2>
        <p>Status: {results.amplifyLoaded ? '✓ SUCCESS' : '✗ FAILED'}</p>
      </div>

      {/* Test 2: Configuration */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: results.configFound ? '#d4edda' : '#f8d7da',
        border: '1px solid',
        borderColor: results.configFound ? '#c3e6cb' : '#f5c6cb',
        borderRadius: '5px'
      }}>
        <h2>Test 2: Configuration Found</h2>
        <p>Status: {results.configFound ? '✓ SUCCESS' : '✗ FAILED'}</p>
        
        {results.configDetails && (
          <div style={{ marginTop: '15px' }}>
            <h3>Configuration Details:</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>Has Auth: {results.configDetails.hasAuth ? '✓' : '✗'}</li>
              <li>Has Cognito: {results.configDetails.hasCognito ? '✓' : '✗'}</li>
              <li>User Pool ID: {results.configDetails.userPoolId}</li>
              <li>Client ID: {results.configDetails.userPoolClientId}</li>
              <li>Region: {results.configDetails.region}</li>
              <li>Login With: {JSON.stringify(results.configDetails.loginWith)}</li>
              <li>User Status: {results.configDetails.userStatus}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Error Display */}
      {results.error && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h2>Error</h2>
          <p>{results.error}</p>
        </div>
      )}

      {/* Raw Data */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '5px'
      }}>
        <h2>Raw Test Results</h2>
        <pre style={{ 
          overflow: 'auto',
          fontSize: '12px',
          whiteSpace: 'pre-wrap'
        }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#d1ecf1',
        border: '1px solid #bee5eb',
        borderRadius: '5px'
      }}>
        <h2>What to do:</h2>
        <ol>
          <li>Check the results above</li>
          <li>Open browser console (F12)</li>
          <li>Look for console logs showing the config</li>
          <li>Take a screenshot and share the results</li>
        </ol>
      </div>
    </div>
  );
}