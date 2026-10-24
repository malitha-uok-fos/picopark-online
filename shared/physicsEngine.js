// shared/physicsEngine.js
// Authoritative 2D physics & puzzle simulation engine

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PHYSICS,
} = require("./constants");
const { LEVELS } = require("./levels");

class GameState {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.currentLevelIndex = 0;
    this.players = new Map(); // id -> PlayerState
    this.levelData = null;
    this.stageEntities = {};
    this.isStageCleared = false;
    this.stageClearTimer = 0;
    this.soundEvents = []; // sounds triggered this tick to notify clients
    this.initLevel(0);
  }

  initLevel(levelIndex) {
    this.currentLevelIndex = levelIndex % LEVELS.length;
    const baseLevel = LEVELS[this.currentLevelIndex];
    this.isStageCleared = false;
    this.stageClearTimer = 0;

    // Deep clone level entities
    this.levelData = {
      id: baseLevel.id,
      title: baseLevel.title,
      hint: baseLevel.hint,
      spawn: { ...baseLevel.spawn },
      platforms: baseLevel.platforms.map((p) => ({ ...p })),
      trampolines: baseLevel.trampolines.map((t) => ({ ...t })),
      hazards: baseLevel.hazards.map((h) => ({ ...h })),
      door: {
        ...baseLevel.door,
        isUnlocked: false,
        enteredPlayerIds: [],
      },
      key: {
        x: baseLevel.key.x,
        y: baseLevel.key.y,
        originX: baseLevel.key.x,
        originY: baseLevel.key.y,
        carrierId: null,
        isCollected: false,
        floatOffset: 0,
      },
      pushBlocks: (baseLevel.pushBlocks || []).map((pb) => ({
        ...pb,
        vx: 0,
        vy: 0,
        grounded: false,
        currentPushers: 0,
        pushDirection: 0,
      })),
      buttons: (baseLevel.buttons || []).map((btn) => ({
        ...btn,
        isPressed: false,
      })),
      gates: (baseLevel.gates || []).map((gate) => ({
        ...gate,
        currentY: gate.closedY,
        isOpen: false,
      })),
      movingPlatforms: (baseLevel.movingPlatforms || []).map((mp) => ({
        ...mp,
        currentY: mp.inactiveY !== undefined ? mp.inactiveY : mp.y,
        isActive: false,
      })),
    };

    // Reset player positions to spawn point
    for (const [id, player] of this.players.entries()) {
      player.x = this.levelData.spawn.x + (player.colorId * 25) % 150;
      player.y = this.levelData.spawn.y;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.isDead = false;
      player.hasEnteredDoor = false;
      player.standingOnPlayerId = null;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
    }
  }

  addPlayer(id, name, colorId) {
    const player = {
      id,
      name: name || `Player ${this.players.size + 1}`,
      colorId: colorId !== undefined ? colorId : this.players.size % 8,
      x: this.levelData ? this.levelData.spawn.x + (this.players.size * 25) % 150 : 80,
      y: this.levelData ? this.levelData.spawn.y : 550,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      facing: 1, // 1: right, -1: left
      grounded: true,
      standingOnPlayerId: null,
      isDead: false,
      respawnTimer: 0,
      hasEnteredDoor: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      animWalk: 0,
      emote: null,
      emoteTimer: 0,
      inputs: {
        left: false,
        right: false,
        jump: false,
        jumpHeld: false,
      },
    };
    this.players.set(id, player);
    return player;
  }

  removePlayer(id) {
    // If player was carrying key, drop key
    if (this.levelData && this.levelData.key.carrierId === id) {
      const player = this.players.get(id);
      this.levelData.key.carrierId = null;
      this.levelData.key.isCollected = false;
      if (player) {
        this.levelData.key.x = player.x;
        this.levelData.key.y = player.y;
      }
    }
    this.players.delete(id);
  }

  updatePlayerInputs(id, inputs) {
    const player = this.players.get(id);
    if (!player || player.isDead || player.hasEnteredDoor) return;

    if (inputs.jump && !player.inputs.jump) {
      player.jumpBufferTimer = PHYSICS.JUMP_BUFFER;
    }

    player.inputs = {
      left: !!inputs.left,
      right: !!inputs.right,
      jump: !!inputs.jump,
      jumpHeld: !!inputs.jumpHeld,
    };
  }

  triggerEmote(id, emoteId) {
    const player = this.players.get(id);
    if (player) {
      player.emote = emoteId;
      player.emoteTimer = 3.0; // Show emote for 3 seconds
      this.soundEvents.push({ type: "emote", playerId: id });
    }
  }

  tick(dt) {
    this.soundEvents = [];
    if (!this.levelData) return;

    // Handle Stage Clear progression
    if (this.isStageCleared) {
      this.stageClearTimer += dt;
      if (this.stageClearTimer >= 3.0) {
        this.initLevel(this.currentLevelIndex + 1);
        this.soundEvents.push({ type: "levelStart" });
      }
      return;
    }

    // 1. Update Push Blocks gravity and physics
    this.updatePushBlocks(dt);

    // 2. Update Interactive elements (Buttons, Gates, Moving platforms)
    this.updateInteractives(dt);

    // 3. Update Players
    this.updatePlayers(dt);

    // 4. Update Stacking (Player on Player)
    this.updatePlayerStacking(dt);

    // 5. Update Key & Door interactions
    this.updateKeyAndDoor(dt);

    // 6. Check Level Completion
    this.checkStageClear();
  }

  updatePushBlocks(dt) {
    const totalPlayers = Math.max(1, this.players.size);

    for (const block of this.levelData.pushBlocks) {
      // Apply gravity to block
      block.vy += PHYSICS.GRAVITY * dt;
      if (block.vy > PHYSICS.MAX_FALL_SPEED) block.vy = PHYSICS.MAX_FALL_SPEED;

      // Vertical movement & platform collision
      block.y += block.vy * dt;
      block.grounded = false;

      for (const plat of this.levelData.platforms) {
        if (this.checkAABB(block, plat)) {
          if (block.vy > 0 && block.y + block.height - block.vy * dt <= plat.y + 10) {
            block.y = plat.y - block.height;
            block.vy = 0;
            block.grounded = true;
          } else if (block.vy < 0 && block.y - block.vy * dt >= plat.y + plat.height - 10) {
            block.y = plat.y + plat.height;
            block.vy = 0;
          }
        }
      }

      // Check pushing from players
      let leftPushers = 0;
      let rightPushers = 0;

      for (const player of this.players.values()) {
        if (player.isDead || player.hasEnteredDoor) continue;

        // Player is touching left side of block and walking right
        if (
          player.inputs.right &&
          player.x + player.width >= block.x - 3 &&
          player.x < block.x &&
          player.y + player.height > block.y + 6 &&
          player.y < block.y + block.height - 6
        ) {
          leftPushers++;
        }

        // Player is touching right side of block and walking left
        if (
          player.inputs.left &&
          player.x <= block.x + block.width + 3 &&
          player.x + player.width > block.x + block.width &&
          player.y + player.height > block.y + 6 &&
          player.y < block.y + block.height - 6
        ) {
          rightPushers++;
        }
      }

      const required = Math.min(block.requiredPushers, totalPlayers);
      block.currentPushers = Math.max(leftPushers, rightPushers);
      block.pushDirection = leftPushers >= required ? 1 : rightPushers >= required ? -1 : 0;

      if (block.pushDirection !== 0) {
        const dx = block.pushDirection * PHYSICS.PUSH_SPEED * dt;
        block.x += dx;
        this.soundEvents.push({ type: "pushBlock" });

        // Push block against solid platforms
        for (const plat of this.levelData.platforms) {
          if (this.checkAABB(block, plat)) {
            if (dx > 0) block.x = plat.x - block.width;
            else if (dx < 0) block.x = plat.x + plat.width;
          }
        }

        // Push block against gates
        for (const gate of this.levelData.gates) {
          const gateBox = { x: gate.x, y: gate.currentY, width: gate.width, height: gate.height };
          if (this.checkAABB(block, gateBox)) {
            if (dx > 0) block.x = gate.x - block.width;
            else if (dx < 0) block.x = gate.x + gate.width;
          }
        }
      }
    }
  }

  updateInteractives(dt) {
    // 1. Reset buttons
    for (const btn of this.levelData.buttons) {
      let isPressed = false;

      // Check if any player is on the button
      const btnSensor = { x: btn.x, y: btn.y - 4, width: btn.width, height: btn.height + 6 };
      for (const player of this.players.values()) {
        if (!player.isDead && !player.hasEnteredDoor && this.checkAABB(player, btnSensor)) {
          isPressed = true;
          break;
        }
      }

      // Check if any push block is on the button
      if (!isPressed) {
        for (const block of this.levelData.pushBlocks) {
          if (this.checkAABB(block, btnSensor)) {
            isPressed = true;
            break;
          }
        }
      }

      if (isPressed && !btn.isPressed) {
        this.soundEvents.push({ type: "buttonPress" });
      }
      btn.isPressed = isPressed;

      // Apply button effect to Gates
      if (btn.targetDoor) {
        const gate = this.levelData.gates.find((g) => g.id === btn.targetDoor);
        if (gate) {
          gate.isOpen = btn.isPressed;
        }
      }

      // Apply button effect to Moving Platforms
      if (btn.targetPlatform) {
        const plat = this.levelData.movingPlatforms.find((p) => p.id === btn.targetPlatform);
        if (plat) {
          plat.isActive = btn.isPressed;
        }
      }

      // Apply button effect to Hazards (e.g. Lasers)
      if (btn.targetHazard) {
        const hazard = this.levelData.hazards.find((h) => h.id === btn.targetHazard);
        if (hazard) {
          hazard.active = !btn.isPressed;
        }
      }
    }

    // 2. Smoothly animate Gates
    for (const gate of this.levelData.gates) {
      const targetY = gate.isOpen ? gate.openY : gate.closedY;
      const speed = 260 * dt;
      if (Math.abs(gate.currentY - targetY) <= speed) {
        gate.currentY = targetY;
      } else if (gate.currentY < targetY) {
        gate.currentY += speed;
      } else {
        gate.currentY -= speed;
      }
    }

    // 3. Smoothly animate Moving Platforms
    for (const plat of this.levelData.movingPlatforms) {
      if (plat.controlledByButton) {
        const targetY = plat.isActive ? plat.activeY : plat.inactiveY;
        const speed = 240 * dt;
        if (Math.abs(plat.currentY - targetY) <= speed) {
          plat.currentY = targetY;
        } else if (plat.currentY < targetY) {
          plat.currentY += speed;
        } else {
          plat.currentY -= speed;
        }
        plat.y = plat.currentY;
      }
    }
  }

  updatePlayers(dt) {
    for (const player of this.players.values()) {
      // Handle respawn timer if dead
      if (player.isDead) {
        player.respawnTimer -= dt;
        if (player.respawnTimer <= 0) {
          this.respawnPlayer(player);
        }
        continue;
      }

      if (player.hasEnteredDoor) continue;

      // Handle Emotes timer
      if (player.emoteTimer > 0) {
        player.emoteTimer -= dt;
        if (player.emoteTimer <= 0) {
          player.emote = null;
        }
      }

      // Timers for coyote and jump buffer
      if (player.coyoteTimer > 0) player.coyoteTimer -= dt;
      if (player.jumpBufferTimer > 0) player.jumpBufferTimer -= dt;

      // Horizontal Input & Acceleration
      let targetVx = 0;
      if (player.inputs.left && !player.inputs.right) {
        targetVx = -PHYSICS.MOVE_SPEED;
        player.facing = -1;
      } else if (player.inputs.right && !player.inputs.left) {
        targetVx = PHYSICS.MOVE_SPEED;
        player.facing = 1;
      }

      if (targetVx !== 0) {
        player.vx = this.approach(player.vx, targetVx, PHYSICS.ACCEL * dt);
        player.animWalk += dt * 14;
      } else {
        player.vx = this.approach(player.vx, 0, PHYSICS.DECEL * dt);
        player.animWalk = 0;
      }

      // Jump Execution
      const canJump = player.grounded || player.coyoteTimer > 0;
      if (player.jumpBufferTimer > 0 && canJump) {
        player.vy = PHYSICS.JUMP_VELOCITY;
        player.grounded = false;
        player.coyoteTimer = 0;
        player.jumpBufferTimer = 0;
        player.standingOnPlayerId = null;
        this.soundEvents.push({ type: "jump", playerId: player.id });
      }

      // Variable Jump Height (cutting jump when button released)
      if (!player.inputs.jumpHeld && player.vy < 0) {
        player.vy += PHYSICS.GRAVITY * 1.5 * dt;
      } else {
        player.vy += PHYSICS.GRAVITY * dt;
      }

      if (player.vy > PHYSICS.MAX_FALL_SPEED) {
        player.vy = PHYSICS.MAX_FALL_SPEED;
      }

      // Perform X collision & movement
      const oldX = player.x;
      player.x += player.vx * dt;
      this.resolvePlayerHorizontalCollisions(player, oldX);

      // Perform Y collision & movement
      const oldY = player.y;
      player.y += player.vy * dt;
      const wasGrounded = player.grounded;
      player.grounded = false;
      this.resolvePlayerVerticalCollisions(player, oldY);

      // Coyote time update
      if (wasGrounded && !player.grounded && player.vy >= 0) {
        player.coyoteTimer = PHYSICS.COYOTE_TIME;
      }

      // Check Trampoline pad collisions
      for (const tramp of this.levelData.trampolines) {
        if (this.checkAABB(player, tramp) && player.vy > 0) {
          player.vy = tramp.bouncePower;
          player.y = tramp.y - player.height;
          player.grounded = false;
          player.coyoteTimer = 0;
          this.soundEvents.push({ type: "trampoline", playerId: player.id });
        }
      }

      // Check Hazard Collisions
      for (const hazard of this.levelData.hazards) {
        if (hazard.active !== false && this.checkAABB(player, hazard)) {
          this.killPlayer(player);
          break;
        }
      }

      // Fall out of bounds
      if (player.y > CANVAS_HEIGHT + 100) {
        this.killPlayer(player);
      }
    }
  }

  resolvePlayerHorizontalCollisions(player, oldX) {
    // Platforms
    for (const plat of this.levelData.platforms) {
      if (this.checkAABB(player, plat)) {
        if (player.x > oldX) player.x = plat.x - player.width;
        else if (player.x < oldX) player.x = plat.x + plat.width;
        player.vx = 0;
      }
    }

    // Gates
    for (const gate of this.levelData.gates) {
      const gateBox = { x: gate.x, y: gate.currentY, width: gate.width, height: gate.height };
      if (this.checkAABB(player, gateBox)) {
        if (player.x > oldX) player.x = gate.x - player.width;
        else if (player.x < oldX) player.x = gate.x + gate.width;
        player.vx = 0;
      }
    }

    // Push blocks
    for (const block of this.levelData.pushBlocks) {
      if (this.checkAABB(player, block)) {
        if (player.x > oldX) player.x = block.x - player.width;
        else if (player.x < oldX) player.x = block.x + block.width;
        player.vx = 0;
      }
    }
  }

  resolvePlayerVerticalCollisions(player, oldY) {
    // Static Platforms
    for (const plat of this.levelData.platforms) {
      if (this.checkAABB(player, plat)) {
        if (player.y > oldY) {
          player.y = plat.y - player.height;
          player.vy = 0;
          player.grounded = true;
          player.standingOnPlayerId = null;
        } else if (player.y < oldY) {
          player.y = plat.y + plat.height;
          player.vy = 0;
        }
      }
    }

    // Moving Platforms
    for (const plat of this.levelData.movingPlatforms) {
      const platBox = { x: plat.x, y: plat.currentY, width: plat.width, height: plat.height };
      if (this.checkAABB(player, platBox)) {
        if (player.y > oldY) {
          player.y = plat.currentY - player.height;
          player.vy = 0;
          player.grounded = true;
          player.standingOnPlayerId = null;
        } else if (player.y < oldY) {
          player.y = plat.currentY + plat.height;
          player.vy = 0;
        }
      }
    }

    // Push blocks as floor/ceilings
    for (const block of this.levelData.pushBlocks) {
      if (this.checkAABB(player, block)) {
        if (player.y > oldY) {
          player.y = block.y - player.height;
          player.vy = 0;
          player.grounded = true;
          player.standingOnPlayerId = null;
        } else if (player.y < oldY) {
          player.y = block.y + block.height;
          player.vy = 0;
        }
      }
    }
  }

  updatePlayerStacking(dt) {
    // Player on Player stacking (Pico Park iconic feature!)
    const activePlayers = Array.from(this.players.values()).filter(
      (p) => !p.isDead && !p.hasEnteredDoor
    );

    for (let i = 0; i < activePlayers.length; i++) {
      const top = activePlayers[i];

      for (let j = 0; j < activePlayers.length; j++) {
        if (i === j) continue;
        const bottom = activePlayers[j];

        // Is top player falling or landing on bottom player's head?
        const horizontalOverlap =
          top.x + top.width > bottom.x + 6 && top.x < bottom.x + bottom.width - 6;

        if (horizontalOverlap) {
          const feetY = top.y + top.height;
          const headY = bottom.y;

          // Land on head condition
          if (feetY >= headY - 8 && feetY <= headY + 14 && top.vy >= 0) {
            top.y = headY - top.height;
            top.vy = Math.max(0, bottom.vy);
            top.grounded = true;
            top.standingOnPlayerId = bottom.id;

            // Carry horizontal movement of bottom player if top is not actively running
            if (!top.inputs.left && !top.inputs.right && bottom.vx !== 0) {
              top.x += bottom.vx * dt;
            }
          }
        }
      }
    }
  }

  updateKeyAndDoor(dt) {
    const key = this.levelData.key;
    const door = this.levelData.door;

    // 1. Key Floating animation if not collected
    if (!key.isCollected) {
      key.floatOffset += dt * 3.5;
      key.y = key.originY + Math.sin(key.floatOffset) * 6;

      // Check pickup by active players
      const keyBox = { x: key.x - 16, y: key.y - 16, width: 32, height: 32 };
      for (const player of this.players.values()) {
        if (!player.isDead && !player.hasEnteredDoor && this.checkAABB(player, keyBox)) {
          key.isCollected = true;
          key.carrierId = player.id;
          this.soundEvents.push({ type: "keyCollect", playerId: player.id });
          break;
        }
      }
    } else {
      // Key follows carrier
      const carrier = this.players.get(key.carrierId);
      if (!carrier || carrier.isDead || carrier.hasEnteredDoor) {
        // Drop key
        key.isCollected = false;
        key.carrierId = null;
        key.originY = key.y;
      } else {
        key.x = carrier.x + carrier.width / 2;
        key.y = carrier.y - 18;

        // Key touches door -> Unlocks door!
        if (!door.isUnlocked) {
          const doorBox = { x: door.x, y: door.y, width: door.width, height: door.height };
          const keyTouchBox = { x: key.x - 10, y: key.y - 10, width: 20, height: 20 };
          if (this.checkAABB(keyTouchBox, doorBox)) {
            door.isUnlocked = true;
            this.soundEvents.push({ type: "doorUnlock" });
          }
        }
      }
    }

    // 2. Door Entry for Players
    if (door.isUnlocked) {
      const doorBox = { x: door.x, y: door.y, width: door.width, height: door.height };
      for (const player of this.players.values()) {
        if (!player.isDead && !player.hasEnteredDoor && this.checkAABB(player, doorBox)) {
          player.hasEnteredDoor = true;
          if (!door.enteredPlayerIds.includes(player.id)) {
            door.enteredPlayerIds.push(player.id);
          }
          this.soundEvents.push({ type: "playerEnterDoor", playerId: player.id });
        }
      }
    }
  }

  checkStageClear() {
    if (this.isStageCleared || !this.levelData.door.isUnlocked) return;

    const totalActivePlayers = Array.from(this.players.values()).filter((p) => !p.isDead);
    if (totalActivePlayers.length === 0) return;

    const allEntered = totalActivePlayers.every((p) => p.hasEnteredDoor);
    if (allEntered) {
      this.isStageCleared = true;
      this.stageClearTimer = 0;
      this.soundEvents.push({ type: "stageClear" });
    }
  }

  killPlayer(player) {
    if (player.isDead) return;
    player.isDead = true;
    player.respawnTimer = 1.2; // 1.2s respawn delay
    player.vx = 0;
    player.vy = 0;
    this.soundEvents.push({ type: "playerDie", playerId: player.id, x: player.x, y: player.y });

    // Drop key if carrying
    if (this.levelData.key.carrierId === player.id) {
      this.levelData.key.carrierId = null;
      this.levelData.key.isCollected = false;
      this.levelData.key.x = player.x;
      this.levelData.key.y = player.y;
      this.levelData.key.originY = player.y;
    }
  }

  respawnPlayer(player) {
    player.isDead = false;
    player.x = this.levelData.spawn.x + (player.colorId * 25) % 150;
    player.y = this.levelData.spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.grounded = true;
    player.hasEnteredDoor = false;
    this.soundEvents.push({ type: "playerRespawn", playerId: player.id });
  }

  checkAABB(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  approach(current, target, maxDelta) {
    if (current < target) return Math.min(current + maxDelta, target);
    return Math.max(current - maxDelta, target);
  }

  // Serialized snapshot sent to clients at 30-60Hz
  getSnapshot() {
    return {
      roomCode: this.roomCode,
      levelIndex: this.currentLevelIndex,
      isStageCleared: this.isStageCleared,
      soundEvents: this.soundEvents,
      levelData: {
        id: this.levelData.id,
        title: this.levelData.title,
        hint: this.levelData.hint,
        platforms: this.levelData.platforms,
        trampolines: this.levelData.trampolines,
        door: this.levelData.door,
        key: this.levelData.key,
        pushBlocks: this.levelData.pushBlocks,
        buttons: this.levelData.buttons,
        gates: this.levelData.gates,
        movingPlatforms: this.levelData.movingPlatforms,
        hazards: this.levelData.hazards,
      },
      players: Array.from(this.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        colorId: p.colorId,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        width: p.width || 44,
        height: p.height || 52,
        vx: Math.round(p.vx),
        vy: Math.round(p.vy),
        facing: p.facing,
        grounded: p.grounded,
        isDead: p.isDead,
        hasEnteredDoor: p.hasEnteredDoor,
        animWalk: p.animWalk,
        emote: p.emote,
      })),
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameState };
}
