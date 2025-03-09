/**
 * Game class for SnowBrawl game
 * Handles core game logic and state
 * Exposed as a global object for use throughout the application
 */

// Define Game as a class and then expose it to the global scope
class GameClass {
    // Static properties for global access
    static scene = null;
    static camera = null;
    static renderer = null;
    static physics = null;
    static player = null;
    static aiPlayers = [];
    static snowballs = [];
    static map = null;
    static ui = null;
    static isRunning = false;
    static gameDuration = GAME_CONSTANTS.GAME_DURATIONS.SHORT; // Default to 5 minutes
    static timeRemaining = 0;
    static lastUpdateTime = 0;
    
    /**
     * Initialize the game
     */
    static init() {
        console.log('Initializing game...');
        
        try {
            // Simple check for THREE.js
            if (typeof THREE === 'undefined') {
                console.error('THREE is not defined. Make sure three.js is loaded before initializing the game.');
                throw new Error('THREE is not defined');
            }
            
            // Create scene - this is the most important step
            GameClass.scene = new THREE.Scene();
            
            if (!GameClass.scene) {
                throw new Error('Failed to create scene');
            }
            
            // Set scene background
            GameClass.scene.background = new THREE.Color(0x87CEEB); // Sky blue
            console.log('Scene created successfully with sky blue background');
            
            // Create camera
            GameClass.camera = new THREE.PerspectiveCamera(
                75, 
                window.innerWidth / window.innerHeight, 
                0.1, 
                1000
            );
            console.log('Camera created successfully');
            
            // Create renderer
            GameClass.renderer = new THREE.WebGLRenderer({ antialias: true });
            GameClass.renderer.setSize(window.innerWidth, window.innerHeight);
            GameClass.renderer.shadowMap.enabled = true;
            GameClass.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.getElementById('game-container').appendChild(GameClass.renderer.domElement);
            console.log('Renderer created successfully');
            
            // Verify scene exists before creating physics
            if (!GameClass.scene) {
                throw new Error('Scene is undefined before creating physics');
            }
            
            // Create physics system if Physics class is available
            if (typeof Physics !== 'undefined') {
                try {
                    GameClass.physics = new Physics(GameClass.scene);
                    console.log('Physics system created successfully');
                } catch (physicsError) {
                    console.error('Error creating physics system:', physicsError);
                    GameClass.physics = null;
                }
            } else {
                console.warn('Physics class is not defined, skipping physics system creation');
                GameClass.physics = null;
            }
            
            // Ensure scene exists before creating map
            if (!GameClass.scene) {
                console.log('Creating new scene before map creation');
                GameClass.scene = new THREE.Scene();
                GameClass.scene.background = new THREE.Color(0x87CEEB); // Sky blue
            }
            
            // Try to create a map instance using GameMap class
            console.log('Attempting to create game map with scene:', GameClass.scene);
            
            try {
                // Check if our GameMap class is available
                if (typeof GameMap === 'function') {
                    console.log('GameMap class is available');
                    GameClass.map = new GameMap(GameClass.scene);
                    
                    // Register map with physics system if available
                    if (GameClass.physics) {
                        try {
                            GameClass.map.registerWithPhysics(GameClass.physics);
                            console.log('Map registered with physics system');
                        } catch (registerError) {
                            console.error('Error registering map with physics:', registerError);
                            createFallbackMap();
                        }
                    } else {
                        console.warn('Physics system not available, map not registered');
                    }
                } else {
                    console.warn('GameMap class is not defined, creating fallback map');
                    createFallbackMap();
                }
            } catch (mapError) {
                console.error('Error creating map:', mapError);
                createFallbackMap();
            }
            
            // Function to create a fallback map if GameMap is not available
            function createFallbackMap() {
                console.log('Creating fallback map with scene:', GameClass.scene);
                GameClass.map = {
                    scene: GameClass.scene,
                    ground: null,
                    walls: [],
                    
                    // Method to register with physics system
                    registerWithPhysics: function(physics) {
                        if (!physics) {
                            console.warn('No physics system provided to map');
                            return;
                        }
                        
                        console.log('Registering map elements with physics system');
                        
                        // Create a simple ground if needed
                        if (!this.ground) {
                            this.createGround();
                        }
                        
                        // Register ground with physics if it exists
                        if (this.ground) {
                            physics.registerBody(this.ground);
                        }
                    },
                    
                    // Method to create a simple ground
                    createGround: function() {
                        try {
                            if (typeof THREE !== 'undefined') {
                                const groundGeometry = new THREE.PlaneGeometry(100, 100);
                                const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x7B9095 });
                                this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
                                this.ground.rotation.x = -Math.PI / 2;
                                this.ground.position.y = 0;
                                this.scene.add(this.ground);
                                console.log('Created simple ground for map');
                            }
                        } catch (e) {
                            console.error('Error creating ground:', e);
                        }
                    }
                };
                
                // Create the ground immediately
                GameClass.map.createGround();
                console.log('Map created successfully');
                
                // Register with physics if available
                if (GameClass.physics) {
                    try {
                        GameClass.map.registerWithPhysics(GameClass.physics);
                        console.log('Map registered with physics system');
                    } catch (e) {
                        console.error('Error registering map with physics:', e);
                    }
                }
            }
            
