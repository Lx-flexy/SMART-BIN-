import { auth, database } from '../firebase/config';
import { ref, set, get, update, onValue, off } from 'firebase/database';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { ROLES, DATABASE_PATHS } from '../utils/constants';

const usersRef = ref(database, DATABASE_PATHS.USERS);

export const authService = {
  async register(email, password, userData) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userProfile = {
      uid: user.uid,
      email: user.email,
      name: userData.name || '',
      phone: userData.phone || '',
      role: userData.role || ROLES.COLLECTION_STAFF,
      zone: userData.zone || '',
      photoURL: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await set(ref(database, `${DATABASE_PATHS.USERS}/${user.uid}`), userProfile);

    return { user, userProfile };
  },

  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await this.getUserProfile(userCredential.user.uid);

    if (userProfile && !userProfile.isActive) {
      await signOut(auth);
      throw new Error('Your account has been deactivated. Please contact administrator.');
    }

    return { user: userCredential.user, userProfile };
  },

  async logout() {
    await signOut(auth);
  },

  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  },

  async getUserProfile(uid) {
    const snapshot = await get(ref(database, `${DATABASE_PATHS.USERS}/${uid}`));
    return snapshot.exists() ? snapshot.val() : null;
  },

  async updateUserProfile(uid, updates) {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await update(ref(database, `${DATABASE_PATHS.USERS}/${uid}`), updatesWithTimestamp);
    return this.getUserProfile(uid);
  },

  async updateUserProfilePhoto(uid, photoURL) {
    await update(ref(database, `${DATABASE_PATHS.USERS}/${uid}`), {
      photoURL,
      updatedAt: new Date().toISOString()
    });
  },

  subscribeToAuthState(callback) {
    return onAuthStateChanged(auth, callback);
  },

  subscribeToUserProfile(uid, callback) {
    const userRef = ref(database, `${DATABASE_PATHS.USERS}/${uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    return () => off(userRef, 'value', unsubscribe);
  },

  async getAllUsers() {
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
  },

  async createUserByAdmin(userData) {
    const { email, password, ...profileData } = userData;
    return this.register(email, password, profileData);
  },

  async updateUserByAdmin(uid, updates) {
    await this.updateUserProfile(uid, updates);
  },

  async deactivateUser(uid) {
    await update(ref(database, `${DATABASE_PATHS.USERS}/${uid}`), {
      isActive: false,
      updatedAt: new Date().toISOString()
    });
  },

  async activateUser(uid) {
    await update(ref(database, `${DATABASE_PATHS.USERS}/${uid}`), {
      isActive: true,
      updatedAt: new Date().toISOString()
    });
  }
};

export default authService;
