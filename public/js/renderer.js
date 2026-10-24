// public/js/renderer.js
// Canvas Rendering Engine for Pico Park Cats, Puzzles & Effects

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.confettiParticles = [];
    this.sparkles = [];
    this.virtualWidth = 1280;
    this.virtualHeight = 720;
    this.time = 0;
  }

  render(snapshot, localPlayerId) {
    this.time += 0.016;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!snapshot || !snapshot.levelData) return;
    const level = snapshot.levelData;

    // 1. Draw Arcade Background
    this.drawBackground();

    // 2. Draw Static Platforms
    this.drawPlatforms(level.platforms);

    // 3. Draw Moving Platforms
    if (level.movingPlatforms) {
      this.drawMovingPlatforms(level.movingPlatforms);
    }

    // 4. Draw Gates
    if (level.gates) {
      this.drawGates(level.gates);
    }

    // 5. Draw Buttons / Pressure Plates
    if (level.buttons) {
      this.drawButtons(level.buttons);
    }

    // 6. Draw Trampolines
    if (level.trampolines) {
      this.drawTrampolines(level.trampolines);
    }

    // 7. Draw Hazards (Spikes & Lasers)
    if (level.hazards) {
      this.drawHazards(level.hazards);
    }

    // 8. Draw Push Blocks
    if (level.pushBlocks) {
      this.drawPushBlocks(level.pushBlocks);
    }

    // 9. Draw Exit Door
    this.drawDoor(level.door, snapshot.players.length);

    // 10. Draw Golden Key
    this.drawKey(level.key);

    // 11. Draw Players (Cats!)
    if (snapshot.players) {
      this.drawPlayers(snapshot.players, localPlayerId);
    }

    // 12. Draw Particles (Confetti & Sparkles)
    this.drawParticles(snapshot.isStageCleared);
  }

  drawBackground() {
    const ctx = this.ctx;
    // Elegant dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.virtualHeight);
    bgGrad.addColorStop(0, '#131524');
    bgGrad.addColorStop(1, '#1A1C30');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.virtualWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.virtualHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.virtualHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.virtualWidth, y);
      ctx.stroke();
    }
  }

  drawPlatforms(platforms) {
    if (!platforms || !Array.isArray(platforms)) return;
    const ctx = this.ctx;
    for (const plat of platforms) {
      // Platform body
      ctx.fillStyle = plat.color || '#2B2D42';
      this.roundRect(ctx, plat.x, plat.y, plat.width, plat.height, 6, true, false);

      // Top edge highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(plat.x + 2, plat.y, plat.width - 4, 3);

      // Subtle bottom shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(plat.x, plat.y + plat.height - 4, plat.width, 4);
    }
  }

  drawMovingPlatforms(platforms) {
    const ctx = this.ctx;
    for (const plat of platforms) {
      ctx.fillStyle = plat.color || '#81B29A';
      this.roundRect(ctx, plat.x, plat.y, plat.width, plat.height, 6, true, false);

      // Mechanical chevrons
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 2;
      for (let x = plat.x + 20; x < plat.x + plat.width - 20; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, plat.y + 4);
        ctx.lineTo(x + 10, plat.y + plat.height / 2);
        ctx.lineTo(x, plat.y + plat.height - 4);
        ctx.stroke();
      }
    }
  }

  drawGates(gates) {
    const ctx = this.ctx;
    for (const gate of gates) {
      ctx.fillStyle = gate.color || '#E76F51';
      this.roundRect(ctx, gate.x, gate.currentY, gate.width, gate.height, 4, true, false);

      // Warning stripes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let y = gate.currentY + 5; y < gate.currentY + gate.height - 10; y += 18) {
        ctx.fillRect(gate.x + 2, y, gate.width - 4, 8);
      }
    }
  }

  drawButtons(buttons) {
    const ctx = this.ctx;
    for (const btn of buttons) {
      const isPressed = btn.isPressed;
      const height = isPressed ? 4 : btn.height;
      const y = isPressed ? btn.y + (btn.height - 4) : btn.y;

      // Base socket
      ctx.fillStyle = '#495057';
      ctx.fillRect(btn.x - 3, btn.y + btn.height, btn.width + 6, 4);

      // Push button plate
      ctx.fillStyle = isPressed ? '#2ECC71' : (btn.color || '#F4A261');
      this.roundRect(ctx, btn.x, y, btn.width, height, 3, true, false);

      // Light glow when pressed
      if (isPressed) {
        ctx.shadowColor = '#2ECC71';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#A3E4D7';
        ctx.fillRect(btn.x + 6, y + 1, btn.width - 12, 2);
        ctx.shadowBlur = 0;
      }
    }
  }

  drawTrampolines(trampolines) {
    const ctx = this.ctx;
    for (const tramp of trampolines) {
      // Base
      ctx.fillStyle = '#343A40';
      ctx.fillRect(tramp.x + 4, tramp.y + tramp.height - 4, tramp.width - 8, 4);

      // Coiled spring
      ctx.strokeStyle = '#ADB5BD';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tramp.x + tramp.width / 2, tramp.y + tramp.height - 4);
      ctx.lineTo(tramp.x + tramp.width / 2, tramp.y + 4);
      ctx.stroke();

      // Top bouncy pad
      ctx.fillStyle = '#FF9F1C';
      this.roundRect(ctx, tramp.x, tramp.y, tramp.width, 8, 4, true, false);

      // Neon bounce arrows
      ctx.fillStyle = '#FFE66D';
      const mid = tramp.x + tramp.width / 2;
      ctx.beginPath();
      ctx.moveTo(mid, tramp.y - 4);
      ctx.lineTo(mid - 6, tramp.y + 2);
      ctx.lineTo(mid + 6, tramp.y + 2);
      ctx.fill();
    }
  }

  drawHazards(hazards) {
    const ctx = this.ctx;
    for (const h of hazards) {
      if (h.type === 'spikes') {
        ctx.fillStyle = h.color || '#E63946';
        const spikeCount = Math.floor(h.width / 14);
        const spikeW = h.width / spikeCount;
        for (let i = 0; i < spikeCount; i++) {
          ctx.beginPath();
          ctx.moveTo(h.x + i * spikeW, h.y + h.height);
          ctx.lineTo(h.x + (i + 0.5) * spikeW, h.y);
          ctx.lineTo(h.x + (i + 1) * spikeW, h.y + h.height);
          ctx.fill();
        }
      } else if (h.type === 'laser') {
        if (h.active !== false) {
          // Pulsing laser
          const pulse = Math.sin(this.time * 12) * 2;
          ctx.shadowColor = '#FF0055';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#FF0055';
          ctx.fillRect(h.x - pulse / 2, h.y, h.width + pulse, h.height);

          // Inner white hot core
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(h.x + 4, h.y, h.width - 8, h.height);
          ctx.shadowBlur = 0;
        } else {
          // Inactive laser emitter
          ctx.fillStyle = 'rgba(255, 0, 85, 0.15)';
          ctx.fillRect(h.x + 4, h.y, h.width - 8, h.height);
        }
      }
    }
  }

  drawPushBlocks(blocks) {
    const ctx = this.ctx;
    for (const b of blocks) {
      // Box body
      ctx.fillStyle = b.color || '#E07A5F';
      this.roundRect(ctx, b.x, b.y, b.width, b.height, 6, true, false);

      // Crate inner border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x + 5, b.y + 5, b.width - 10, b.height - 10);

      // Cross braces
      ctx.beginPath();
      ctx.moveTo(b.x + 6, b.y + 6);
      ctx.lineTo(b.x + b.width - 6, b.y + b.height - 6);
      ctx.moveTo(b.x + b.width - 6, b.y + 6);
      ctx.lineTo(b.x + 6, b.y + b.height - 6);
      ctx.stroke();

      // Center Badge
      const badgeW = b.width - 16;
      const badgeH = 26;
      const badgeX = b.x + 8;
      const badgeY = b.y + b.height / 2 - 13;

      const isPushing = b.currentPushers >= b.requiredPushers;
      ctx.fillStyle = isPushing ? '#2ECC71' : '#222222';
      this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4, true, false);

      // Text label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `${b.label || 'PUSH'} (${b.currentPushers || 0}/${b.requiredPushers})`,
        b.x + b.width / 2,
        b.y + b.height / 2
      );
    }
  }

  drawDoor(door, totalPlayers) {
    if (!door) return;
    const ctx = this.ctx;

    // Door Frame
    ctx.fillStyle = '#3E2723';
    this.roundRect(ctx, door.x - 4, door.y - 4, door.width + 8, door.height + 4, 8, true, false);

    // Door Portal / Interior
    if (door.isUnlocked) {
      // Glowing open portal
      const portalGrad = ctx.createLinearGradient(door.x, door.y, door.x, door.y + door.height);
      portalGrad.addColorStop(0, '#FFF9C4');
      portalGrad.addColorStop(0.5, '#FFD54F');
      portalGrad.addColorStop(1, '#FF6F00');
      ctx.fillStyle = portalGrad;
      this.roundRect(ctx, door.x, door.y, door.width, door.height, 6, true, false);

      // Swirling portal glow
      ctx.shadowColor = '#FFD54F';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(door.x + 4, door.y + 4, door.width - 8, door.height - 8);
      ctx.shadowBlur = 0;

      // "EXIT" banner
      ctx.fillStyle = '#2E7D32';
      this.roundRect(ctx, door.x, door.y - 20, door.width, 16, 4, true, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EXIT OPEN', door.x + door.width / 2, door.y - 12);
    } else {
      // Locked Wooden Door
      ctx.fillStyle = '#5D4037';
      this.roundRect(ctx, door.x, door.y, door.width, door.height, 6, true, false);

      // Door panels
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(door.x + 6, door.y + 10, door.width - 12, 35);
      ctx.fillRect(door.x + 6, door.y + 52, door.width - 12, 40);

      // Keyhole
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(door.x + door.width / 2, door.y + 50, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(door.x + door.width / 2 - 2, door.y + 50, 4, 8);

      // "LOCKED" badge
      ctx.fillStyle = '#C62828';
      this.roundRect(ctx, door.x - 2, door.y - 20, door.width + 4, 16, 4, true, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NEED KEY', door.x + door.width / 2, door.y - 12);
    }

    // Entered players count badge
    const enteredCount = (door.enteredPlayerIds || []).length;
    if (door.isUnlocked) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      this.roundRect(ctx, door.x - 8, door.y + door.height + 6, door.width + 16, 20, 6, true, false);
      ctx.fillStyle = '#FFEB3B';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Cats: ${enteredCount}/${totalPlayers}`, door.x + door.width / 2, door.y + door.height + 17);
    }
  }

  drawKey(key) {
    if (!key) return;
    const ctx = this.ctx;
    const x = key.x;
    const y = key.y;

    ctx.save();
    ctx.translate(x, y);

    // Glowing aura
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 16;

    // Golden Key Ring
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, -6, 9, 0, Math.PI * 2);
    ctx.fill();

    // Inner cutout
    ctx.fillStyle = '#1A1C30';
    ctx.beginPath();
    ctx.arc(0, -6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Shaft & Teeth
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-2.5, 0, 5, 16);
    ctx.fillRect(2.5, 6, 6, 3);
    ctx.fillRect(2.5, 12, 5, 3);

    // Sparkle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-2, -8, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  drawPlayers(players, localPlayerId) {
    const ctx = this.ctx;
    const colors = [
      { hex: '#00E5FF', ear: '#00B8D4', shadow: '#00838F' },
      { hex: '#FF4081', ear: '#F50057', shadow: '#C2185B' },
      { hex: '#76FF03', ear: '#64DD17', shadow: '#33691E' },
      { hex: '#FF9100', ear: '#FF6D00', shadow: '#E65100' },
      { hex: '#D500F9', ear: '#AA00FF', shadow: '#6A1B9A' },
      { hex: '#FFEA00', ear: '#FFD600', shadow: '#F57F17' },
      { hex: '#2979FF', ear: '#2962FF', shadow: '#0D47A1' },
      { hex: '#FF1744', ear: '#D50000', shadow: '#B71C1C' },
    ];

    for (const p of players) {
      if (p.isDead || p.hasEnteredDoor) continue;

      const palette = colors[p.colorId % colors.length];
      const isLocal = p.id === localPlayerId;
      const facing = p.facing || 1;

      const w = p.width || 44;
      const h = p.height || 52;

      ctx.save();
      ctx.translate(p.x, p.y);

      // 1. Cat Ears
      ctx.fillStyle = palette.ear;
      ctx.strokeStyle = palette.shadow;
      ctx.lineWidth = 1.5;

      // Left ear
      ctx.beginPath();
      ctx.moveTo(4, 10);
      ctx.lineTo(11, -12);
      ctx.lineTo(20, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right ear
      ctx.beginPath();
      ctx.moveTo(w - 20, 6);
      ctx.lineTo(w - 11, -12);
      ctx.lineTo(w - 4, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner ear fluff
      ctx.fillStyle = '#FFEBEF';
      ctx.beginPath();
      ctx.moveTo(7, 6);
      ctx.lineTo(11, -6);
      ctx.lineTo(16, 5);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w - 16, 5);
      ctx.lineTo(w - 11, -6);
      ctx.lineTo(w - 7, 6);
      ctx.closePath();
      ctx.fill();

      // 2. Cat Body (Smooth rounded rectangle with crisp border)
      ctx.fillStyle = palette.hex;
      ctx.strokeStyle = palette.shadow;
      ctx.lineWidth = 2.5;
      this.roundRect(ctx, 0, 0, w, h - 6, 12, true, true);

      // 3. Cat Eyes (Big Kawaii / Anime Style)
      const eyeOffsetX = facing === 1 ? 4 : -4;
      const leftEyeX = 13 + eyeOffsetX;
      const rightEyeX = w - 13 + eyeOffsetX;
      const eyeY = 18;

      // Eye White sclera
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(leftEyeX, eyeY, 5.5, 7.5, 0, 0, Math.PI * 2);
      ctx.ellipse(rightEyeX, eyeY, 5.5, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Black Pupils
      ctx.fillStyle = '#111111';
      const pupilShift = facing === 1 ? 1.5 : -1.5;
      ctx.beginPath();
      ctx.ellipse(leftEyeX + pupilShift, eyeY, 3.5, 5.5, 0, 0, Math.PI * 2);
      ctx.ellipse(rightEyeX + pupilShift, eyeY, 3.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shiny specular white catchlights
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(leftEyeX + pupilShift - 1.2, eyeY - 2.5, 1.8, 0, Math.PI * 2);
      ctx.arc(rightEyeX + pupilShift - 1.2, eyeY - 2.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Blushing cheeks
      ctx.fillStyle = 'rgba(255, 64, 129, 0.45)';
      ctx.beginPath();
      ctx.ellipse(leftEyeX - 3, eyeY + 10, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(rightEyeX + 3, eyeY + 10, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cute little triangle nose
      ctx.fillStyle = '#FF4081';
      ctx.beginPath();
      ctx.moveTo(w / 2 + eyeOffsetX - 2.5, eyeY + 5);
      ctx.lineTo(w / 2 + eyeOffsetX + 2.5, eyeY + 5);
      ctx.lineTo(w / 2 + eyeOffsetX, eyeY + 8.5);
      ctx.closePath();
      ctx.fill();

      // 4. Little Paws / Feet (Walk cycle)
      ctx.fillStyle = palette.ear;
      const walk = p.animWalk || 0;
      const foot1Y = h - 8 + Math.sin(walk) * 3;
      const foot2Y = h - 8 + Math.sin(walk + Math.PI) * 3;
      this.roundRect(ctx, 5, foot1Y, 12, 7, 3, true, false);
      this.roundRect(ctx, w - 17, foot2Y, 12, 7, 3, true, false);

      // 5. Player Name Tag Badge (Positioned safely above ears)
      const name = p.name || 'Player';
      ctx.font = 'bold 12px sans-serif';
      const nameWidth = ctx.measureText(name).width;
      const tagW = Math.max(nameWidth + 16, 42);
      const tagH = 19;
      const tagX = w / 2 - tagW / 2;
      const tagY = -36;

      ctx.fillStyle = 'rgba(15, 17, 26, 0.9)';
      ctx.strokeStyle = palette.hex;
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, tagX, tagY, tagW, tagH, 6, true, true);

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, w / 2, tagY + 9.5);

      // 6. Local Player Pointer Chevron
      if (isLocal) {
        const bounce = Math.sin(this.time * 6) * 3;
        const arrowY = tagY - 12 + bounce;
        ctx.fillStyle = '#FFEA00';
        ctx.shadowColor = '#FFEA00';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(w / 2, arrowY + 7);
        ctx.lineTo(w / 2 - 6, arrowY);
        ctx.lineTo(w / 2 + 6, arrowY);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 7. Speech Bubble Emote
      if (p.emote) {
        this.drawEmoteBubble(ctx, w / 2, -74, p.emote);
      }

      ctx.restore();
    }
  }

  drawEmoteBubble(ctx, x, y, emoteId) {
    const emoteIcons = {
      hi: '👋 Hi!',
      jump: '⬆️ Jump!',
      push: '➡️ Push!',
      wait: '⚠️ Wait!',
      love: '💖 Love',
      oops: '😱 Oops!',
      yay: '🎉 Yay!',
    };
    const text = emoteIcons[emoteId] || emoteId;

    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    const textW = ctx.measureText(text).width;
    const bubbleW = textW + 16;
    const bubbleH = 24;

    // Speech bubble background
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    this.roundRect(ctx, x - bubbleW / 2, y - bubbleH / 2, bubbleW, bubbleH, 8, true, false);

    // Speech bubble tail
    ctx.beginPath();
    ctx.moveTo(x - 4, y + bubbleH / 2);
    ctx.lineTo(x, y + bubbleH / 2 + 6);
    ctx.lineTo(x + 4, y + bubbleH / 2);
    ctx.fill();

    // Text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);

    ctx.restore();
  }

  drawParticles(isStageCleared) {
    const ctx = this.ctx;

    // Stage Clear Confetti
    if (isStageCleared) {
      if (this.confettiParticles.length < 90) {
        const colors = ['#FF4081', '#00E5FF', '#76FF03', '#FFEA00', '#D500F9', '#FF9100'];
        for (let i = 0; i < 6; i++) {
          this.confettiParticles.push({
            x: Math.random() * this.virtualWidth,
            y: -10,
            vx: (Math.random() - 0.5) * 120,
            vy: 180 + Math.random() * 220,
            rot: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            w: 8 + Math.random() * 6,
            h: 12 + Math.random() * 8,
          });
        }
      }
    }

    // Update & draw confetti
    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.rot += p.rotSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();

      if (p.y > this.virtualHeight + 20) {
        this.confettiParticles.splice(i, 1);
      }
    }
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof radius === 'undefined') radius = 5;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}

window.GameRenderer = GameRenderer;
