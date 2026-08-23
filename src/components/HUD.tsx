import { useGame } from '../game/store';
import { gameRefs } from '../game/refs';

function StatBar({ value, max, color, label, icon }: { value: number; max: number; color: string; label: string; icon: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm opacity-80">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-[10px] uppercase tracking-wider opacity-60">
          <span>{label}</span>
          <span>{Math.ceil(value)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

export function HUD() {
  const hud = useGame((s) => s.hud);
  const skillMenuOpen = useGame((s) => s.skillMenuOpen);
  const phase = useGame((s) => s.phase);

  if (phase !== 'playing') return null;

  const xpPct = (hud.xp / hud.xpMax) * 100;
  const exhausted = hud.exhaustion <= 0;
  const blurClass = exhausted ? 'backdrop-blur-sm' : '';
  const nightOverlay = hud.isNight && hud.skills.vision === 0;

  return (
    <>
      {/* Night darkness overlay */}
      {hud.isNight && (
        <div
          className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-1000"
          style={{
            backgroundColor: 'rgba(0,0,10,0.75)',
            boxShadow: hud.skills.vision > 0
              ? `radial-gradient(circle at 50% 50%, transparent ${10 + hud.skills.vision * 5}%, rgba(0,0,10,0.85) ${30 + hud.skills.vision * 8}%)`
              : 'none',
          }}
        />
      )}

      {/* Exhaustion blur */}
      {exhausted && (
        <div className="pointer-events-none fixed inset-0 z-10 backdrop-blur-md bg-black/10" />
      )}

      {/* Hit flash */}
      <HitFlash />

      {/* Sleep fade */}
      <SleepFade />

      {/* HUD top-left: stats */}
      <div className={`fixed left-4 top-4 z-20 w-64 space-y-2 rounded-xl bg-black/60 p-4 backdrop-blur-sm ${blurClass}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-emerald-400">{hud.biome}</span>
          <span className="text-xs opacity-50">
            {hud.isNight ? 'Night' : 'Day'}
          </span>
        </div>
        <StatBar value={hud.health} max={100} color="#ef4444" label="Health" icon="❤" />
        <StatBar value={hud.hunger} max={100} color="#f59e0b" label="Hunger" icon="🍗" />
        <StatBar value={hud.exhaustion} max={100} color="#3b82f6" label="Stamina" icon="⚡" />
      </div>

      {/* HUD top-right: level + XP */}
      <div className={`fixed right-4 top-4 z-20 w-56 rounded-xl bg-black/60 p-4 backdrop-blur-sm ${blurClass}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-cyan-400">Level {hud.pLevel}</span>
          <span className="text-xs text-amber-400">
            {hud.skillPoints > 0 ? `${hud.skillPoints} SP` : ''}
          </span>
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-[10px] uppercase tracking-wider opacity-60">
            <span>XP</span>
            <span>{Math.floor(hud.xp)}/{hud.xpMax}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>
        {hud.skillPoints > 0 && (
          <div className="mt-2 animate-pulse text-center text-[10px] text-amber-400">
            Press K to spend points
          </div>
        )}
      </div>

      {/* Hearing proximity indicator */}
      {hud.skills.hearing > 0 && hud.nearby && (
        <div className="fixed left-1/2 top-20 z-20 -translate-x-1/2 animate-pulse rounded-lg bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300 backdrop-blur-sm">
          {hud.nearby} detected nearby
        </div>
      )}

      {/* Earthquake warning */}
      {hud.earthquake && (
        <div className="fixed left-1/2 top-1/3 z-20 -translate-x-1/2 animate-bounce rounded-lg bg-red-600/80 px-6 py-3 text-lg font-bold text-white">
          EARTHQUAKE! Platforms are collapsing!
        </div>
      )}

      {/* Controls guide bottom-left */}
      <div className={`fixed bottom-4 left-4 z-20 rounded-xl bg-black/50 p-3 text-[11px] leading-relaxed backdrop-blur-sm ${blurClass}`}>
        <div className="mb-1 font-bold text-gray-300 uppercase tracking-wider">Controls</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-400">
          <span><b className="text-white">WASD</b> Move</span>
          <span><b className="text-white">Mouse</b> Look</span>
          <span><b className="text-white">Space</b> Jump</span>
          <span><b className="text-white">Click/E</b> Attack</span>
          <span><b className="text-white">F</b> Gather</span>
          <span><b className="text-white">R</b> Sleep</span>
          <span><b className="text-white">K/Tab</b> Skills</span>
        </div>
      </div>

      {/* Skill menu */}
      {skillMenuOpen && <SkillMenu />}
    </>
  );
}

function HitFlash() {
  const phase = useGame((s) => s.phase);
  if (phase !== 'playing') return null;
  const now = performance.now() / 1000;
  const since = now - gameRefs.hitFlash;
  if (since > 0.4) return null;
  const opacity = Math.max(0, 0.5 - since / 0.4 * 0.5);
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30"
      style={{ backgroundColor: `rgba(220,38,38,${opacity})` }}
    />
  );
}

function SleepFade() {
  const phase = useGame((s) => s.phase);
  if (phase !== 'playing') return null;
  if (gameRefs.sleepFade <= 0) return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 bg-black"
      style={{ opacity: gameRefs.sleepFade }}
    />
  );
}

function SkillMenu() {
  const hud = useGame((s) => s.hud);
  const upgradeSkill = useGame((s) => s.upgradeSkill);
  const setSkillMenu = useGame((s) => s.setSkillMenu);

  const skills = [
    { key: 'vision' as const, name: 'Better Vision', desc: 'Glow around you at night', icon: '👁' },
    { key: 'hearing' as const, name: 'Better Hearing', desc: 'Detect nearby enemies & resources', icon: '👂' },
    { key: 'speed' as const, name: 'Faster Move Speed', desc: '+1.1 speed per level', icon: '🏃' },
    { key: 'jump' as const, name: 'Higher Jump', desc: '+1.25 jump height per level', icon: '🦘' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-gray-900/95 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyan-400">Skill & Attributes</h2>
          <div className="text-sm text-amber-400">
            Skill Points: <span className="text-lg font-bold">{hud.skillPoints}</span>
          </div>
        </div>
        <div className="space-y-3">
          {skills.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/60 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className="font-semibold text-white">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                  <div className="mt-1 text-xs text-cyan-400">
                    Level {hud.skills[s.key]}
                  </div>
                </div>
              </div>
              <button
                disabled={hud.skillPoints <= 0}
                onClick={() => upgradeSkill(s.key)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
              >
                Upgrade
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setSkillMenu(false)}
          className="mt-5 w-full rounded-lg bg-gray-700 py-2 text-sm font-semibold text-white transition hover:bg-gray-600"
        >
          Close (K/Tab)
        </button>
      </div>
    </div>
  );
}
