export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  authProvider: 'google' | 'phone';
  storeId: string | null;
  role: 'owner' | 'staff';
  createdAt: string; // ISO string or Firestore Timestamp representation
  updatedAt: string;
}
