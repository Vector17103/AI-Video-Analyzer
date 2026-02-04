// lib/aws.js
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      region: 'us-east-2',
      userPoolId: 'us-east-2_EXhaj2knX',
      userPoolClientId: '53322vb71fe8qeicbl5096fugn',
      loginWith: {
        email: true,
      },
    }
  }
});

console.log('✓ Amplify configured successfully');

export default Amplify;