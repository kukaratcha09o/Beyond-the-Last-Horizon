PROJECT OVERVIEW & CONTEXT (FOR INFORMATION ONLY - DO NOT EXECUTE CODE CHANGES YET)

Project Title: "Beyond the Last Horizon"
Genre: 3D Post-Apocalyptic Survival TPP RPG Platformer
Tech Stack: Vite + React + TypeScript + Three.js (React Three Fiber) + Tailwind CSS

1. GAMEPLAY & WORLD VISION
- Setting: A post-apocalyptic Earth covered in ruins, collapsed structures, and overgrown vegetation.
- Protagonist: A young girl who starts at Level 1 and explores the world, earning XP from quests and combat to unlock skill points.
- Level Structure (4 Biomes):
    * Level 1 (Green Zone): Ruined cities, overgrown vegetation, featuring a peaceful "Survivor Village" (with passive Minecraft-style NPCs) at the starting area.
    * Level 2 (Desert): A harsh orange/yellow sand environment.
    * Level 3 (Mountains): A steep, snowy environment made of white blocks.
    * Level 4 (Ocean): A flat blue water surface.

2. FUTURE PLANNED MECHANICS (To be implemented later)
- Survival Stats: Hunger (restored by gathering berries or hunting chickens; drains health at 0) and Exhaustion (drains over time; causes a blurred screen and 50% slow at 0; restored by pressing 'R' to pitch a tent and sleep).
- Day/Night Cycle: A 10-minute continuous loop (5 min day / 5 min night). Night will drastically reduce visibility.
- Skill Tree Menu ('K'): Spending earned skill points on upgrades like Better Vision (night light glow), Better Hearing (proximity UI indicator), Faster Speed, and Higher Jump.
- Hazards & Anomalies: Level 1 will feature an earthquake anomaly where platform blocks shake and temporarily drop/disappear.
- RPG Combat & Enemy Scaling: Aggressive red blocks representing monsters with level tags. If Player Lvl >= Enemy Lvl, they can be defeated. If Player Lvl < Enemy Lvl, they deal lethal damage.

3. CURRENT WORK IN PROGRESS
- Right now, we are entirely focused on fixing the core movement and camera controls.
- The current issue is that the camera stays static while the character moves forward, causing her to run off-screen and disappear.
- Our next technical step will be to refactor the camera hierarchy so that the PerspectiveCamera is structurally parented or locked frame-by-frame to the player's moving physics body with a rigid third-person offset.

This summary is provided so you are fully aligned with the game's ultimate identity, theme, and mechanical roadmap. Acknowledge this context and wait for specific instructions.
