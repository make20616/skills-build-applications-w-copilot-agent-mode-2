import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type WorkoutSuggestion = { title: string; focus: string; reason: string };
type WorkoutsResponse = { suggestions: WorkoutSuggestion[] };

const demoUserEmail = 'mona@example.com';

export default function Workouts() {
  const path = `/api/workouts/suggestions/${encodeURIComponent(demoUserEmail)}`;
  const state = useApiData<WorkoutsResponse>(path);
  const data = state.status === 'success' ? state.data : undefined;
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={state.status === 'loading'}
      error={state.status === 'error' ? state.message : null}
      empty={data?.suggestions.length === 0}
      emptyMessage="No workout suggestions found."
    >
      {data && (
        <ul>
          {data.suggestions.map((suggestion) => (
            <li key={suggestion.title}>
              {suggestion.title} - {suggestion.focus}: {suggestion.reason}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
