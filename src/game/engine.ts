import * as THREE from 'three';
import { gameRefs } from './refs';
import { useGame } from './store';
import { generateLevel, biomeName } from './levelGen';
import {
  PLAYER, ENEMY, CHICKEN, KEYS, DAY_LENGTH, NIGHT_LENGTH, CYCLE_LENGTH,
  HUNGER_DECAY, EXHAUSTION_DECAY, STARVE_DAMAGE, xpForLevel,
} from './constants';
import type { LevelData, PlatformData } from './types';

// ---------- Runtime entity state (mutable, not React state) ----------
export interface EnemyRT {
  id: number;
  kind: string;
  level: number;
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  alive: boolean;
  attackCd: number;
  hitFlash: number;
  platformIndex: number;
  homePos: THREE.Vector3;
}

export interface ChickenRT {
  id: number;
  mesh: THREE.Group;
  alive: boolean;
  platformIndex: number;
  dir: THREE.Vector3;
  changeDirIn: number;
}

export interface BushRT {
  id: number;
  mesh: THREE.Group;
  berries: number;
  cooldown: number;
}

export interface PlatformRT {
  data: PlatformData;
  mesh: THREE.Mesh;
  baseY: number;
  shakeTime: number; // > 0 means shaking
  goneTime: number; // > 0 means disappeared
  earthquake: boolean;
}

export interface PortalRT {
  mesh: THREE.Group;
  position: THREE.Vector3;
}

export interface GameWorld {
  level: number;
  data: LevelData;
  platforms: PlatformRT[];
  enemies: EnemyRT[];
  chickens: ChickenRT[];
  bushes: BushRT[];
  npcs: THREE.Group[];
  portal: PortalRT;
  group: THREE.Group;
  spawnPoint: THREE.Vector3;
  groundY: number;
  nextEarthquakeCheck: number;
}

// ---------- Collision helpers ----------
function collidePlatforms(
  pos: THREE.Vector3, vel: THREE.Vector3, radius: number, height: number,
  platforms: PlatformRT[], dt: number,
): { onGround: boolean } {
  let onGround = false;

  // Vertical resolution first
  const feetY = pos.y;
  for (const p of platforms) {
    if (p.goneTime > 0) continue;
    const d = p.data;
    if (d.isVegetation) continue;
    const dx = Math.abs(pos.x - d.position[0]);
    const dz = Math.abs(pos.z - d.position[2]);
    const hw = d.size[0] / 2 + radius;
    const hd = d.size[2] / 2 + radius;
    if (dx > hw || dz > hd) continue;

    const topY = d.position[1] + d.size[1] / 2;
    const bottomY = d.position[1] - d.size[1] / 2;

    // Landing on top
    if (vel.y <= 0 && feetY <= topY + 0.15 && feetY >= topY - 0.3) {
      pos.y = topY;
      vel.y = 0;
      onGround = true;
      continue;
    }
    // Hitting bottom (head bonk)
    if (vel.y > 0 && feetY + height > bottomY && feetY + height < bottomY + 0.5) {
      vel.y = 0;
      pos.y = bottomY - height;
      continue;
    }
  }

  // Horizontal resolution (simple AABB push-out)
  for (const p of platforms) {
    if (p.goneTime > 0) continue;
    const d = p.data;
    if (d.isVegetation) continue;
    if (d.size[1] < 1.5) continue; // thin platforms don't block horizontally
    const dx = pos.x - d.position[0];
    const dz = pos.z - d.position[2];
    const hw = d.size[0] / 2 + radius;
    const hd = d.size[2] / 2 + radius;
    if (Math.abs(dx) >= hw || Math.abs(dz) >= hd) continue;
    if (pos.y < d.position[1] - d.size[1] / 2 - 0.2 || pos.y > d.position[1] + d.size[1] / 2 + height) continue;

    const overlapX = hw - Math.abs(dx);
    const overlapZ = hd - Math.abs(dz);
    if (overlapX < overlapZ) {
      pos.x = d.position[0] + Math.sign(dx) * hw;
    } else {
      pos.z = d.position[2] + Math.sign(dz) * hd;
    }
  }

  return { onGround };
}

