// shared/levels.js
// Multi-stage cooperative puzzle levels

const LEVELS = [
  {
    id: 1,
    title: "Stage 1: Getting Started",
    hint: "Stack on each other's heads & push together!",
    spawn: { x: 80, y: 550 },
    platforms: [
      // Ground
      { x: 0, y: 640, width: 1280, height: 80, color: "#2B2D42" },
      // Left start wall
      { x: 0, y: 0, width: 30, height: 640, color: "#2B2D42" },
      // Right end wall
      { x: 1250, y: 0, width: 30, height: 640, color: "#2B2D42" },
      // First step ledge
      { x: 280, y: 550, width: 180, height: 90, color: "#3D405B" },
      // High platform with Key
      { x: 580, y: 390, width: 220, height: 25, color: "#3D405B" },
      // Final platform near door
      { x: 980, y: 490, width: 270, height: 150, color: "#3D405B" },
    ],
    pushBlocks: [
      {
        id: "pb_1_1",
        x: 480,
        y: 560,
        width: 70,
        height: 80,
        requiredPushers: 2, // Needs at least 2 players pushing together (or 1 if solo)
        label: "PUSH x2",
        color: "#E07A5F"
      }
    ],
    buttons: [
      // Button on high platform that opens gate to door
      {
        id: "btn_1_1",
        x: 670,
        y: 382,
        width: 44,
        height: 8,
        targetDoor: "gate_1_1",
        color: "#F4A261"
      }
    ],
    gates: [
      {
        id: "gate_1_1",
        x: 960,
        y: 340,
        width: 20,
        height: 150,
        color: "#E76F51",
        isOpen: false,
        closedY: 340,
        openY: 190
      }
    ],
    trampolines: [],
    hazards: [],
    movingPlatforms: [],
    key: { x: 740, y: 340 },
    door: { x: 1120, y: 390, width: 56, height: 100 }
  },

  {
    id: 2,
    title: "Stage 2: The High Wall & Button Bridge",
    hint: "Hold the button so your teammates can cross!",
    spawn: { x: 70, y: 550 },
    platforms: [
      // Ground left
      { x: 0, y: 640, width: 380, height: 80, color: "#2B2D42" },
      // Ground right
      { x: 880, y: 640, width: 400, height: 80, color: "#2B2D42" },
      // Walls
      { x: 0, y: 0, width: 30, height: 640, color: "#2B2D42" },
      { x: 1250, y: 0, width: 30, height: 640, color: "#2B2D42" },
      // Tall barrier that requires stacking or push block
      { x: 340, y: 440, width: 40, height: 200, color: "#3D405B" },
      // Middle resting ledge
      { x: 440, y: 380, width: 140, height: 25, color: "#3D405B" },
      // High ledge on right
      { x: 920, y: 440, width: 330, height: 30, color: "#3D405B" },
    ],
    pushBlocks: [
      {
        id: "pb_2_1",
        x: 180,
        y: 560,
        width: 80,
        height: 80,
        requiredPushers: 2,
        label: "PUSH x2",
        color: "#E07A5F"
      }
    ],
    buttons: [
      // Button on middle ledge extends the bridge across the spike chasm
      {
        id: "btn_2_1",
        x: 480,
        y: 372,
        width: 50,
        height: 8,
        targetPlatform: "mp_bridge_1",
        color: "#81B29A"
      }
    ],
    gates: [],
    movingPlatforms: [
      // Bridge that appears across the gap when button is pressed
      {
        id: "mp_bridge_1",
        x: 580,
        y: 440,
        width: 340,
        height: 25,
        color: "#81B29A",
        activeY: 440,
        inactiveY: 690, // Hidden below spikes when not pressed
        controlledByButton: "btn_2_1"
      }
    ],
    trampolines: [],
    hazards: [
      // Spike pit in middle gap
      {
        id: "spikes_2_1",
        x: 380,
        y: 645,
        width: 500,
        height: 25,
        type: "spikes",
        color: "#E63946"
      }
    ],
    key: { x: 500, y: 310 },
    door: { x: 1140, y: 340, width: 56, height: 100 }
  },

  {
    id: 3,
    title: "Stage 3: Trampoline Bounce!",
    hint: "Use spring pads to launch high and reach the upper cliffs!",
    spawn: { x: 80, y: 550 },
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80, color: "#2B2D42" },
      { x: 0, y: 0, width: 30, height: 640, color: "#2B2D42" },
      { x: 1250, y: 0, width: 30, height: 640, color: "#2B2D42" },
      // Floating islands
      { x: 260, y: 470, width: 140, height: 25, color: "#3D405B" },
      { x: 520, y: 360, width: 180, height: 25, color: "#3D405B" },
      { x: 820, y: 260, width: 160, height: 25, color: "#3D405B" },
      // High exit roof
      { x: 1040, y: 380, width: 210, height: 260, color: "#3D405B" }
    ],
    pushBlocks: [
      {
        id: "pb_3_1",
        x: 560,
        y: 280,
        width: 70,
        height: 80,
        requiredPushers: 2,
        label: "PUSH x2",
        color: "#E07A5F"
      }
    ],
    buttons: [
      {
        id: "btn_3_1",
        x: 880,
        y: 252,
        width: 44,
        height: 8,
        targetDoor: "gate_3_1",
        color: "#F4A261"
      }
    ],
    gates: [
      {
        id: "gate_3_1",
        x: 1030,
        y: 230,
        width: 20,
        height: 150,
        color: "#E76F51",
        isOpen: false,
        closedY: 230,
        openY: 90
      }
    ],
    trampolines: [
      // Spring pads
      { x: 150, y: 622, width: 70, height: 18, bouncePower: -820 },
      { x: 420, y: 622, width: 70, height: 18, bouncePower: -840 },
      { x: 730, y: 622, width: 70, height: 18, bouncePower: -850 }
    ],
    hazards: [],
    movingPlatforms: [],
    key: { x: 890, y: 190 },
    door: { x: 1120, y: 280, width: 56, height: 100 }
  },

  {
    id: 4,
    title: "Stage 4: Laser Maze & Heavy Box",
    hint: "Push the heavy block to block lasers or hold switches!",
    spawn: { x: 80, y: 550 },
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80, color: "#2B2D42" },
      { x: 0, y: 0, width: 30, height: 640, color: "#2B2D42" },
      { x: 1250, y: 0, width: 30, height: 640, color: "#2B2D42" },
      // Ledges
      { x: 300, y: 460, width: 200, height: 25, color: "#3D405B" },
      { x: 620, y: 460, width: 220, height: 25, color: "#3D405B" },
      { x: 960, y: 460, width: 290, height: 180, color: "#3D405B" },
    ],
    pushBlocks: [
      {
        id: "pb_4_1",
        x: 140,
        y: 560,
        width: 90,
        height: 80,
        requiredPushers: 2,
        label: "PUSH x2",
        color: "#E07A5F"
      }
    ],
    buttons: [
      // Pressure plate on the floor that disables laser 1
      {
        id: "btn_4_1",
        x: 230,
        y: 632,
        width: 60,
        height: 8,
        targetHazard: "laser_4_1",
        color: "#06D6A0"
      },
      // Button on middle ledge that disables laser 2
      {
        id: "btn_4_2",
        x: 700,
        y: 452,
        width: 50,
        height: 8,
        targetHazard: "laser_4_2",
        color: "#118AB2"
      }
    ],
    gates: [],
    trampolines: [
      { x: 530, y: 622, width: 60, height: 18, bouncePower: -800 },
      { x: 870, y: 622, width: 60, height: 18, bouncePower: -800 }
    ],
    hazards: [
      {
        id: "laser_4_1",
        x: 500,
        y: 460,
        width: 14,
        height: 180,
        type: "laser",
        color: "#FF0055",
        active: true
      },
      {
        id: "laser_4_2",
        x: 840,
        y: 460,
        width: 14,
        height: 180,
        type: "laser",
        color: "#FF0055",
        active: true
      }
    ],
    movingPlatforms: [],
    key: { x: 720, y: 390 },
    door: { x: 1100, y: 360, width: 56, height: 100 }
  },

  {
    id: 5,
    title: "Stage 5: The Grand Team Tower",
    hint: "Form a high cat tower! All players must enter the door to win!",
    spawn: { x: 80, y: 550 },
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80, color: "#2B2D42" },
      { x: 0, y: 0, width: 30, height: 640, color: "#2B2D42" },
      { x: 1250, y: 0, width: 30, height: 640, color: "#2B2D42" },
      // High steps
      { x: 260, y: 520, width: 100, height: 120, color: "#3D405B" },
      { x: 420, y: 420, width: 100, height: 220, color: "#3D405B" },
      { x: 620, y: 320, width: 120, height: 320, color: "#3D405B" },
      { x: 840, y: 220, width: 120, height: 420, color: "#3D405B" },
      { x: 1040, y: 140, width: 210, height: 500, color: "#3D405B" }
    ],
    pushBlocks: [
      {
        id: "pb_5_1",
        x: 100,
        y: 560,
        width: 80,
        height: 80,
        requiredPushers: 2,
        label: "PUSH x2",
        color: "#E07A5F"
      }
    ],
    buttons: [],
    gates: [],
    trampolines: [
      { x: 540, y: 622, width: 60, height: 18, bouncePower: -840 },
      { x: 760, y: 622, width: 60, height: 18, bouncePower: -850 }
    ],
    hazards: [],
    movingPlatforms: [],
    key: { x: 890, y: 150 },
    door: { x: 1120, y: 40, width: 56, height: 100 }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LEVELS };
}
