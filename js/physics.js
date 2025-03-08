/**
 * Physics system for SnowBrawl game
 * Handles collision detection and response
 */

// Using SnowBrawlPhysics instead of Physics to avoid conflicts with built-in globals
class SnowBrawlPhysics {
    constructor(scene) {
        console.log('Physics constructor called with scene:', scene);
        this.scene = scene;
        
        if (!this.scene) {
            console.error('Scene is undefined in Physics constructor');
            throw new Error('Scene is undefined in Physics constructor');
        }
        
        // Check if GAME_CONSTANTS exists
        if (typeof GAME_CONSTANTS === 'undefined') {
            console.warn('GAME_CONSTANTS is not defined, using default physics values');
            this.gravity = 9.8;
            this.timeStep = 1/60;
            this.collisionIterations = 3;
        } else {
            // Set physics constants with fallbacks
            const physics = GAME_CONSTANTS.PHYSICS || {};
            this.gravity = physics.GRAVITY || 9.8;
            this.timeStep = physics.TIME_STEP || 1/60;
            this.collisionIterations = physics.COLLISION_ITERATIONS || 3;
        }
        
        console.log('Physics constants set:', {
            gravity: this.gravity,
            timeStep: this.timeStep,
            collisionIterations: this.collisionIterations
        });
        
        // Collision groups
        this.colliders = {
            players: [],
            snowballs: [],
            walls: [],
            igloos: [],
            diamonds: []
        };
        
        console.log('Physics system initialized successfully');
    }
    
    /**
     * Register a collider with the physics system
     * @param {Object} object - Object to register
     * @param {string} type - Type of collider (players, snowballs, walls, igloos, diamonds)
     */
    registerCollider(object, type) {
        if (this.colliders[type]) {
            this.colliders[type].push(object);
        }
    }
    
    /**
     * Unregister a collider from the physics system
     * @param {Object} object - Object to unregister
     * @param {string} type - Type of collider
     */
    unregisterCollider(object, type) {
        if (this.colliders[type]) {
            const index = this.colliders[type].indexOf(object);
            if (index !== -1) {
                this.colliders[type].splice(index, 1);
            }
        }
    }
    
    /**
     * Register a body with the physics system
     * This is a simplified method that determines the type based on the object properties
     * @param {Object} body - The body to register
     */
    registerBody(body) {
        console.log('Registering body with physics system:', body);
        
        if (!body) {
            console.warn('Attempted to register undefined body with physics');
            return;
        }
        
        // Determine the type based on object properties
        let type = 'walls'; // Default type
        
        if (body.isPlayer) {
            type = 'players';
        } else if (body.isSnowball) {
            type = 'snowballs';
        } else if (body.isIgloo) {
            type = 'igloos';
        } else if (body.isDiamond) {
            type = 'diamonds';
        }
        
        // Register with the appropriate collider type
        this.registerCollider(body, type);
        console.log(`Registered body as ${type}`);
    }
    
    /**
     * Update physics for all registered objects
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Apply gravity to players and snowballs
        this.applyGravity(deltaTime);
        
        // Check for collisions
        this.checkCollisions();
        
        // Update positions based on velocities
        this.updatePositions(deltaTime);
    }
    
    /**
     * Apply gravity to dynamic objects
     * @param {number} deltaTime - Time since last update in seconds
     */
    applyGravity(deltaTime) {
        // Apply gravity to players
        this.colliders.players.forEach(player => {
            if (!player.isOnGround) {
                player.velocity.y -= this.gravity * deltaTime;
            }
        });
        
        // Apply gravity to snowballs
        this.colliders.snowballs.forEach(snowball => {
            snowball.velocity.y -= this.gravity * deltaTime;
        });
    }
    
    /**
     * Check for collisions between objects
     */
    checkCollisions() {
        // Check snowball-player collisions
        this.checkSnowballPlayerCollisions();
        
        // Check snowball-wall collisions
        this.checkSnowballWallCollisions();
        
        // Check snowball-igloo collisions
        this.checkSnowballIglooCollisions();
        
        // Check player-wall collisions
        this.checkPlayerWallCollisions();
        
        // Check player-igloo collisions
        this.checkPlayerIglooCollisions();
        
        // Check player-diamond collisions
        this.checkPlayerDiamondCollisions();
    }
    
