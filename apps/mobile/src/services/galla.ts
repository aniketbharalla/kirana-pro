import {
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { getFirestoreDb, DailyGallaSession } from '@kirana-pro/shared';
import { useGallaStore } from '../store/gallaStore';

export const saveGallaSession = async (
  storeId: string,
  session: DailyGallaSession
): Promise<void> => {
  try {
    const db = getFirestoreDb();
    if (db && typeof db === 'object') {
      const ref = doc(db, 'stores', storeId, 'galla', session.id);
      await setDoc(ref, session);
    }
  } catch (err: any) {
    console.warn('Galla save fallback:', err.message);
  }
};

export const getGallaSessions = async (
  storeId: string
): Promise<DailyGallaSession[]> => {
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') {
      return useGallaStore.getState().history;
    }
    const gallaRef = collection(db, 'stores', storeId, 'galla');
    const snapshot = await getDocs(gallaRef);
    const list: DailyGallaSession[] = [];
    snapshot.forEach((d) => list.push(d.data() as DailyGallaSession));
    return list;
  } catch (err: any) {
    console.warn('Error fetching galla sessions:', err.message);
    return useGallaStore.getState().history;
  }
};
