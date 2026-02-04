'use client';

/**
 * Client-side Amplify Configuration
 * This file configures Amplify on the client side for Next.js App Router
 */

import { Amplify } from 'aws-amplify';
import { useEffect } from 'react';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_EXhaj2knX',
      userPoolClientId: '53322vb71fe8qeicbl5096fugn',
      region: 'us-east-2',
      loginWith: {
        email: true,
      },
    }
  }
};

export function AmplifyProvider({ children }) {
  useEffect(() => {
    // Configure Amplify on client side
    Amplify.configure(amplifyConfig, { ssr: false });
    console.log('✓ Amplify configured in AmplifyProvider');
  }, []);

  return <>{children}</>;
}

// Also export for direct use
export const configureAmplify = () => {
  Amplify.configure(amplifyConfig, { ssr: false });
};