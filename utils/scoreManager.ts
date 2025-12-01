import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';

export interface ScoreRecord {
  userId: string;
  username: string;
  score: number;
  timestamp: number;
  email?: string;
}

/**
 * Save the user's score to Firestore.
 * Only saves if the new score is higher than the existing score (anti-cheat).
 * @param score - The final score to save
 * @returns Promise<boolean> - true if saved, false otherwise
 */
export const saveScoreToFirestore = async (score: number): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No authenticated user. Score not saved.');
      return false;
    }

    const leaderboardRef = collection(db, 'leaderboard');
    const userDocRef = doc(leaderboardRef, user.uid);

    // Check if user already has a score
    const existingDoc = await getDoc(userDocRef);
    const existingScore = existingDoc.exists() ? existingDoc.data().score : 0;

    // Only save if new score is higher
    if (score > existingScore) {
      await setDoc(userDocRef, {
        userId: user.uid,
        username: user.displayName || user.email || 'Anonymous',
        email: user.email,
        score: score,
        timestamp: Date.now(),
      });
      console.log(`Score saved: ${score} (previous: ${existingScore})`);
      return true;
    } else {
      console.log(`Score not saved: ${score} is not higher than ${existingScore}`);
      return false;
    }
  } catch (error) {
    console.error('Error saving score to Firestore:', error);
    return false;
  }
};

/**
 * Fetch the current user's high score from Firestore.
 * @returns Promise<number> - The user's high score, or 0 if not found
 */
export const getUserHighScore = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No authenticated user. Returning 0.');
      return 0;
    }

    const leaderboardRef = collection(db, 'leaderboard');
    const userDocRef = doc(leaderboardRef, user.uid);
    const docSnapshot = await getDoc(userDocRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data().score || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching user high score:', error);
    return 0;
  }
};

/**
 * Fetch the top scores from the leaderboard.
 * @param limit_count - Number of top scores to fetch (default: 10)
 * @returns Promise<ScoreRecord[]> - Array of top scores
 */
export const getTopScores = async (limit_count: number = 10): Promise<ScoreRecord[]> => {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef, orderBy('score', 'desc'), limit(limit_count));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data() as ScoreRecord);
  } catch (error) {
    console.error('Error fetching top scores:', error);
    return [];
  }
};