    /**
     * Check for collisions between snowballs and players
     */
    checkSnowballPlayerCollisions() {
        for (const snowball of this.colliders.snowballs) {
            // Skip snowballs that have already hit something
            if (snowball.hasHit) continue;
            
            for (const player of this.colliders.players) {
                // Skip collisions with the player who threw the snowball
                if (snowball.ownerId === player.id) continue;
                
                // Skip players in safe zones
                if (player.isInSafeZone) continue;
                
                // Calculate distance between snowball and player
                const distance = snowball.position.distanceTo(player.position);
                
                // Check if collision occurred
                if (distance < (snowball.radius + player.radius)) {
                    // Handle hit
                    player.takeDamage(snowball.damage, snowball.ownerId);
                    
                    // Apply knockback to player
                    const knockbackDirection = new THREE.Vector3()
                        .subVectors(player.position, snowball.position)
                        .normalize();
                    player.applyKnockback(
                        knockbackDirection, 
                        GAME_CONSTANTS.SNOWBALL.KNOCKBACK_FORCE
                    );
                    
                    // Mark snowball as hit and schedule for removal
                    snowball.hit();
                    break;
                }
            }
        }
    }
    
    /**
     * Check for collisions between snowballs and walls
     */
    checkSnowballWallCollisions() {
        for (const snowball of this.colliders.snowballs) {
            // Skip snowballs that have already hit something
            if (snowball.hasHit) continue;
            
            for (const wall of this.colliders.walls) {
                // Simple AABB collision check
                if (this.checkAABBCollision(snowball, wall)) {
                    // Mark snowball as hit and schedule for removal
                    snowball.hit();
                    break;
                }
            }
        }
    }
    
    /**
     * Check for collisions between snowballs and igloos
     */
    checkSnowballIglooCollisions() {
        for (const snowball of this.colliders.snowballs) {
            // Skip snowballs that have already hit something
            if (snowball.hasHit) continue;
            
            for (const igloo of this.colliders.igloos) {
                // Simple AABB collision check
                if (this.checkAABBCollision(snowball, igloo)) {
                    // Mark snowball as hit and schedule for removal
                    snowball.hit();
                    break;
                }
            }
        }
    }
    
    /**
     * Check for collisions between players and walls
     */
    checkPlayerWallCollisions() {
        for (const player of this.colliders.players) {
            for (const wall of this.colliders.walls) {
                // Simple AABB collision resolution
                this.resolveAABBCollision(player, wall);
            }
        }
    }
    
    /**
     * Check for collisions between players and igloos
     */
    checkPlayerIglooCollisions() {
        for (const player of this.colliders.players) {
            for (const igloo of this.colliders.igloos) {
                // Check if player is entering their own igloo
                if (player.id === igloo.ownerId) {
                    // Check if player is inside igloo entrance
                    if (this.isPlayerInIglooEntrance(player, igloo)) {
                        player.isInIgloo = true;
                        // Replenish snowballs when in own igloo
                        player.replenishSnowballs();
                    } else {
                        player.isInIgloo = false;
                        // Resolve collision with igloo walls
                        this.resolveAABBCollision(player, igloo);
                    }
                } else {
                    // For other players' igloos, just handle collision
                    this.resolveAABBCollision(player, igloo);
                }
            }
        }
    }
    
    /**
     * Check for collisions between players and diamonds
     */
    checkPlayerDiamondCollisions() {
        for (const player of this.colliders.players) {
            for (const diamond of this.colliders.diamonds) {
                // Skip diamonds that have already been collected
                if (diamond.isCollected) continue;
                
                // Calculate distance between player and diamond
                const distance = player.position.distanceTo(diamond.position);
                
                // Check if player is close enough to collect
                if (distance < GAME_CONSTANTS.DIAMOND_GARDEN.COLLECTION_RADIUS) {
                    // Collect the diamond
                    player.collectDiamond(diamond);
                    diamond.collect();
                }
            }
        }
    }
    
