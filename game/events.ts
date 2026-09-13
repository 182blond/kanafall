type GameEvent = 'answer_correct' | 'answer_wrong' | 'level_up' | 'game_start' | 'game_over'
export function trackGameEvent(event: GameEvent, payload: Record<string, string | number>) {
  if (import.meta.dev) console.debug(`[Kanafall] ${event}`, payload)
}
