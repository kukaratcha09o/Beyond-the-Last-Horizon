import { useGame } from '../game/store';

export function StartScreen() {
  const phase = useGame((s) => s.phase);
  const startGame = useGame((s) => s.startGame);
  if (phase !== 'start') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <div className="max-w-2xl px-8 text-center">
        <h1 className="mb-2 text-5xl font-black tracking-tight text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">
          THE LAST SURVIVOR
        </h1>
        <p className="mb-1 text-lg text-gray-400">A Post-Apocalyptic RPG Platformer</p>
        <p className="mb-8 text-sm text-gray-600">Four biomes. Endless danger. One way out.</p>

        <div className="mx-auto mb-8 max-w-md rounded-xl border border-gray-800 bg-gray-900/50 p-5 text-left text-sm text-gray-400">
          <div className="mb-3 font-bold text-gray-300 uppercase tracking-wider text-xs">Survive</div>
          <div className="space-y-1">
            <p>🍖 Hunt chickens and gather berries to stave off hunger</p>
            <p>😴 Press R to sleep and restore stamina</p>
            <p>⚔ Fight enemies near your level — or outlevel them first</p>
            <p>🌟 Earn XP, level up, and spend skill points</p>
            <p>🚪 Reach the glowing portal to advance to the next biome</p>
          </div>
        </div>

        <button
          onClick={startGame}
          className="rounded-xl bg-emerald-600 px-12 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 hover:shadow-emerald-500/40"
        >
          ENTER THE WASTELAND
        </button>
        <p className="mt-4 text-xs text-gray-600">Click the screen to lock your mouse. Press K for skills.</p>
      </div>
    </div>
  );
}

export function DeathScreen() {
  const phase = useGame((s) => s.phase);
  const deathCause = useGame((s) => s.deathCause);
  const respawn = useGame((s) => s.respawn);
  if (phase !== 'dead') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-black text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">
          YOU DIED
        </h1>
        <p className="mb-8 text-lg text-gray-400">{deathCause}</p>
        <button
          onClick={respawn}
          className="rounded-xl bg-red-700 px-10 py-3 text-lg font-bold text-white transition hover:bg-red-600"
        >
          RESPAWN
        </button>
        <p className="mt-4 text-xs text-gray-600">You will restart at the beginning of this biome.</p>
      </div>
    </div>
  );
}

export function VictoryScreen() {
  const phase = useGame((s) => s.phase);
  const startGame = useGame((s) => s.startGame);
  if (phase !== 'victory') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-cyan-950 via-gray-900 to-black">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-black text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
          YOU SURVIVED
        </h1>
        <p className="mb-8 text-lg text-gray-400">You conquered all four biomes of the wasteland.</p>
        <button
          onClick={startGame}
          className="rounded-xl bg-cyan-600 px-10 py-3 text-lg font-bold text-white transition hover:bg-cyan-500"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
