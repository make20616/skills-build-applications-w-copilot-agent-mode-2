import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type Team = { name: string; mascot?: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const state = useApiData<TeamsResponse>('/api/teams');
  const data = state.status === 'success' ? state.data : undefined;
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={state.status === 'loading'}
      error={state.status === 'error' ? state.message : null}
      empty={data?.teams.length === 0}
      emptyMessage="No teams yet."
    >
      {data && (
        <ul>
          {data.teams.map((team) => (
            <li key={team.name}>
              {team.name}{team.mascot ? ` (${team.mascot})` : ''} - {team.members.length} members
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
