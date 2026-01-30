
import { LeaderboardEntry } from '../types';

/**
 * Service to manage high scores and leaderboard persistence.
 * Ready for Firestore integration.
 */
export class LeaderboardService {
  private static STORAGE_KEY = 'neon_slither_enterprise_v1';

  /**
   * Sanitizes user input to prevent XSS.
   */
  private static sanitize(input: string): string {
    return input.replace(/[<>]/g, '').trim().substring(0, 15);
  }

  /**
   * Saves a new score to the leaderboard.
   */
  public static async saveScore(name: string, score: number): Promise<void> {
    try {
      const sanitizedName = this.sanitize(name);
      const entries = await this.getScores();
      const newEntry: LeaderboardEntry = {
        name: sanitizedName,
        score,
        timestamp: Date.now(),
      };
      
      entries.push(newEntry);
      entries.sort((a, b) => b.score - a.score);
      
      // Keep only top 10
      const topEntries = entries.slice(0, 10);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(topEntries));
    } catch (error) {
      console.error('LeaderboardService.saveScore failed:', error);
      throw new Error('Failed to synchronize leaderboard.');
    }
  }

  /**
   * Retrieves the top scores.
   */
  public static async getScores(): Promise<LeaderboardEntry[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('LeaderboardService.getScores failed:', error);
      return [];
    }
  }

  /**
   * Validates if a score is plausible to prevent "God Mode" hacks.
   */
  public static validateScore(score: number, durationSeconds: number): boolean {
    // Basic heuristic: Max points per second should not exceed a reasonable threshold
    const MAX_PPS = 10; 
    return score >= 0 && (score / (durationSeconds + 1)) < MAX_PPS;
  }
}
