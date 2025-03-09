/**
 * Game Constants
 * This file contains all configurable game parameters for easy adjustment
 */

// Using SnowBrawlConstants instead of GAME_CONSTANTS to avoid conflicts with built-in globals
const SnowBrawlConstants = {
    // Game Settings
    GAME_DURATIONS: {
        SHORT: 5 * 60, // 5 minutes in seconds
        MEDIUM: 10 * 60, // 10 minutes in seconds
        LONG: 15 * 60 // 15 minutes in seconds
    },
    NUM_AI_PLAYERS: 4,
    
    // Player Settings
    PLAYER: {
        INITIAL_HEALTH: 10,
        MOVEMENT_SPEED: 5,
        JUMP_FORCE: 10,
        HEIGHT: 1.0, // Player height in units
        RADIUS: 1.5, // Player collision radius
        CAMERA_HEIGHT: 1.6, // Camera height from player's feet
        LOOK_SENSITIVITY: 0.002,
        GRAVITY: 30,
        ACCELERATION: 80,
        DECELERATION: 10,
        HIT_EFFECT_DURATION: 500, // milliseconds for hit effect to last
        HIT_FLASH_COUNT: 3 // number of times to flash when hit
    },
    
    // Snowball Settings
    SNOWBALL: {
        INITIAL_COUNT: 10,
        DAMAGE: 1,
        RADIUS: 0.35,
        THROW_SPEED: 15,
        THROW_COOLDOWN: 500, // milliseconds
        MAX_THROW_DISTANCE: 200,
        GRAVITY: 9.8,
        AIR_RESISTANCE: 0.01,
        LIFETIME: 9000, // milliseconds before disappearing if no collision
        REPLENISH_RATE: 1, // How many snowballs replenished per second in igloo
        KNOCKBACK_FORCE: 2
    },
    
    // Igloo Settings
    IGLOO: {
        WIDTH: 5,
        HEIGHT: 5.4, // Increased to be 3x player height (3 * 1.8)
        DEPTH: 4,
        WALL_THICKNESS: 0.3,
        ENTRANCE_WIDTH: 3.5,
        ENTRANCE_HEIGHT: 4.5, // Increased entrance height
        SAFE_ZONE_RADIUS: 5, // Area around igloo where player is safe
        REPLENISH_RADIUS: 3 // Area where snowballs replenish
    },
    
    // Map Settings
    MAP: {
        WIDTH: 80,
        LENGTH: 80,
        WALL_HEIGHT: 7,
        GROUND_COLOR: 0x7B9095, // Non-white ground color for snowball visibility
        WALL_COLOR: 0xCCE6FF,
        SNOW_COLOR: 0xFFFFFF,
        NUM_OBSTACLES: 10, // Number of obstacles to place on the map
        OBSTACLE_MIN_SIZE: 1, // Minimum size of obstacles
        OBSTACLE_MAX_SIZE: 3  // Maximum size of obstacles
    },
    
    // Diamond Garden Settings
    DIAMOND_GARDEN: {
        CENTER_X: 0,
        CENTER_Z: 0,
        RADIUS: 10,
        WALL_HEIGHT: 1.5,
        INITIAL_DIAMONDS: 2,
        SPAWN_INTERVAL: 20000, // milliseconds
        DIAMOND_VALUE: 1,
        DIAMOND_SIZE: 0.5,
        DIAMOND_COLOR: 0x00FFFF,
        COLLECTION_RADIUS: 1.5 // How close player needs to be to collect
    },
    
    // Upgrade Settings
    UPGRADES: {
        SPEED: {
            COST: 1, // Diamond cost
            INCREMENT: 0.5, // How much speed increases per upgrade
            MAX_LEVEL: 5
        },
        DAMAGE: {
            COST: 1,
            INCREMENT: 1, // Additional damage per upgrade
            MAX_LEVEL: 3
        },
        RANGE: {
            COST: 1,
            INCREMENT: 5, // Additional throw distance per upgrade
            MAX_LEVEL: 3
        },
        SIZE: {
            COST: 1,
            INCREMENT: 0.05, // How much snowball size increases per upgrade
            MAX_LEVEL: 3
        },
        CAPACITY: {
            COST: 1,
            INCREMENT: 5, // Additional snowball capacity per upgrade
            MAX_LEVEL: 3
        }
    },
    
    // Scoring System
    SCORING: {
        HIT_POINTS: 10, // Points for hitting an opponent
        DIAMOND_POINTS: 50, // Points for collecting a diamond
        ELIMINATION_POINTS: 100 // Points for eliminating an opponent
    },
    
    // Physics Settings
    PHYSICS: {
        GRAVITY: 9.8,
        TIME_STEP: 1/60, // Physics update rate (60fps)
        COLLISION_ITERATIONS: 3 // Number of iterations for collision resolution
    },
    
    // UI Settings
    UI: {
        HUD_OPACITY: 0.8,
        HIT_INDICATOR_DURATION: 500, // milliseconds
        DIAMOND_INDICATOR_DURATION: 1000 // milliseconds
    },
    
    // AI Settings
    AI: {
        UPDATE_INTERVAL: 500, // milliseconds between AI decision updates
        SIGHT_RANGE: 50, // How far AI can "see" players
        REACTION_TIME: {
            MIN: 300, // Minimum reaction time in milliseconds
            MAX: 800 // Maximum reaction time in milliseconds
        },
        ACCURACY: {
            MIN: 0.6, // Minimum accuracy (0-1)
            MAX: 0.9 // Maximum accuracy (0-1)
        },
        AGGRESSION: {
            MIN: 0.5, // Minimum aggression (0-1)
            MAX: 0.99 // Maximum aggression (0-1)
        },
        DIAMOND_INTEREST: {
            MIN: 0.4, // Minimum interest in diamonds (0-1)
            MAX: 0.9 // Maximum interest in diamonds (0-1)
        },
        RETREAT_HEALTH_THRESHOLD: 0.3 // Percentage of health when AI retreats
    }
};

// Expose SnowBrawlConstants to the global scope as GAME_CONSTANTS to avoid conflicts with built-in objects
// and to maintain compatibility with existing code
window.GAME_CONSTANTS = SnowBrawlConstants;