function onPlatformTop(pos: THREE.Vector3, radius: number, platforms: PlatformRT[]): PlatformRT | null {
  for (const p of platforms) {
    if (p.goneTime > 0) continue;
    const d = p.data;
    if (d.isVegetation) continue;
    const dx = Math.abs(pos.x - d.position[0]);
    const dz = Math.abs(pos.z - d.position[2]);
    if (dx > d.size[0] / 2 + radius || dz > d.size[2] / 2 + radius) continue;
    const topY = d.position[1] + d.size[1] / 2;
    if (Math.abs(pos.y - topY) < 0.2) return p;
  }
  return null;
}

// ---------- World building ----------
function makeEnemyMesh(kind: string, level: number): THREE.Group {
  const g = new THREE.Group();
  const bodyColor = new THREE.Color().setHSL(0.0, 0.7, 0.35 + Math.min(level, 8) * 0.03);
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.2, 0.6),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 }),
  );
  body.position.y = 0.6;
  body.castShadow = true;
  g.add(body);
  // eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff4400, emissiveIntensity: 0.6 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
  eyeL.position.set(-0.18, 0.9, 0.3);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.18;
  g.add(eyeL, eyeR);
  // arms
  const armMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 });
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), armMat);
  armL.position.set(-0.5, 0.7, 0); armL.castShadow = true;
  const armR = armL.clone(); armR.position.x = 0.5;
  g.add(armL, armR);
  return g;
}

function makeChickenMesh(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.35, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
  );
  body.position.y = 0.35; body.castShadow = true;
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xffffff }),
  );
  head.position.set(0, 0.65, 0.15);
  const beak = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xffaa00 }),
  );
  beak.position.set(0, 0.65, 0.3);
  const comb = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.12, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xff3333 }),
  );
  comb.position.set(0, 0.8, 0.1);
  g.add(body, head, beak, comb);
  return g;
}

function makeBushMesh(): THREE.Group {
  const g = new THREE.Group();
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 0.8 });
  for (let i = 0; i < 3; i++) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), leafMat);
    blob.position.set((Math.random() - 0.5) * 0.5, 0.3 + Math.random() * 0.2, (Math.random() - 0.5) * 0.5);
    blob.castShadow = true;
    g.add(blob);
  }
  // berries
  const berryMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, emissive: 0x660000, emissiveIntensity: 0.3 });
  for (let i = 0; i < 4; i++) {
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), berryMat);
    berry.position.set((Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6);
    g.add(berry);
  }
  return g;
}

function makeNpcMesh(color: string): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.0, 0.4),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
  );
  body.position.y = 0.5; body.castShadow = true;
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.35, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xddccaa }),
  );
  head.position.y = 1.2;
  g.add(body, head);
  return g;
}

function makePortalMesh(): THREE.Group {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.15, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffaa, emissiveIntensity: 1.2 }),
  );
  ring.position.y = 1.3;
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  disc.position.y = 1.3;
  g.add(ring, disc);
  return g;
}

