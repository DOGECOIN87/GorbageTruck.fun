import React, { useState, useEffect } from 'react';
import { auth } from '../utils/firebase';
import { getTopScores, ScoreRecord } from '../utils/scoreManager';
import { Trophy } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const topScores = await getTopScores(10);
        setScores(topScores);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-gray-900 rounded-xl border border-gray-700">
        <div className="text-center text-gray-400">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-gray-900 rounded-xl border border-red-500/30">
        <div className="text-center text-red-400 font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-lime-500/30 shadow-2xl">
      {/* Title */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h2 className="text-3xl font-black text-white uppercase tracking-wider">Leaderboard</h2>
        <Trophy className="w-6 h-6 text-yellow-400" />
      </div>

      {/* Scores List */}
      {scores.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p className="font-semibold">No scores yet. Be the first to play!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((score, index) => {
            const isCurrentUser = auth.currentUser?.uid === score.userId;
            const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

            return (
              <div
                key={score.userId}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  isCurrentUser
                    ? 'bg-lime-500/20 border-lime-500/60 shadow-[0_0_20px_rgba(132,204,22,0.4)]'
                    : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 hover:border-gray-600/70'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-2xl font-black w-8 text-center">{medalEmoji}</span>
                  <div>
                    <p className={`font-bold ${isCurrentUser ? 'text-lime-400' : 'text-gray-200'}`}>
                      {score.username}
                      {isCurrentUser && <span className="text-xs ml-2 bg-lime-500/30 px-2 py-1 rounded-full text-lime-300">YOU</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(score.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${isCurrentUser ? 'text-lime-400' : 'text-white'}`}>
                    {score.score.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
