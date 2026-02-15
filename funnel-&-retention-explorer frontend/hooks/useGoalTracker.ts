import { useState, useCallback } from 'react';
import { getGoals, addGoal, removeGoal, updateGoalCurrent, type KPIGoal } from '../lib/goalTracker';

export function useGoalTracker() {
  const [goals, setGoals] = useState<KPIGoal[]>(() => getGoals());

  const add = useCallback((goal: Omit<KPIGoal, 'id' | 'createdAt' | 'status'>) => {
    const created = addGoal(goal);
    setGoals(getGoals());
    return created;
  }, []);

  const remove = useCallback((id: string) => {
    removeGoal(id);
    setGoals(getGoals());
  }, []);

  const updateCurrent = useCallback((id: string, current: number) => {
    updateGoalCurrent(id, current);
    setGoals(getGoals());
  }, []);

  return { goals, add, remove, updateCurrent };
}
