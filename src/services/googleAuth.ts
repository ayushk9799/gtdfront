import { Platform, NativeModules } from 'react-native';

type GoogleAuthUser = {
  id: string;
  email?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
};

type GoogleAuthResult = {
  idToken?: string;
  accessToken?: string;
  user?: GoogleAuthUser;
} | null;

const { GoogleSignInModule } = NativeModules as { GoogleSignInModule?: any };

async function signIn(): Promise<GoogleAuthResult> {
    if (Platform.OS !== 'ios') return null;
    if (!GoogleSignInModule) {
      throw new Error('GoogleSignInModule not loaded – check iOS target membership and rebuild');
    }
    return GoogleSignInModule.signIn();
}

async function restorePreviousSignIn(): Promise<GoogleAuthResult> {
  if (Platform.OS !== 'ios' || !GoogleSignInModule) return null;
  return GoogleSignInModule.restorePreviousSignIn();
}

async function signOut(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !GoogleSignInModule) return true;
  return GoogleSignInModule.signOut();
}

async function revoke(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !GoogleSignInModule) return true;
  return GoogleSignInModule.revoke();
}

export default { signIn, restorePreviousSignIn, signOut, revoke };