export function buildWorld(level: number, parent: THREE.Group): GameWorld {
  const data = generateLevel(level);
  const group = new THREE.Group();
  parent.add(group);

  // Platforms
  const platforms: PlatformRT[] = [];
  for (const pd of data.platforms) {
    const mat = new THREE.MeshStandardMaterial({
      color: pd.color,
      roughness: pd.isWater ? 0.2 : 0.85,
      metalness: pd.isWater ? 0.3 : 0,
      transparent: pd.isWater,
      opacity: pd.isWater ? 0.7 : 1,
    });
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(pd.size[0], pd.size[1], pd.size[2]),
      mat,
    );
    mesh.position.set(pd.position[0], pd.position[1], pd.position[2]);
    mesh.castShadow = !pd.isWater;
    mesh.receiveShadow = true;
    group.add(mesh);
    platforms.push({
      data: pd, mesh, baseY: pd.position[1], shakeTime: 0, goneTime: 0,
      earthquake: !!pd.earthquake && level === 1,
    });
  }

  // Enemies
  const enemies: EnemyRT[] = [];
  for (const e of data.enemies) {
    const mesh = makeEnemyMesh(e.kind, e.level);
    mesh.position.set(e.position[0], e.position[1], e.position[2]);
    group.add(mesh);
    enemies.push({
      id: e.id, kind: e.kind, level: e.level, mesh,
      health: ENEMY.baseHealth + e.level * 15,
      maxHealth: ENEMY.baseHealth + e.level * 15,
      alive: true, attackCd: 0, hitFlash: 0,
      platformIndex: e.platformIndex,
      homePos: new THREE.Vector3(e.position[0], e.position[1], e.position[2]),
    });
  }

  // Chickens
  const chickens: ChickenRT[] = [];
  for (const c of data.chickens) {
    const mesh = makeChickenMesh();
    mesh.position.set(c.position[0], c.position[1], c.position[2]);
    group.add(mesh);
    chickens.push({
      id: c.id, mesh, alive: true, platformIndex: c.platformIndex,
      dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
      changeDirIn: Math.random() * 3,
    });
  }

  // Bushes
  const bushes: BushRT[] = [];
  for (const b of data.bushes) {
    const mesh = makeBushMesh();
    mesh.position.set(b.position[0], b.position[1], b.position[2]);
    group.add(mesh);
    bushes.push({ id: b.id, mesh, berries: b.berries, cooldown: 0 });
  }

  // NPCs
  const npcs: THREE.Group[] = [];
  for (const n of data.npcs) {
    const mesh = makeNpcMesh(n.color);
    mesh.position.set(n.position[0], n.position[1], n.position[2]);
    group.add(mesh);
    npcs.push(mesh);
  }

  // Portal
  const portalMesh = makePortalMesh();
  portalMesh.position.set(data.portalPosition[0], data.portalPosition[1], data.portalPosition[2]);
  group.add(portalMesh);

  return {
    level, data, platforms, enemies, chickens, bushes, npcs,
    portal: { mesh: portalMesh, position: new THREE.Vector3(...data.portalPosition) },
    group, spawnPoint: new THREE.Vector3(...data.spawnPoint), groundY: data.groundY,
    nextEarthquakeCheck: 15,
  };
}

export function disposeWorld(world: GameWorld, parent: THREE.Group) {
  parent.remove(world.group);
  world.group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      const m = obj.material;
      if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
      else m?.dispose();
    }
  });
}

// ---------- Main update ----------
const _tmpV = new THREE.Vector3();
const _tmpV2 = new THREE.Vector3();
const _camOffset = new THREE.Vector3();