    /**
     * Check if a player is inside an igloo entrance
     * @param {Object} player - Player object
     * @param {Object} igloo - Igloo object
     * @returns {boolean} True if player is in entrance
     */
    isPlayerInIglooEntrance(player, igloo) {
        // Calculate entrance bounds
        const entranceWidth = GAME_CONSTANTS.IGLOO.ENTRANCE_WIDTH;
        const entranceHeight = GAME_CONSTANTS.IGLOO.ENTRANCE_HEIGHT;
        
        // Check if player is within entrance bounds
        // This is a simplified check - would need to be adjusted based on actual igloo model
        const dx = Math.abs(player.position.x - igloo.entrancePosition.x);
        const dy = Math.abs(player.position.y - igloo.entrancePosition.y);
        const dz = Math.abs(player.position.z - igloo.entrancePosition.z);
        
        return dx < entranceWidth / 2 && dy < entranceHeight / 2 && dz < 1;
    }
    
    /**
     * Check for AABB collision between two objects
     * @param {Object} obj1 - First object
     * @param {Object} obj2 - Second object
     * @returns {boolean} True if collision occurred
     */
    checkAABBCollision(obj1, obj2) {
        // Get bounds for first object
        const bounds1 = this.getObjectBounds(obj1);
        
        // Get bounds for second object
        const bounds2 = this.getObjectBounds(obj2);
        
        // Check for overlap in all three axes
        return (
            bounds1.min.x <= bounds2.max.x && bounds1.max.x >= bounds2.min.x &&
            bounds1.min.y <= bounds2.max.y && bounds1.max.y >= bounds2.min.y &&
            bounds1.min.z <= bounds2.max.z && bounds1.max.z >= bounds2.min.z
        );
    }
    
    /**
     * Resolve AABB collision between two objects
     * @param {Object} dynamic - Dynamic object (can be moved)
     * @param {Object} staticObj - Static object (cannot be moved)
     */
    resolveAABBCollision(dynamic, staticObj) {
        // Get bounds for both objects
        const dynamicBounds = this.getObjectBounds(dynamic);
        const staticBounds = this.getObjectBounds(staticObj);
        
        // Check for collision
        if (this.checkAABBCollision(dynamic, staticObj)) {
            // Calculate overlap in each axis
            const overlapX = Math.min(
                dynamicBounds.max.x - staticBounds.min.x,
                staticBounds.max.x - dynamicBounds.min.x
            );
            
            const overlapY = Math.min(
                dynamicBounds.max.y - staticBounds.min.y,
                staticBounds.max.y - dynamicBounds.min.y
            );
            
            const overlapZ = Math.min(
                dynamicBounds.max.z - staticBounds.min.z,
                staticBounds.max.z - dynamicBounds.min.z
            );
            
            // Find smallest overlap to determine resolution direction
            if (overlapX < overlapY && overlapX < overlapZ) {
                // Resolve along X axis
                if (dynamic.position.x < staticObj.position.x) {
                    dynamic.position.x -= overlapX;
                } else {
                    dynamic.position.x += overlapX;
                }
                dynamic.velocity.x = 0;
            } else if (overlapY < overlapX && overlapY < overlapZ) {
                // Resolve along Y axis
                if (dynamic.position.y < staticObj.position.y) {
                    dynamic.position.y -= overlapY;
                    dynamic.velocity.y = 0;
                } else {
                    dynamic.position.y += overlapY;
                    dynamic.velocity.y = 0;
                    dynamic.isOnGround = true;
                }
            } else {
                // Resolve along Z axis
                if (dynamic.position.z < staticObj.position.z) {
                    dynamic.position.z -= overlapZ;
                } else {
                    dynamic.position.z += overlapZ;
                }
                dynamic.velocity.z = 0;
            }
        }
    }
    
