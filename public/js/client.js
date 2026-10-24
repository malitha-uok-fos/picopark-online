// public/js/client.js
// Client Networking, Controls, and UI Management

(function () {
  const basePath = window.location.pathname.replace(/\/+$/, '');
  const socket = io({
    path: basePath ? basePath + '/socket.io' : '/socket.io',
    transports: ['polling', 'websocket']
  });

  socket.on('connect', () => {
    console.log('✅ Connected to game server! Socket ID:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('⚠️ Socket connection error:', err);
  });

  // State
  let localPlayerId = null;
  let currentRoomCode = null;
  let isHost = false;
  let selectedColorId = 0;
  let latestSnapshot = null;
  let renderer = null;

  // DOM Elements
  const lobbyScreen = document.getElementById('lobbyScreen');
  const gameScreen = document.getElementById('gameScreen');
  const playerNameInput = document.getElementById('playerNameInput');
  const colorPickerContainer = document.getElementById('colorPickerContainer');
  const createRoomBtn = document.getElementById('createRoomBtn');
  const roomCodeInput = document.getElementById('roomCodeInput');
  const joinRoomBtn = document.getElementById('joinRoomBtn');
  const copyInviteBtn = document.getElementById('copyInviteBtn');
  const roomBadge = document.getElementById('roomBadge');
  const stageTitle = document.getElementById('stageTitle');
  const stageHint = document.getElementById('stageHint');
  const stageSelect = document.getElementById('stageSelect');
  const restartStageBtn = document.getElementById('restartStageBtn');
  const muteBtn = document.getElementById('muteBtn');
  const toastNotification = document.getElementById('toastNotification');
  const clearOverlay = document.getElementById('clearOverlay');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');

  const canvas = document.getElementById('gameCanvas');
  renderer = new GameRenderer(canvas);

  // Character colors
  const COLORS = [
    { id: 0, hex: '#00E5FF', name: 'Cyan' },
    { id: 1, hex: '#FF4081', name: 'Pink' },
    { id: 2, hex: '#76FF03', name: 'Lime' },
    { id: 3, hex: '#FF9100', name: 'Orange' },
    { id: 4, hex: '#D500F9', name: 'Purple' },
    { id: 5, hex: '#FFEA00', name: 'Yellow' },
    { id: 6, hex: '#2979FF', name: 'Blue' },
    { id: 7, hex: '#FF1744', name: 'Red' },
  ];

  // 1. Initialize Color Picker
  COLORS.forEach((col, idx) => {
    const opt = document.createElement('div');
    opt.className = `color-option ${idx === 0 ? 'selected' : ''}`;
    opt.style.backgroundColor = col.hex;
    opt.title = col.name;
    opt.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach((el) => el.classList.remove('selected'));
      opt.classList.add('selected');
      selectedColorId = col.id;
      window.soundManager.init();
      window.soundManager.button();
    });
    colorPickerContainer.appendChild(opt);
  });

  // Check URL query param for room invite code (e.g., ?room=ABCD)
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('room');
  if (inviteCode) {
    roomCodeInput.value = inviteCode.toUpperCase().trim();
  }

  // 2. Audio toggle
  muteBtn.addEventListener('click', () => {
    window.soundManager.init();
    const isMuted = window.soundManager.toggleMute();
    muteBtn.innerHTML = isMuted ? '🔇 Sound: Off' : '🔊 Sound: On';
    showToast(isMuted ? 'Audio Muted' : 'Audio Unmuted');
  });

  // 3. Create Room
  createRoomBtn.addEventListener('click', () => {
    window.soundManager.init();
    window.soundManager.startMusic();
    const name = playerNameInput.value.trim() || 'Player 1';
    socket.emit('createRoom', { name, colorId: selectedColorId });
  });

  // 4. Join Room
  joinRoomBtn.addEventListener('click', () => {
    const code = roomCodeInput.value.trim().toUpperCase();
    if (!code) {
      showToast('Please enter a Room Code!');
      return;
    }
    window.soundManager.init();
    window.soundManager.startMusic();
    const name = playerNameInput.value.trim() || 'Player';
    socket.emit('joinRoom', { roomCode: code, name, colorId: selectedColorId });
  });

  // 5. Copy Invite Link
  copyInviteBtn.addEventListener('click', () => {
    if (!currentRoomCode) return;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoomCode}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showToast('✅ Invite link copied to clipboard!');
      copyInviteBtn.innerText = '✅ Copied!';
      setTimeout(() => {
        copyInviteBtn.innerText = '📋 Copy Link';
      }, 2000);
    }).catch(() => {
      prompt('Copy this invite link:', inviteUrl);
    });
  });

  // 6. Socket Events
  socket.on('roomCreated', (data) => {
    onJoinedRoom(data);
    showToast(`Room created: ${data.roomCode}`);
  });

  socket.on('roomJoined', (data) => {
    onJoinedRoom(data);
    showToast(`Joined room: ${data.roomCode}`);
  });

  socket.on('errorMsg', (data) => {
    showToast(data.message);
  });

  socket.on('hostPromoted', () => {
    isHost = true;
    stageSelect.disabled = false;
    restartStageBtn.disabled = false;
    showToast('You are now the Room Host!');
  });

  socket.on('chatMessage', (msg) => {
    appendChatMessage(msg);
  });

  socket.on('gameState', (snapshot) => {
    latestSnapshot = snapshot;

    // Trigger local sounds from server events
    if (snapshot.soundEvents && snapshot.soundEvents.length > 0) {
      snapshot.soundEvents.forEach((evt) => {
        if (evt.type === 'jump' && evt.playerId === localPlayerId) {
          window.soundManager.jump();
        } else if (evt.type === 'trampoline') {
          window.soundManager.trampoline();
        } else if (evt.type === 'buttonPress') {
          window.soundManager.button();
        } else if (evt.type === 'pushBlock') {
          window.soundManager.pushBlock();
        } else if (evt.type === 'keyCollect') {
          window.soundManager.key();
        } else if (evt.type === 'doorUnlock') {
          window.soundManager.doorUnlock();
        } else if (evt.type === 'playerEnterDoor') {
          window.soundManager.playerEnter();
        } else if (evt.type === 'playerDie' && evt.playerId === localPlayerId) {
          window.soundManager.die();
        } else if (evt.type === 'stageClear') {
          window.soundManager.stageClear();
        } else if (evt.type === 'emote') {
          window.soundManager.emote();
        }
      });
    }

    // Update HUD
    if (snapshot.levelData) {
      stageTitle.innerText = snapshot.levelData.title || `Stage ${snapshot.levelIndex + 1}`;
      stageHint.innerText = snapshot.levelData.hint || '';
      stageSelect.value = snapshot.levelIndex;
    }

    // Stage clear banner
    if (snapshot.isStageCleared) {
      clearOverlay.classList.remove('hidden');
    } else {
      clearOverlay.classList.add('hidden');
    }
  });

  function onJoinedRoom(data) {
    localPlayerId = data.playerId;
    currentRoomCode = data.roomCode;
    isHost = data.isHost;

    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    roomBadge.innerText = currentRoomCode;

    // Populate stage select dropdown
    stageSelect.innerHTML = '';
    for (let i = 0; i < data.levelsCount; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.innerText = `Stage ${i + 1}`;
      stageSelect.appendChild(opt);
    }
    stageSelect.disabled = !isHost;
    restartStageBtn.disabled = !isHost;
  }

  // Host stage selector
  stageSelect.addEventListener('change', () => {
    if (isHost) {
      socket.emit('selectLevel', { levelIndex: parseInt(stageSelect.value, 10) });
    }
  });

  // Host restart level
  restartStageBtn.addEventListener('click', () => {
    socket.emit('restartLevel');
  });

  // 7. Inputs (Keyboard + Mobile)
  const inputState = {
    left: false,
    right: false,
    jump: false,
    jumpHeld: false,
  };

  function sendInputs() {
    socket.emit('playerInput', inputState);
  }

  window.addEventListener('keydown', (e) => {
    // If chat input focused, ignore movement keys
    if (document.activeElement === chatInput) {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
      return;
    }

    // Chat focus on Enter key
    if (e.key === 'Enter') {
      chatInput.focus();
      e.preventDefault();
      return;
    }

    // Emote shortcuts (keys 1-7)
    const emoteKeys = ['1', '2', '3', '4', '5', '6', '7'];
    const emoteIds = ['hi', 'jump', 'push', 'wait', 'love', 'oops', 'yay'];
    if (emoteKeys.includes(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      socket.emit('sendEmote', { emoteId: emoteIds[idx] });
      return;
    }

    let changed = false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      if (!inputState.left) {
        inputState.left = true;
        changed = true;
      }
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      if (!inputState.right) {
        inputState.right = true;
        changed = true;
      }
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
      if (!inputState.jumpHeld) {
        inputState.jump = true;
        inputState.jumpHeld = true;
        changed = true;
      }
      e.preventDefault();
    }

    if (changed) sendInputs();
  });

  window.addEventListener('keyup', (e) => {
    if (document.activeElement === chatInput) return;

    let changed = false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      if (inputState.left) {
        inputState.left = false;
        changed = true;
      }
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      if (inputState.right) {
        inputState.right = false;
        changed = true;
      }
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
      if (inputState.jumpHeld) {
        inputState.jumpHeld = false;
        inputState.jump = false;
        changed = true;
      }
      e.preventDefault();
    }

    if (changed) sendInputs();
  });

  // Emote Wheel Buttons
  document.querySelectorAll('.emote-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const emoteId = btn.getAttribute('data-emote');
      socket.emit('sendEmote', { emoteId });
    });
  });

  // Mobile Touch Controls
  const setupTouchBtn = (elemId, onPress, onRelease) => {
    const el = document.getElementById(elemId);
    if (!el) return;
    const start = (e) => {
      e.preventDefault();
      onPress();
      sendInputs();
    };
    const end = (e) => {
      e.preventDefault();
      onRelease();
      sendInputs();
    };
    el.addEventListener('touchstart', start);
    el.addEventListener('touchend', end);
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
  };

  setupTouchBtn('btnTouchLeft', () => { inputState.left = true; }, () => { inputState.left = false; });
  setupTouchBtn('btnTouchRight', () => { inputState.right = true; }, () => { inputState.right = false; });
  setupTouchBtn('btnTouchJump', () => { inputState.jump = true; inputState.jumpHeld = true; }, () => { inputState.jump = false; inputState.jumpHeld = false; });

  // 8. Chat
  function sendChatMessage() {
    const text = chatInput.value.trim();
    if (text) {
      socket.emit('sendChat', { text });
      chatInput.value = '';
    }
    chatInput.blur();
  }

  sendChatBtn.addEventListener('click', sendChatMessage);

  function appendChatMessage(msg) {
    const row = document.createElement('div');
    row.className = `chat-msg ${msg.isSystem ? 'system' : ''}`;
    if (msg.isSystem) {
      row.innerHTML = `<span class="sys-text">🔔 ${escapeHtml(msg.text)}</span>`;
    } else {
      const col = COLORS[msg.colorId % COLORS.length].hex;
      row.innerHTML = `<span class="sender" style="color: ${col}">${escapeHtml(msg.sender)}:</span> <span class="content">${escapeHtml(msg.text)}</span>`;
    }
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  // Toast Notification helper
  let toastTimer = null;
  function showToast(text) {
    toastNotification.innerText = text;
    toastNotification.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 2800);
  }

  // 9. Main Client Render Loop
  function gameLoop() {
    if (latestSnapshot) {
      renderer.render(latestSnapshot, localPlayerId);
    }
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);

})();