export function updateGame(
  world: GameWorld,
  camera: THREE.PerspectiveCamera,
  playerMesh: THREE.Group,
  dt: number,
  elapsed: number,
) {
  if (gameRefs.paused) return;

  const r = gameRefs;
  const store = useGame.getState();

  // ---- Day/night cycle ----
  const cycleTime = elapsed % CYCLE_LENGTH;
  r.isNight = cycleTime >= DAY_LENGTH;
  r.dayProgress = cycleTime / CYCLE_LENGTH;

  // ---- Survival decay ----
  r.playerHunger = Math.max(0, r.playerHunger - HUNGER_DECAY * dt);
  r.playerExhaustion = Math.max(0, r.playerExhaustion - EXHAUSTION_DECAY * dt);
  if (r.playerHunger <= 0) {
    r.playerHealth = Math.max(0, r.playerHealth - STARVE_DAMAGE * dt);
    if (r.playerHealth <= 0) { store.die('You starved to death.'); return; }
  }

  // ---- Input: camera-relative movement ----
  // Yaw represents the camera orbit angle and player aim direction.
  // Forward vector F points in the camera look direction on the horizontal plane.
  // Right vector R points orthogonally to the right of camera view.
  const yaw = r.cameraYaw;
  const forward = _tmpV.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
  const right = _tmpV2.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

  const moveDir = new THREE.Vector3();
  if (KEYS.has('w') || KEYS.has('arrowup')) moveDir.add(forward);
  if (KEYS.has('s') || KEYS.has('arrowdown')) moveDir.sub(forward);
  if (KEYS.has('d') || KEYS.has('arrowright')) moveDir.add(right);
  if (KEYS.has('a') || KEYS.has('arrowleft')) moveDir.sub(right);

  let speed = PLAYER.baseSpeed + r.playerSkills.speed * 1.1;
  if (r.playerExhaustion <= 0) speed *= 0.5;

  const vel = r.playerVel;
  // Instant stop & deadzone: if input is active, set horizontal velocity directly.
  // If no directional key is pressed, immediately zero horizontal velocity with 0 inertia.
  if (moveDir.lengthSq() > 0.0001) {
    moveDir.normalize();
    vel.x = moveDir.x * speed;
    vel.z = moveDir.z * speed;
  } else {
    vel.x = 0;
    vel.z = 0;
  }
  vel.y -= PLAYER.gravity * dt;

  // Jump — check ground before integrating
  const grounded = isGrounded(r.playerPos, world.platforms, PLAYER.radius);
  if ((KEYS.has(' ') || KEYS.has('space')) && grounded && vel.y <= 0.01) {
    vel.y = PLAYER.baseJump + r.playerSkills.jump * 1.25;
  }

  // Integrate
  r.playerPos.x += vel.x * dt;
  r.playerPos.y += vel.y * dt;
  r.playerPos.z += vel.z * dt;

  // Collide
  const { onGround } = collidePlatforms(r.playerPos, vel, PLAYER.radius, PLAYER.height, world.platforms, dt);
  if (onGround) vel.y = 0;

  // Fall death
  if (r.playerPos.y < world.groundY - 15) {
    r.playerHealth = 0;
    store.die('You fell into the void.');
    return;
  }

  // Update player mesh — player always faces camera forward direction (yaw)
  playerMesh.position.copy(r.playerPos);
  playerMesh.rotation.y = yaw;

  // ---- Camera (third-person spherical orbit rigidly following player) ----
  const camDist = 5.0;
  const camHeight = 2.5;
  const clampedPitch = Math.max(-0.8, Math.min(0.6, r.cameraPitch));
  const horizDist = camDist * Math.cos(clampedPitch);
  const vertDist = camHeight + camDist * Math.sin(clampedPitch);

  _camOffset.set(
    r.playerPos.x + Math.sin(yaw) * horizDist,
    r.playerPos.y + vertDist,
    r.playerPos.z + Math.cos(yaw) * horizDist,
  );
  camera.position.copy(_camOffset);
  camera.lookAt(r.playerPos.x, r.playerPos.y + 1.2, r.playerPos.z);

  // ---- Enemies ----
  let nearestEntity: { kind: 'enemy' | 'chicken' | 'bush'; name: string; distance: number } | null = null;
  let nearestDist = Infinity;

  for (const e of world.enemies) {
    if (!e.alive) continue;
    const ep = e.mesh.position;
    const dist = ep.distanceTo(r.playerPos);
    e.mesh.rotation.y = Math.atan2(r.playerPos.x - ep.x, r.playerPos.z - ep.z);

    if (dist < ENEMY.detectRange) {
      _tmpV.subVectors(r.playerPos, ep).normalize();
      _tmpV.y = 0;
      const eSpeed = ENEMY.baseSpeed + e.level * 0.15;
      ep.x += _tmpV.x * eSpeed * dt;
      ep.z += _tmpV.z * eSpeed * dt;

      // Attack
      e.attackCd -= dt;
      if (dist < ENEMY.attackRange && e.attackCd <= 0) {
        e.attackCd = ENEMY.attackCooldown;
        const playerOverleveled = r.playerLevel >= e.level;
        let dmg = ENEMY.baseDamage + e.level * 3;
        if (!playerOverleveled) dmg *= 3.5; // lethal if under-leveled
        r.playerHealth = Math.max(0, r.playerHealth - dmg);
        r.hitFlash = elapsed;
        if (r.playerHealth <= 0) {
          store.die(`Killed by a ${e.kind} (Lvl ${e.level}).`);
          return;
        }
      }
    } else {
      // Return home
      _tmpV.subVectors(e.homePos, ep);
      _tmpV.y = 0;
      if (_tmpV.length() > 1) {
        _tmpV.normalize();
        ep.x += _tmpV.x * ENEMY.baseSpeed * 0.5 * dt;
        ep.z += _tmpV.z * ENEMY.baseSpeed * 0.5 * dt;
      }
    }

    // Hit flash
    if (e.hitFlash > 0) {
      e.hitFlash -= dt;
      const body = e.mesh.children[0] as THREE.Mesh;
      (body.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
      (body.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
    } else {
      const body = e.mesh.children[0] as THREE.Mesh;
      (body.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
    }

    // Hearing skill proximity
    const hearingRange = 8 + r.playerSkills.hearing * 5;
    if (r.playerSkills.hearing > 0 && dist < hearingRange && dist < nearestDist) {
      nearestDist = dist;
      nearestEntity = { kind: 'enemy', name: `${cap(e.kind)} Lvl ${e.level}`, distance: dist };
    }
  }

  // ---- Chickens ----
  for (const c of world.chickens) {
    if (!c.alive) continue;
    const cp = c.mesh.position;
    const dist = cp.distanceTo(r.playerPos);
    c.changeDirIn -= dt;
    if (c.changeDirIn <= 0) {
      c.dir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      c.changeDirIn = 2 + Math.random() * 3;
    }
    if (dist < CHICKEN.fleeRange) {
      _tmpV.subVectors(cp, r.playerPos).normalize();
      c.dir.copy(_tmpV);
    }
    cp.x += c.dir.x * CHICKEN.speed * dt;
    cp.z += c.dir.z * CHICKEN.speed * dt;
    // bob
    c.mesh.position.y = world.groundY + 1 + Math.abs(Math.sin(elapsed * 6 + c.id)) * 0.05;
    c.mesh.rotation.y = Math.atan2(c.dir.x, c.dir.z);

    if (r.playerSkills.hearing > 0 && dist < 10 + r.playerSkills.hearing * 4 && dist < nearestDist) {
      nearestDist = dist;
      nearestEntity = { kind: 'chicken', name: 'Chicken', distance: dist };
    }
  }

  // ---- Bushes ----
  for (const b of world.bushes) {
    if (b.cooldown > 0) b.cooldown -= dt;
    const bp = b.mesh.position;
    const dist = bp.distanceTo(r.playerPos);
    if (r.playerSkills.hearing > 0 && b.berries > 0 && dist < 6 + r.playerSkills.hearing * 3 && dist < nearestDist) {
      nearestDist = dist;
      nearestEntity = { kind: 'bush', name: 'Berry Bush', distance: dist };
    }
  }
  r.nearbyEntity = nearestEntity;

  // ---- Earthquake (Level 1) ----
  if (world.level === 1) {
    world.nextEarthquakeCheck -= dt;
    if (world.nextEarthquakeCheck <= 0) {
      world.nextEarthquakeCheck = 12 + Math.random() * 10;
      const candidates = world.platforms.filter((p) => p.earthquake);
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        pick.shakeTime = 2.0;
      }
    }
    r.earthquakeActive = false;
    for (const p of world.platforms) {
      if (p.shakeTime > 0) {
        r.earthquakeActive = true;
        p.shakeTime -= dt;
        p.mesh.position.x = p.data.position[0] + (Math.random() - 0.5) * 0.3;
        p.mesh.position.z = p.data.position[2] + (Math.random() - 0.5) * 0.3;
        if (p.shakeTime <= 0) {
          p.goneTime = 4.0;
          p.mesh.visible = false;
        }
      } else if (p.goneTime > 0) {
        p.goneTime -= dt;
        if (p.goneTime <= 0) {
          p.mesh.visible = true;
          p.mesh.position.set(p.data.position[0], p.data.position[1], p.data.position[2]);
        }
      }
    }
  }

  // ---- Portal check ----
  if (r.playerPos.distanceTo(world.portal.position) < 2) {
    const s = useGame.getState();
    s.advanceLevel();
    return;
  }

  // ---- Sleep fade ----
  if (r.sleepFade > 0) {
    r.sleepFade = Math.max(0, r.sleepFade - dt * 1.5);
  }
}

function isGrounded(pos: THREE.Vector3, platforms: PlatformRT[], radius: number): boolean {
  for (const p of platforms) {
    if (p.goneTime > 0) continue;
    const d = p.data;
    if (d.isVegetation) continue;
    const dx = Math.abs(pos.x - d.position[0]);
    const dz = Math.abs(pos.z - d.position[2]);
    if (dx > d.size[0] / 2 + radius || dz > d.size[2] / 2 + radius) continue;
    const topY = d.position[1] + d.size[1] / 2;
    if (pos.y >= topY - 0.15 && pos.y <= topY + 0.15) return true;
  }
  return false;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------- Combat & interactions (called on key/click events) ----------
export function playerAttack(world: GameWorld, elapsed: number) {
  if (gameRefs.paused) return;
  if (elapsed - gameRefs.attackSwing < PLAYER.attackCooldown) return;
  gameRefs.attackSwing = elapsed;

  const r = gameRefs;
  let hitSomething = false;

  // Enemies
  for (const e of world.enemies) {
    if (!e.alive) continue;
    const dist = e.mesh.position.distanceTo(r.playerPos);
    if (dist > PLAYER.attackRange) continue;
    // Check facing
    const toEnemy = _tmpV.subVectors(e.mesh.position, r.playerPos).normalize();
    const facing = _tmpV2.set(-Math.sin(r.cameraYaw), 0, -Math.cos(r.cameraYaw));
    if (toEnemy.dot(facing) < 0.2) continue;

    const playerOver = r.playerLevel >= e.level;
    const dmg = playerOver ? (e.maxHealth / 2.5) : (e.maxHealth / 6);
    e.health -= dmg;
    e.hitFlash = 0.2;
    hitSomething = true;

    if (e.health <= 0) {
      e.alive = false;
      e.mesh.visible = false;
      // XP reward
      const xpGain = e.level * 25;
      r.playerXP += xpGain;
      while (r.playerXP >= r.playerXPMax) {
        r.playerXP -= r.playerXPMax;
        r.playerLevel += 1;
        r.playerSkillPoints += 1;
        r.playerXPMax = xpForLevel(r.playerLevel);
        r.playerHealth = Math.min(r.playerHealth + 20, 100);
      }
    }
  }

  // Chickens
  for (const c of world.chickens) {
    if (!c.alive) continue;
    const dist = c.mesh.position.distanceTo(r.playerPos);
    if (dist > PLAYER.attackRange) continue;
    c.alive = false;
    c.mesh.visible = false;
    r.playerHunger = Math.min(100, r.playerHunger + 25);
    hitSomething = true;
  }

  return hitSomething;
}

export function playerInteract(world: GameWorld): boolean {
  if (gameRefs.paused) return false;
  const r = gameRefs;
  for (const b of world.bushes) {
    if (b.berries <= 0 || b.cooldown > 0) continue;
    const dist = b.mesh.position.distanceTo(r.playerPos);
    if (dist > 2.5) continue;
    b.berries -= 1;
    b.cooldown = 8;
    r.playerHunger = Math.min(100, r.playerHunger + 18);
    // Hide berries visually
    const berryMeshes = b.mesh.children.filter((_, i) => i >= 3);
    if (berryMeshes.length > 0) {
      berryMeshes[berryMeshes.length - 1].visible = false;
    }
    if (b.berries <= 0) {
      setTimeout(() => {
        b.berries = 3;
        b.cooldown = 0;
        b.mesh.children.forEach((child) => { child.visible = true; });
      }, 10000);
    }
    return true;
  }
  return false;
}

export function playerSleep() {
  if (gameRefs.paused) return;
  gameRefs.playerExhaustion = 100;
  gameRefs.sleepFade = 1.0;
}
