import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const state = useApiData<LeaderboardResponse>('/api/leaderboard');
  const data = state.status === 'success' ? state.data : undefined;
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={state.status === 'loading'}
      error={state.status === 'error' ? state.message : null}
      empty={data?.leaderboard.length === 0}
      emptyMessage="No leaderboard rankings yet."
    >
      {data && (
        <ol>
          {data.leaderboard.map((entry) => (
            <li key={entry.teamName}>
              {entry.teamName}: {entry.totalPoints} points (rank {entry.rank})
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
