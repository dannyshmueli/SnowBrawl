/**
 * GameMap class for SnowBrawl game
 * Handles creation of the game environment
 * (Renamed from Map to avoid conflicts with built-in JavaScript Map class)
 */

// Using SnowBrawlMap instead of GameMap to avoid conflicts with built-in globals
class SnowBrawlMap {
    constructor(scene) {
        console.log('Map constructor called');
        
        // Use the provided scene if it exists and is valid
        if (scene && typeof scene === 'object') {
            console.log('Using provided scene');
            this.scene = scene;
        } else {
            // Create a new scene if none was provided or it was invalid
            console.log('Creating new scene in Map constructor');
            this.scene = new THREE.Scene();
        }
        
        console.log('Map scene set successfully:', this.scene);
        
        try {
            // Check if GAME_CONSTANTS exists
            if (typeof GAME_CONSTANTS === 'undefined') {
                console.warn('GAME_CONSTANTS is not defined, using default map values');
                this.width = 100;
                this.length = 100;
                this.wallHeight = 5;
                this.groundColor = 0x7B9095;
                this.wallColor = 0xCCE6FF;
            } else {
                // Map dimensions from constants with fallbacks
                const mapConstants = GAME_CONSTANTS.MAP || {};
                this.width = mapConstants.WIDTH || 100;
                this.length = mapConstants.LENGTH || 100;
                this.wallHeight = mapConstants.WALL_HEIGHT || 5;
                
                // Colors with fallbacks
                this.groundColor = mapConstants.GROUND_COLOR || 0x7B9095;
                this.wallColor = mapConstants.WALL_COLOR || 0xCCE6FF;
            }
            
            console.log(`Map dimensions set: ${this.width}x${this.length}, wall height: ${this.wallHeight}`);
            
            console.log('Creating map elements...');
            
            try {
                // Create map elements
                this.createGround();
                this.createWalls();
                this.createLighting();
                console.log('Map elements created successfully');
            } catch (error) {
                console.error('Error creating map elements:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error setting up map properties:', error);
            throw error;
        }
    }
    
    /**
     * Create the ground plane
     */
    createGround() {
        try {
            console.log('Creating ground plane...');
            
            // Verify scene exists
            if (!this.scene) {
                console.error('Scene is undefined in createGround');
                throw new Error('Scene is undefined in createGround');
            }
            
            // Create ground geometry
            const geometry = new THREE.PlaneGeometry(this.width, this.length);
            const material = new THREE.MeshLambertMaterial({ 
                color: this.groundColor,
                side: THREE.DoubleSide
            });
            
            this.ground = new THREE.Mesh(geometry, material);
            this.ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
            this.ground.position.y = 0;
            this.ground.receiveShadow = true;
            
            // Add to scene
            console.log('Adding ground to scene...');
            this.scene.add(this.ground);
            console.log('Ground added to scene successfully');
            
            // Add ground to physics system when game is initialized
            this.ground.width = this.width;
            this.ground.height = 0.1;
            this.ground.depth = this.length;
        } catch (error) {
            console.error('Error creating ground:', error);
            throw error;
        }
    }
    
    /**
     * Create the walls around the map
     */
    createWalls() {
        const halfWidth = this.width / 2;
        const halfLength = this.length / 2;
        
        // Wall material - used for all walls
        this.wallMaterial = new THREE.MeshLambertMaterial({ color: this.wallColor });
        
        // Create walls
        this.walls = [];
        
        // North wall
        const northWall = this.createWall(
            this.width,
            this.wallHeight,
            1,
            0,
            this.wallHeight / 2,
            -halfLength
        );
        this.walls.push(northWall);
        
        // South wall
        const southWall = this.createWall(
            this.width,
            this.wallHeight,
            1,
            0,
            this.wallHeight / 2,
            halfLength
        );
        this.walls.push(southWall);
        
        // East wall
        const eastWall = this.createWall(
            1,
            this.wallHeight,
            this.length,
            halfWidth,
            this.wallHeight / 2,
            0
        );
        this.walls.push(eastWall);
        
        // West wall
        const westWall = this.createWall(
            1,
            this.wallHeight,
            this.length,
            -halfWidth,
            this.wallHeight / 2,
            0
        );
        this.walls.push(westWall);
    }
    
    /**
     * Create a single wall
     * @param {number} width - Wall width
     * @param {number} height - Wall height
     * @param {number} depth - Wall depth
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @returns {THREE.Mesh} Wall mesh
     */
    createWall(width, height, depth, x, y, z) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshLambertMaterial({ color: this.wallColor });
        const wall = new THREE.Mesh(geometry, material);
        
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        
        // Add to scene
        this.scene.add(wall);
        
        // Add properties for physics system
        wall.width = width;
        wall.height = height;
        wall.depth = depth;
        
        return wall;
    }
    
    /**
     * Create lighting for the scene
     */
    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        
        // Set shadow camera frustum to cover the entire map
        const shadowSize = Math.max(this.width, this.length) / 2 + 10;
        directionalLight.shadow.camera.left = -shadowSize;
        directionalLight.shadow.camera.right = shadowSize;
        directionalLight.shadow.camera.top = shadowSize;
        directionalLight.shadow.camera.bottom = -shadowSize;
        
        this.scene.add(directionalLight);
    }
    
    /**
     * Register map elements with physics system
     * @param {Physics} physics - Physics system
     */
    registerWithPhysics(physics) {
        if (!physics) {
            console.warn('Physics system is undefined in registerWithPhysics');
            return;
        }
        
        console.log('Registering map elements with physics system');
        
        try {
            // Register ground with physics
            if (this.ground) {
                console.log('Registering ground with physics');
                // Mark the ground as a wall for collision purposes
                this.ground.isWall = true;
                
                // Use registerBody if available, fall back to registerCollider
                if (typeof physics.registerBody === 'function') {
                    physics.registerBody(this.ground);
                } else if (typeof physics.registerCollider === 'function') {
                    physics.registerCollider(this.ground, 'walls');
                }
            }
            
            // Register walls with physics
            if (this.walls && this.walls.length > 0) {
                console.log(`Registering ${this.walls.length} walls with physics`);
                
                for (const wall of this.walls) {
                    // Mark the wall as a wall for collision purposes
                    wall.isWall = true;
                    
                    // Use registerBody if available, fall back to registerCollider
                    if (typeof physics.registerBody === 'function') {
                        physics.registerBody(wall);
                    } else if (typeof physics.registerCollider === 'function') {
                        physics.registerCollider(wall, 'walls');
                    }
                }
            }
            
            console.log('Map elements registered with physics system successfully');
        } catch (error) {
            console.error('Error registering map elements with physics:', error);
        }
    }
}

// Expose SnowBrawlMap to the global scope as GameMap to avoid conflicts with built-in objects
// and to maintain compatibility with existing code
window.GameMap = SnowBrawlMap;
