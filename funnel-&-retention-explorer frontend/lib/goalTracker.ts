const STORAGE_KEY = 'fre_kpi_goals';

export type GoalStatus = 'on-track' | 'at-risk' | 'behind';

export interface KPIGoal {
  id: string;
  metric: string;
  target: number;
  current: number;
  unit: '%' | 'count' | 'currency';
  status: GoalStatus;
  createdAt: string;
}

export function getGoals(): KPIGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is KPIGoal =>
        item &&
        typeof item.id === 'string' &&
        typeof item.metric === 'string' &&
        typeof item.target === 'number' &&
        typeof item.current === 'number' &&
        typeof item.createdAt === 'string',
    );
  } catch {
    return [];
  }
}

function persist(goals: KPIGoal[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export function evaluateStatus(current: number, target: number): GoalStatus {
  if (target === 0) return 'on-track';
  const ratio = current / target;
  if (ratio >= 0.9) return 'on-track';
  if (ratio >= 0.6) return 'at-risk';
  return 'behind';
}

export function addGoal(goal: Omit<KPIGoal, 'id' | 'createdAt' | 'status'>): KPIGoal {
  const list = getGoals();
  const newGoal: KPIGoal = {
    ...goal,
    id: crypto.randomUUID(),
    status: evaluateStatus(goal.current, goal.target),
    createdAt: new Date().toISOString(),
  };
  list.unshift(newGoal);
  if (list.length > 10) list.pop();
  persist(list);
  return newGoal;
}

export function updateGoalCurrent(id: string, current: number): void {
  const list = getGoals();
  const goal = list.find(g => g.id === id);
  if (!goal) return;
  goal.current = current;
  goal.status = evaluateStatus(current, goal.target);
  persist(list);
}

export function removeGoal(id: string): void {
  const list = getGoals().filter(g => g.id !== id);
  persist(list);
}