            // Map creation is now handled directly above
        } catch (error) {
            console.error('Error initializing game:', error);
            throw error; // Re-throw to stop initialization if there's a critical error
        }
        
        // Create UI
        try {
            // Use SnowBrawlUI instead of UI since we renamed the class
            if (typeof SnowBrawlUI === 'function') {
                GameClass.ui = new SnowBrawlUI();
                console.log('UI created successfully using SnowBrawlUI');
            } else if (typeof UI === 'function') {
                // Fallback to UI if SnowBrawlUI is not available
                GameClass.ui = new UI();
                console.log('UI created successfully using UI');
            } else {
                console.error('Neither SnowBrawlUI nor UI is defined');
            }
            GameClass.ui.showStartMenu();
            console.log('Start menu shown successfully');
            
            // Set up pointer lock controls
            try {
                // Check if THREE.PointerLockControls exists and is a constructor
                if (typeof THREE.PointerLockControls === 'function') {
                    GameClass.controls = new THREE.PointerLockControls(GameClass.camera, document.body);
                    console.log('Pointer lock controls created successfully');
                } else {
                    console.error('THREE.PointerLockControls is not available as a constructor');
                    // Fallback to a basic control mechanism if needed
                    GameClass.controls = {
                        isLocked: false,
                        lock: function() { this.isLocked = true; },
                        unlock: function() { this.isLocked = false; },
                        addEventListener: function() {},
                        getObject: function() { return GameClass.camera; }
                    };
                    console.log('Using fallback controls');
                }
            } catch (controlError) {
                console.error('Error creating pointer lock controls:', controlError);
                // Fallback to a basic control mechanism
                GameClass.controls = {
                    isLocked: false,
                    lock: function() { this.isLocked = true; },
                    unlock: function() { this.isLocked = false; },
                    addEventListener: function() {},
                    getObject: function() { return GameClass.camera; }
                };
                console.log('Using fallback controls due to error');
            }
            
            // Handle window resize
            window.addEventListener('resize', () => GameClass.handleResize());
            console.log('Window resize handler set up');
            
            // Start animation loop
            GameClass.animate();
            console.log('Animation loop started');
        } catch (error) {
            console.error('Error setting up UI and controls:', error);
        }
    }
    
    /**
     * Start the game
     */
    static start() {
        console.log('Starting game...');
        
        try {
            // Ensure we have a valid scene
            if (!GameClass.scene) {
                console.log('Creating new scene in start method');
                GameClass.scene = new THREE.Scene();
                GameClass.scene.background = new THREE.Color(0x87CEEB); // Sky blue
            }
            
            // Make sure UI exists
            if (!GameClass.ui) {
                console.log('Creating UI in start method');
                GameClass.ui = new UI();
            }
            
            // Hide start menu
            if (GameClass.ui && GameClass.ui.hideStartMenu) {
                GameClass.ui.hideStartMenu();
                console.log('Start menu hidden');
            } else {
                console.warn('Could not hide start menu - UI or hideStartMenu method not available');
            }
            
            // Ensure camera exists
            if (!GameClass.camera) {
                console.log('Creating camera in start method');
                GameClass.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            }
            
            if (!GameClass.controls) {
                console.log('Creating controls as they were not initialized');
                GameClass.controls = new THREE.PointerLockControls(GameClass.camera, document.body);
            }
            
            // Create player
            console.log('Creating player with scene:', GameClass.scene);
            GameClass.player = new Player(
                'player',
                GameClass.scene,
                GameClass.camera,
                GameClass.controls,
                true // isHuman
            );
            
            console.log('Player created successfully');
            
            // Position player
            GameClass.player.position.set(0, 1, 0);
            console.log('Player positioned at (0, 1, 0)');
            
            // Calculate positions around the map for igloos
            const positions = Utils.calculateIglooPositions(GAME_CONSTANTS.NUM_AI_PLAYERS + 1);
            
            // Set igloo position for human player
            if (typeof GameClass.player.setIglooPosition === 'function') {
                GameClass.player.setIglooPosition(positions[0]);
                console.log('Human player igloo position set to:', positions[0]);
            }
            
            // Register player with physics system
            if (!GameClass.physics) {
                console.error('Physics system is not initialized');
                throw new Error('Physics system is not initialized');
            }
            GameClass.physics.registerCollider(GameClass.player, 'players');
            console.log('Player registered with physics system');
            
            // Create AI players
            GameClass.createAIPlayers();
            console.log('AI players created');
            
            // Set time remaining
            GameClass.timeRemaining = GameClass.gameDuration;
            GameClass.ui.updateTime(GameClass.timeRemaining);
            console.log(`Time remaining set to ${GameClass.timeRemaining} seconds`);
            
            // Set game as running
            GameClass.isRunning = true;
            GameClass.lastUpdateTime = performance.now();
            console.log('Game set to running state');
            
            // Set up pointer lock event listeners
            GameClass.setupPointerLock();
            console.log('Pointer lock event listeners set up');
            
            // Lock pointer for camera control (after a short delay to ensure UI is updated)
            setTimeout(() => {
                try {
                    if (!GameClass.controls) {
                        console.error('Controls are not initialized');
                        return;
                    }
                    GameClass.controls.lock();
                    console.log('Controls locked successfully');
                } catch (error) {
                    console.error('Error locking controls:', error);
                }
            }, 200); // Increased delay to ensure UI is fully updated
            
            console.log('Game started successfully!');
        } catch (error) {
            console.error('Error starting game:', error);
        }
    }
    
    /**
     * Create AI players
     */
    static createAIPlayers() {
        const numAI = GAME_CONSTANTS.NUM_AI_PLAYERS;
        console.log(`Creating ${numAI} AI players...`);
        
        try {
            // Clear existing AI players array
            GameClass.aiPlayers = [];
            
            // Calculate positions around the map
            const positions = Utils.calculateIglooPositions(numAI + 1); // +1 for human player
            
            // Create AI players
            for (let i = 0; i < numAI; i++) {
                // Create AI player
                let ai;
                try {
                    // Try to create AIPlayer if class exists
                    ai = new AIPlayer(
                        `ai-${i}`,
                        GameClass.scene,
                        null, // No camera for AI
                        null  // No controls for AI
                    );
                } catch (error) {
                    console.warn(`AIPlayer creation failed, using Player class instead: ${error.message}`);
                    // Fallback to Player class
                    ai = new Player(
                        `ai-${i}`,
                        GameClass.scene,
                        null, // No camera for AI
                        null, // No controls for AI
                        false // Not human
                    );
                }
                
                // Position AI player (skip first position for human player)
                const position = positions[i + 1];
                ai.position.set(position.x, 1, position.z);
                
                // Set igloo position if the method exists
                if (typeof ai.setIglooPosition === 'function') {
                    ai.setIglooPosition(position);
                }
                
                // Register AI player with physics system
                GameClass.physics.registerCollider(ai, 'players');
                
                // Add to AI players array
                GameClass.aiPlayers.push(ai);
                
                console.log(`AI player ${i} created successfully`);
            }
            
            console.log(`Created ${GameClass.aiPlayers.length} AI players successfully`);
            
            // Set human player's igloo position if the method exists
            if (GameClass.player && typeof GameClass.player.setIglooPosition === 'function') {
                GameClass.player.setIglooPosition(positions[0]);
            }
            
            console.log('AI players created successfully!');
        } catch (error) {
            console.error('Error creating AI players:', error);
            // Continue without AI players if there's an error
        }
    }
    
    /**
     * Set up pointer lock event listeners
     */
    static setupPointerLock() {
        console.log('Setting up pointer lock event listeners');
        
        // Lock change event
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === document.body) {
                // Pointer is locked, game is active
                console.log('Pointer locked, showing crosshair');
                GameClass.ui.toggleCrosshair(true);
            } else {
                // Pointer is unlocked, game is paused
                console.log('Pointer unlocked, hiding crosshair');
                GameClass.ui.toggleCrosshair(false);
            }
        });
        
        // Click event to request pointer lock
        document.getElementById('game-container').addEventListener('click', () => {
            if (GameClass.isRunning && !document.pointerLockElement) {
                console.log('Game container clicked, locking controls');
                GameClass.controls.lock();
            }
        });
        
        console.log('Pointer lock event listeners set up successfully');
    }
    
    /**
     * Handle window resize
     */
    static handleResize() {
        console.log('Handling window resize');
        
        if (!GameClass.camera || !GameClass.renderer) {
            console.error('Camera or renderer not initialized');
            return;
        }
        
        GameClass.camera.aspect = window.innerWidth / window.innerHeight;
        GameClass.camera.updateProjectionMatrix();
        GameClass.renderer.setSize(window.innerWidth, window.innerHeight);
        
        console.log('Window resize handled successfully');
    }
    
    /**
     * Animation loop
     */
    static animate() {
        requestAnimationFrame(() => GameClass.animate());
        
        try {
            const currentTime = performance.now();
            
            // Check if lastUpdateTime is initialized
            if (!GameClass.lastUpdateTime) {
                GameClass.lastUpdateTime = currentTime;
                console.log('Initialized lastUpdateTime');
            }
            
            const deltaTime = Math.min((currentTime - GameClass.lastUpdateTime) / 1000, 0.1); // Cap at 0.1 seconds
            GameClass.lastUpdateTime = currentTime;
            
            // Update game if running
            if (GameClass.isRunning) {
                GameClass.update(deltaTime);
            }
            
            // Verify all required objects exist before rendering
            if (!GameClass.renderer || !GameClass.scene || !GameClass.camera) {
                console.warn('Missing required objects for rendering');
                return;
            }
            
            // Render scene
            GameClass.renderer.render(GameClass.scene, GameClass.camera);
        } catch (error) {
            console.error('Error in animation loop:', error);
        }
    }
    
    /**
     * Update game state
     * @param {number} deltaTime - Time since last update in seconds
     */
    static update(deltaTime) {
        try {
            // Verify physics exists
            if (!GameClass.physics) {
                console.warn('Physics system is not initialized');
                return;
            }
            
            // Update physics
            GameClass.physics.update(deltaTime);
            
            // Update player
            if (GameClass.player && GameClass.player.isAlive) {
                GameClass.player.update(deltaTime);
            }
            
            // Update AI players
            if (!GameClass.aiPlayers) {
                GameClass.aiPlayers = [];
                console.log('Initialized aiPlayers array');
            }
            
            for (const ai of GameClass.aiPlayers) {
                if (ai && ai.isAlive) {
                    ai.update(deltaTime);
                }
            }
            
            // Update snowballs
            if (!GameClass.snowballs) {
                GameClass.snowballs = [];
                console.log('Initialized snowballs array');
            }
            
            for (let i = GameClass.snowballs.length - 1; i >= 0; i--) {
                const snowball = GameClass.snowballs[i];
                if (snowball) {
                    snowball.update(deltaTime);
                }
            }
            
            // Update time remaining
            if (typeof GameClass.timeRemaining === 'number') {
                GameClass.timeRemaining -= deltaTime;
                
                if (GameClass.ui) {
                    GameClass.ui.updateTime(Math.max(0, GameClass.timeRemaining));
                }
                
                // Check if time is up
                if (GameClass.timeRemaining <= 0) {
                    GameClass.endGame();
                }
            }
        } catch (error) {
            console.error('Error in update method:', error);
        }
    }
    
    /**
     * End the game
     */
    static endGame() {
        GameClass.isRunning = false;
        
        // Determine winner based on who's still alive
        let winner = null;
        let alivePlayers = 0;
        
        if (GameClass.player.isAlive) {
            winner = GameClass.player;
            alivePlayers++;
        }
        
        for (const ai of GameClass.aiPlayers) {
            if (ai.isAlive) {
                winner = ai;
                alivePlayers++;
            }
        }
        
        // If player is the only one alive, they win
        if (alivePlayers === 1 && winner === GameClass.player) {
            GameClass.ui.showGameOver(true);
        } 
        // If player is dead, they lose
        else if (!GameClass.player.isAlive) {
            GameClass.ui.showGameOver(false);
        }
        // If time ran out, determine winner by score
        else if (GameClass.timeRemaining <= 0) {
            // Get all players
            const allPlayers = [GameClass.player, ...GameClass.aiPlayers];
            
            // Sort by score
            allPlayers.sort((a, b) => b.score - a.score);
            
            // Player wins if they have the highest score
            const isWinner = allPlayers[0] === GameClass.player;
            GameClass.ui.showGameOver(isWinner);
        }
        
        // Unlock pointer
        GameClass.controls.unlock();
    }
    
    /**
     * Check if game is over (only one player left)
     */
    static checkGameOver() {
        let alivePlayers = 0;
        
        if (GameClass.player.isAlive) {
            alivePlayers++;
        }
        
        for (const ai of GameClass.aiPlayers) {
            if (ai.isAlive) {
                alivePlayers++;
            }
        }
        
        // If only one player is left, end the game
        if (alivePlayers <= 1) {
            GameClass.endGame();
        }
    }
    
    /**
     * Restart the game
     */
    static restart() {
        // Clear existing game objects
        GameClass.clearGameObjects();
        
        // Start new game
        GameClass.start();
    }
    
    /**
     * Clear all game objects
     */
    static clearGameObjects() {
        // Remove player
        if (GameClass.player) {
            GameClass.physics.unregisterCollider(GameClass.player, 'players');
            GameClass.scene.remove(GameClass.player.mesh);
            GameClass.player = null;
        }
        
        // Remove AI players
        for (const ai of GameClass.aiPlayers) {
            GameClass.physics.unregisterCollider(ai, 'players');
            GameClass.scene.remove(ai.mesh);
        }
        GameClass.aiPlayers = [];
        
        // Remove snowballs
        for (const snowball of GameClass.snowballs) {
            GameClass.physics.unregisterCollider(snowball, 'snowballs');
            GameClass.scene.remove(snowball.mesh);
        }
        GameClass.snowballs = [];
    }
    
    /**
     * Set game duration
     * @param {number} minutes - Duration in minutes
     */
    static setDuration(minutes) {
        console.log(`Setting game duration to ${minutes} minutes`);
        
        switch (minutes) {
            case 5:
                GameClass.gameDuration = GAME_CONSTANTS.GAME_DURATIONS.SHORT;
                break;
            case 10:
                GameClass.gameDuration = GAME_CONSTANTS.GAME_DURATIONS.MEDIUM;
                break;
            case 15:
                GameClass.gameDuration = GAME_CONSTANTS.GAME_DURATIONS.LONG;
                break;
            default:
                GameClass.gameDuration = GAME_CONSTANTS.GAME_DURATIONS.SHORT;
        }
        
        // Update UI time display
        if (GameClass.ui) {
            GameClass.ui.updateTime(GameClass.gameDuration);
        }
    }
    
    /**
     * Get player by ID
     * @param {string} id - Player ID
     * @returns {Player|null} Player object or null if not found
     */
    static getPlayerById(id) {
        if (GameClass.player && GameClass.player.id === id) {
            return GameClass.player;
        }
        
        for (const ai of GameClass.aiPlayers) {
            if (ai.id === id) {
                return ai;
            }
        }
        
        return null;
    }
}

// Expose GameClass to the global scope as Game to avoid conflicts with built-in objects
// and to maintain compatibility with existing code
window.Game = GameClass;
