import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export type PlayerScorer = {
  id: number;
  name: string;
  goals: number;
  matches: number;
  goalsPerMatch: number;
};

export type PlayerAssist = {
  id: number;
  name: string;
  assists: number;
  matches: number;
  assistsPerMatch: number;
};

export type TeamStats = {
  scorers: PlayerScorer[];
  assists: PlayerAssist[];
  lastUpdated: Date;
};

const STATS_DOC_ID = 'sunderland-stats';

// Get team stats from Firestore
export const getTeamStats = async (): Promise<TeamStats | null> => {
  try {
    const statsRef = doc(db, 'teamStats', STATS_DOC_ID);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      return {
        scorers: data.scorers || [],
        assists: data.assists || [],
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return null;
  }
};

// Update team stats (admin only)
export const updateTeamStats = async (
  scorers: PlayerScorer[],
  assists: PlayerAssist[]
): Promise<void> => {
  try {
    const statsRef = doc(db, 'teamStats', STATS_DOC_ID);
    await setDoc(statsRef, {
      scorers,
      assists,
      lastUpdated: new Date(),
    });
    console.log('✅ Team stats updated successfully');
  } catch (error) {
    console.error('❌ Error updating team stats:', error);
    throw error;
  }
};