    /**
     * Get axis-aligned bounding box for an object
     * @param {Object} object - Object to get bounds for
     * @returns {Object} Object with min and max Vector3 properties
     */
    getObjectBounds(object) {
        // For sphere-like objects (players, snowballs)
        if (object.radius) {
            return {
                min: new THREE.Vector3(
                    object.position.x - object.radius,
                    object.position.y - object.radius,
                    object.position.z - object.radius
                ),
                max: new THREE.Vector3(
                    object.position.x + object.radius,
                    object.position.y + object.radius,
                    object.position.z + object.radius
                )
            };
        }
        
        // For box-like objects (walls, igloos)
        return {
            min: new THREE.Vector3(
                object.position.x - object.width / 2,
                object.position.y - object.height / 2,
                object.position.z - object.depth / 2
            ),
            max: new THREE.Vector3(
                object.position.x + object.width / 2,
                object.position.y + object.height / 2,
                object.position.z + object.depth / 2
            )
        };
    }
    
    /**
     * Update positions of dynamic objects based on their velocities
     * @param {number} deltaTime - Time since last update in seconds
     */
    updatePositions(deltaTime) {
        // Update player positions
        this.colliders.players.forEach(player => {
            player.position.x += player.velocity.x * deltaTime;
            player.position.y += player.velocity.y * deltaTime;
            player.position.z += player.velocity.z * deltaTime;
            
            // Check if player is on ground
            if (player.position.y <= 0) {
                player.position.y = 0;
                player.velocity.y = 0;
                player.isOnGround = true;
            } else {
                player.isOnGround = false;
            }
            
            // Check map boundaries
            this.constrainToMapBoundaries(player);
        });
        
        // Update snowball positions
        this.colliders.snowballs.forEach(snowball => {
            snowball.position.x += snowball.velocity.x * deltaTime;
            snowball.position.y += snowball.velocity.y * deltaTime;
            snowball.position.z += snowball.velocity.z * deltaTime;
            
            // Check if snowball hit ground
            if (snowball.position.y <= snowball.radius) {
                snowball.position.y = snowball.radius;
                snowball.hit();
            }
            
            // Check map boundaries
            this.constrainToMapBoundaries(snowball);
        });
    }
    
    /**
     * Constrain an object to stay within map boundaries
     * @param {Object} object - Object to constrain
     */
    constrainToMapBoundaries(object) {
        const halfWidth = GAME_CONSTANTS.MAP.WIDTH / 2;
        const halfLength = GAME_CONSTANTS.MAP.LENGTH / 2;
        const radius = object.radius || 0;
        
        // Constrain X position
        if (object.position.x < -halfWidth + radius) {
            object.position.x = -halfWidth + radius;
            object.velocity.x = 0;
        } else if (object.position.x > halfWidth - radius) {
            object.position.x = halfWidth - radius;
            object.velocity.x = 0;
        }
        
        // Constrain Z position
        if (object.position.z < -halfLength + radius) {
            object.position.z = -halfLength + radius;
            object.velocity.z = 0;
        } else if (object.position.z > halfLength - radius) {
            object.position.z = halfLength - radius;
            object.velocity.z = 0;
        }
    }
    
    /**
     * Check if a point is inside a player's safe zone
     * @param {THREE.Vector3} point - Point to check
     * @param {Object} player - Player object
     * @returns {boolean} True if point is in safe zone
     */
    isPointInSafeZone(point, player) {
        const iglooPosition = player.iglooPosition;
        const safeZoneRadius = GAME_CONSTANTS.IGLOO.SAFE_ZONE_RADIUS;
        
        const dx = point.x - iglooPosition.x;
        const dz = point.z - iglooPosition.z;
        const distanceSquared = dx * dx + dz * dz;
        
        return distanceSquared <= safeZoneRadius * safeZoneRadius;
    }
    
    /**
     * Check if a player is in their safe zone
     * @param {Object} player - Player to check
     * @returns {boolean} True if player is in safe zone
     */
    isPlayerInSafeZone(player) {
        return this.isPointInSafeZone(player.position, player);
    }
}

// Expose SnowBrawlPhysics to the global scope as Physics to avoid conflicts with built-in objects
// and to maintain compatibility with existing code
window.Physics = SnowBrawlPhysics;
