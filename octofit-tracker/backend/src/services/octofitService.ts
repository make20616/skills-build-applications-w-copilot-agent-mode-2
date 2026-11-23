import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw httpError(400, 'A valid userId and teamId are required');
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw httpError(400, 'Activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw httpError(400, 'Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) throw httpError(404, 'The requested user or team was not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team details are required');
  const { name, mascot } = input;
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError(400, 'Team mascot is required');

  const requestedMembers = input.members ?? [];
  if (!Array.isArray(requestedMembers) || !requestedMembers.every(isObjectId)) {
    throw httpError(400, 'Team members must be valid user IDs');
  }
  const memberIds = [...new Set(requestedMembers)];
  if (memberIds.length > 0) {
    const members = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
    if (members.length !== memberIds.length) throw httpError(400, 'One or more team members do not exist');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId | null; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map<string, number>();
  for (const { _id, totalPoints } of totals) {
    if (_id) totalsByTeam.set(_id.toString(), totalPoints);
  }

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).select('_id fitnessGoal').lean();
  if (!user) throw httpError(404, 'User not found');

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.toLowerCase();
  const recentType = recentActivity?.type.toLowerCase();
  const preferredFocus = [goal, recentType].find((focus) =>
    focus && workouts.some((workout) => workout.focus.toLowerCase() === focus),
  );
  const sortedWorkouts = [...workouts].sort((left, right) => {
    const leftMatches = left.focus.toLowerCase() === preferredFocus;
    const rightMatches = right.focus.toLowerCase() === preferredFocus;
    return Number(rightMatches) - Number(leftMatches);
  });

  return sortedWorkouts.map((workout) => {
    const focus = workout.focus.toLowerCase();
    let reason: string;
    if (focus === goal) reason = `Recommended for your ${user.fitnessGoal} goal.`;
    else if (recentActivity && recentType && focus === recentType) reason = `Recommended based on your recent ${recentActivity.type} activity.`;
    else reason = `A balanced option to complement your ${user.fitnessGoal} goal.`;
    return { ...workout, reason };
  });
}

export { User };
