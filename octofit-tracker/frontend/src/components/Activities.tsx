import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type Activity = { type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const state = useApiData<ActivitiesResponse>('/api/activities');
  const data = state.status === 'success' ? state.data : undefined;
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={state.status === 'loading'}
      error={state.status === 'error' ? state.message : null}
      empty={data?.activities.length === 0}
      emptyMessage="No activities yet."
    >
      {data && (
        <ul>
          {data.activities.map((activity, index) => (
            <li key={`${activity.type}-${index}`}>
              {activity.type}: {activity.minutes} minutes, {activity.points} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
