// shared/constants.js
// Shared game constants across server and client

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const PLAYER_WIDTH = 44;
const PLAYER_HEIGHT = 52;

const PHYSICS = {
  GRAVITY: 1200,          // px / s^2
  MAX_FALL_SPEED: 850,    // terminal velocity
  MOVE_SPEED: 230,        // px / s
  ACCEL: 2000,            // px / s^2
  DECEL: 2200,            // px / s^2
  JUMP_VELOCITY: -520,    // px / s
  TRAMPOLINE_BOUNCE: -780,// bounce impulse
  COYOTE_TIME: 0.12,      // 120ms coyote time
  JUMP_BUFFER: 0.12,      // 120ms jump buffer
  PUSH_SPEED: 110,        // speed when required pushers push a block
};

const PLAYER_COLORS = [
  { id: 0, name: 'Cyan Cat', hex: '#00E5FF', ear: '#00B8D4', face: '#006064' },
  { id: 1, name: 'Pink Cat', hex: '#FF4081', ear: '#F50057', face: '#880E4F' },
  { id: 2, name: 'Lime Cat', hex: '#76FF03', ear: '#64DD17', face: '#1B5E20' },
  { id: 3, name: 'Orange Cat', hex: '#FF9100', ear: '#FF6D00', face: '#E65100' },
  { id: 4, name: 'Purple Cat', hex: '#D500F9', ear: '#AA00FF', face: '#4A148C' },
  { id: 5, name: 'Yellow Cat', hex: '#FFEA00', ear: '#FFD600', face: '#F57F17' },
  { id: 6, name: 'Blue Cat', hex: '#2979FF', ear: '#2962FF', face: '#0D47A1' },
  { id: 7, name: 'Red Cat', hex: '#FF1744', ear: '#D50000', face: '#B71C1C' },
];

const EMOTES = [
  { id: 'hi', label: '👋 Hi!', icon: '👋' },
  { id: 'jump', label: '⬆️ Jump!', icon: '⬆️' },
  { id: 'push', label: '➡️ Push!', icon: '➡️' },
  { id: 'wait', label: '⚠️ Wait!', icon: '⚠️' },
  { id: 'love', label: '💖 Love', icon: '💖' },
  { id: 'oops', label: '😱 Oops!', icon: '😱' },
  { id: 'yay', label: '🎉 Yay!', icon: '🎉' },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    PHYSICS,
    PLAYER_COLORS,
    EMOTES,
  };
}
