import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute,
  ISignUpResult,
} from 'amazon-cognito-identity-js';
import { AuthProvider } from './authProvider';
import { User, UserRole } from '../../types';
import { config } from '../../config/environment';

const userPool = new CognitoUserPool({
  UserPoolId: config.COGNITO_USER_POOL_ID,
  ClientId: config.COGNITO_APP_CLIENT_ID,
});

function sessionToUser(session: CognitoUserSession, email: string): User {
  const idToken = session.getIdToken();
  const payload = idToken.decodePayload();
  // Terraform sets custom:role on the user attribute; fall back to cognito:groups
  const customRole = payload['custom:role'] as string | undefined;
  const groups: string[] = payload['cognito:groups'] || [];
  const role: UserRole =
    customRole === 'ADMIN' || groups.includes('ADMIN') ? 'ADMIN' : 'STUDENT';

  return {
    id: payload.sub,
    name: payload.name || email.split('@')[0],
    email: payload.email || email,
    role,
    title: role === 'ADMIN' ? 'Administrator' : 'Student',
    avatar: '',
    department: payload['custom:department'] || undefined,
    // Use ID token - contains custom:role claim needed by backend
    token: idToken.getJwtToken(),
  };
}

const STORAGE_KEY = 'hypervisor_current_user';

export class CognitoAuthProvider implements AuthProvider {
  async login(email: string, password?: string): Promise<User> {
    return new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password || '',
      });

      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          const user = sessionToUser(session, email);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          resolve(user);
        },
        onFailure: (err) => {
          reject(new Error(err.message || 'Authentication failed'));
        },
      });
    });
  }

  async logout(): Promise<void> {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) cognitoUser.signOut();
    localStorage.removeItem(STORAGE_KEY);
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) { resolve(null); return; }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) { resolve(null); return; }
        const email = cognitoUser.getUsername();
        const user = sessionToUser(session, email);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        resolve(user);
      });
    });
  }

  async register(
    _name: string,
    email: string,
    password: string,
    _role: UserRole = 'STUDENT',
  ): Promise<{ needsConfirmation: boolean }> {
    return new Promise((resolve, reject) => {
      // This Cognito app client currently allows only `email` in write_attributes.
      // Sending `name` or `custom:role` causes: "A client attempted to write unauthorized attribute".
      const attributes = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
      ];

      userPool.signUp(email, password, attributes, [], (err, _result: ISignUpResult | undefined) => {
        if (err) { reject(new Error(err.message || 'Registration failed')); return; }
        resolve({ needsConfirmation: true });
      });
    });
  }

  async confirmRegistration(email: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) { reject(new Error(err.message || 'Confirmation failed')); return; }
        resolve();
      });
    });
  }

  async forgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (err) => reject(new Error(err.message || 'Password reset request failed')),
      });
    });
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(new Error(err.message || 'Password reset failed')),
      });
    });
  }

  async switchRole(_role: UserRole): Promise<User> {
    // Roles in production are determined by Cognito group membership in the JWT.
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    return user;
  }
}

