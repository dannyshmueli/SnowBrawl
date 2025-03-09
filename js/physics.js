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
        // Make sure we have valid colliders
        if (!this.colliders || !this.colliders.snowballs || !this.colliders.players) {
            console.warn('Missing colliders for snowball-player collision check');
            return;
        }
        
        for (const snowball of this.colliders.snowballs) {
            // Skip snowballs that have already hit something
            if (!snowball || snowball.hasHit) continue;
            
            // Log when player throws a snowball (only once when it's in the air)
            if (snowball.ownerId === 'player' && snowball.position.y > 1.0 && !snowball.loggedInAir) {
                console.log(`Player snowball in air: (${snowball.position.x.toFixed(1)}, ${snowball.position.y.toFixed(1)}, ${snowball.position.z.toFixed(1)})`);
                snowball.loggedInAir = true;
                
                // Debug: Log all AI players' positions when a player snowball is thrown
                console.log('AI Players available for hitting:');
                for (const player of this.colliders.players) {
                    if (player && player.id !== 'player' && player.isAlive) {
                        console.log(`- AI ${player.id}: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)}), radius: ${player.radius?.toFixed(1) || 'undefined'}`);
                    }
                }
            }
            
            for (const player of this.colliders.players) {
                // Skip invalid players or those who are not alive
                if (!player || !player.isAlive) continue;
                
                // Skip collisions with the player who threw the snowball
                if (snowball.ownerId === player.id) continue;
                
                // Skip players in safe zones - this is critical for game balance
                if (SnowBrawlPhysics.isPlayerInSafeZone(player)) {
                    // Debug log for safe zone protection
                    console.log(`Player ${player.id} is in safe zone, can't be hit by snowball from ${snowball.ownerId}`);
                    continue;
                }

                
                // Debug: Log detailed info for player snowballs near AI players
                if (snowball.ownerId === 'player' && player.id !== 'player') {
                    const distance = snowball.position.distanceTo(player.position);
                    if (distance < 10) { // Only log when within reasonable distance
                        console.log(`Player snowball near AI ${player.id}: distance=${distance.toFixed(1)}, ` +
                                  `snowball=(${snowball.position.x.toFixed(1)}, ${snowball.position.y.toFixed(1)}, ${snowball.position.z.toFixed(1)}), ` +
                                  `AI=(${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)})`);
                    }
                }
                
                // Calculate multiple check points on the player's body for better collision detection
                // Ensure player has height property, default to 2.0 if not
                const playerHeight = player.height || 2.0;
                
                const checkPoints = [
                    player.position.clone(), // Base position (feet)
                    new THREE.Vector3( // Middle body
                        player.position.x,
                        player.position.y + playerHeight * 0.5,
                        player.position.z
                    ),
                    new THREE.Vector3( // Head
                        player.position.x,
                        player.position.y + playerHeight * 0.8,
                        player.position.z
                    )
                ];
                
                // Add additional check points around the player for better hit detection
                // This creates a more generous hit area especially for AI players
                const radius = player.radius || 0.5;
                const additionalPoints = [
                    new THREE.Vector3(player.position.x + radius, player.position.y + playerHeight * 0.5, player.position.z),
                    new THREE.Vector3(player.position.x - radius, player.position.y + playerHeight * 0.5, player.position.z),
                    new THREE.Vector3(player.position.x, player.position.y + playerHeight * 0.5, player.position.z + radius),
                    new THREE.Vector3(player.position.x, player.position.y + playerHeight * 0.5, player.position.z - radius)
                ];
                
                checkPoints.push(...additionalPoints);
                
                // Check distance to each point and use the minimum
                let minDistance = Infinity;
                for (const point of checkPoints) {
                    const pointDistance = snowball.position.distanceTo(point);
                    minDistance = Math.min(minDistance, pointDistance);
                }
                
                // Use a MUCH more generous collision threshold for better gameplay
                // Increased from 3.0x to 5.0x for AI players to make hitting them easier
                // This compensates for network latency and makes the game more fun
                const playerRadius = player.radius || 0.5; // Default to 0.5 if radius is undefined
                const multiplier = player.id === 'player' ? 3.0 : 5.0; // More generous for AI players
                const collisionThreshold = snowball.radius + playerRadius * multiplier;
                
                // Check if collision occurred
                // Determine if this is a player snowball targeting an AI or vice versa
                const isPlayerSnowball = snowball.ownerId === 'player';
                const isAITarget = player.id !== 'player';
                
                // Use normal collision detection with a reasonable threshold
                let effectiveCollisionThreshold = collisionThreshold;
                
                // Slightly increase threshold for player snowballs hitting AI (but not guaranteed)
                if (isPlayerSnowball && isAITarget) {
                    // Make it 1.5x easier for player snowballs to hit AI
                    effectiveCollisionThreshold *= 1.5;
                    console.log(`PHYSICS: Player snowball targeting AI ${player.id} at distance ${minDistance.toFixed(1)}, threshold: ${effectiveCollisionThreshold.toFixed(1)}`);
                }
                
                // Slightly increase threshold for AI snowballs hitting player (but not extreme)
                if (!isPlayerSnowball && !isAITarget) {
                    // Make it 1.5x easier for AI snowballs to hit human player
                    effectiveCollisionThreshold *= 1.5;
                    console.log(`Using enhanced collision threshold for AI->player hit: ${effectiveCollisionThreshold.toFixed(1)}`);
                }
                
                // Debug log for close misses
                if (minDistance < effectiveCollisionThreshold * 1.2) {
                    console.log(`PHYSICS: Close snowball! Distance: ${minDistance.toFixed(1)}, Threshold: ${effectiveCollisionThreshold.toFixed(1)}`);
                }
                
                // No more forced hits - make it fair for both sides
                const forceHit = false;
                
                if (minDistance < effectiveCollisionThreshold || forceHit) {
                    // More detailed logging to show who hit whom
                    const targetType = player.id === 'player' ? 'HUMAN PLAYER' : 'AI PLAYER';
                    console.log(`*** SNOWBALL HIT! ${isPlayerSnowball ? 'Player hit' : 'AI hit'} ${targetType} ${player.id} ${forceHit ? '(FORCED HIT)' : ''} ***`);
                    
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
                    // Only zero out velocity if moving toward the wall
                    if (dynamic.velocity.x > 0) dynamic.velocity.x = 0;
                } else {
                    dynamic.position.x += overlapX;
                    // Only zero out velocity if moving toward the wall
                    if (dynamic.velocity.x < 0) dynamic.velocity.x = 0;
                }
            } else if (overlapY < overlapX && overlapY < overlapZ) {
                // Resolve along Y axis
                if (dynamic.position.y < staticObj.position.y) {
                    dynamic.position.y -= overlapY;
                    // Only zero out velocity if moving toward the wall
                    if (dynamic.velocity.y > 0) dynamic.velocity.y = 0;
                } else {
                    dynamic.position.y += overlapY;
                    // Always zero out downward velocity when on ground
                    dynamic.velocity.y = 0;
                    dynamic.isOnGround = true;
                }
            } else {
                // Resolve along Z axis
                if (dynamic.position.z < staticObj.position.z) {
                    dynamic.position.z -= overlapZ;
                    // Only zero out velocity if moving toward the wall
                    if (dynamic.velocity.z > 0) dynamic.velocity.z = 0;
                } else {
                    dynamic.position.z += overlapZ;
                    // Only zero out velocity if moving toward the wall
                    if (dynamic.velocity.z < 0) dynamic.velocity.z = 0;
                }
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
            // Skip updating snowballs that have already hit something
            if (snowball.hasHit) return;
            
            // Count active snowballs by owner
            if (snowball.ownerId === 'player' && !snowball.counted) {
                console.log(`Active player snowball: ID=${snowball.ownerId}`);
                snowball.counted = true;
            }
            
            // Store previous position for collision detection
            const prevPosition = snowball.position.clone();
            
            // Update position based on velocity
            snowball.position.x += snowball.velocity.x * deltaTime;
            snowball.position.y += snowball.velocity.y * deltaTime;
            snowball.position.z += snowball.velocity.z * deltaTime;
            
            // Check if snowball hit ground
            if (snowball.position.y <= snowball.radius) {
                snowball.position.y = snowball.radius;
                snowball.hit();
                return;
            }
            
            // Check map boundaries
            this.constrainToMapBoundaries(snowball);
            
            // Check for collisions along the path of the snowball
            // This helps catch fast-moving snowballs that might skip past players
            this.checkSnowballPathCollision(snowball, prevPosition);
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
     * Check for collisions along the path of a snowball
     * This helps catch fast-moving snowballs that might skip past players
     * @param {Object} snowball - The snowball to check
     * @param {THREE.Vector3} prevPosition - The previous position of the snowball
     */
    checkSnowballPathCollision(snowball, prevPosition) {
        // Skip if snowball has already hit something
        if (snowball.hasHit) return;
        
        // Calculate the direction and distance traveled this frame
        const direction = new THREE.Vector3().subVectors(snowball.position, prevPosition).normalize();
        const distance = snowball.position.distanceTo(prevPosition);
        
        // If distance is very small, no need for path checking
        if (distance < 0.1) return;
        
        // Check for collisions with players along the path
        for (const player of this.colliders.players) {
            // Skip invalid players or those who are not alive
            if (!player || !player.isAlive) continue;
            
            // Skip collisions with the player who threw the snowball
            if (snowball.ownerId === player.id) continue;
            
            // Skip players in safe zones - respect safe zones for all players
            if (SnowBrawlPhysics.isPlayerInSafeZone(player)) { 
                console.log(`Player ${player.id} is in safe zone, skipping path collision check`);
                continue;
            }
            
            // Calculate closest point on the snowball's path to the player
            const playerToStart = new THREE.Vector3().subVectors(player.position, prevPosition);
            const projectionLength = playerToStart.dot(direction);
            
            // Skip if the closest point is behind the start or beyond the end
            if (projectionLength < 0 || projectionLength > distance) continue;
            
            // Calculate the closest point on the path to the player
            const closestPoint = new THREE.Vector3()
                .copy(prevPosition)
                .add(direction.clone().multiplyScalar(projectionLength));
            
            // Calculate distance from player to the closest point
            const closestDistance = player.position.distanceTo(closestPoint);
            
            // Use a very generous collision threshold for path detection
            const collisionThreshold = snowball.radius + player.radius * 4.0;
            
            // Check if collision occurred
            // SPECIAL CASE: If player's snowball is near an AI, force a hit
            const isPlayerSnowball = snowball.ownerId === 'player';
            
            // No more forced hits - make it fair for both sides
            const forceHit = false;
            
            if (closestDistance < collisionThreshold || forceHit) {
                // More detailed logging for path collisions
                const targetType = player.id === 'player' ? 'HUMAN PLAYER' : 'AI PLAYER';
                console.log(`*** PATH COLLISION! ${isPlayerSnowball ? 'Player hit' : 'AI hit'} ${targetType} ${player.id} ${forceHit ? '(FORCED HIT)' : ''} ***`);
                
                // Handle hit
                player.takeDamage(snowball.damage, snowball.ownerId);
                
                // Apply knockback to player
                const knockbackDirection = new THREE.Vector3()
                    .subVectors(player.position, closestPoint)
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
    
    /**
     * Check if a point is inside a player's safe zone
     * @param {THREE.Vector3} point - Point to check
     * @param {Object} player - Player object
     * @returns {boolean} True if point is in safe zone
     */
    isPointInSafeZone(point, player) {
        return SnowBrawlPhysics.isPointInSafeZone(point, player);
    }
    
    /**
     * Check if a player is in their safe zone
     * @param {Object} player - Player to check
     * @returns {boolean} True if player is in safe zone
     */
    isPlayerInSafeZone(player) {
        return SnowBrawlPhysics.isPointInSafeZone(player.position, player);
    }
}

/**
 * Static method to check if a point is in a player's safe zone
 * @param {THREE.Vector3} point - Point to check
 * @param {Object} player - Player whose safe zone to check
 * @returns {boolean} True if point is in safe zone
 */
SnowBrawlPhysics.isPointInSafeZone = function(point, player) {
    // Make sure player has an igloo position set
    if (!player || !player.iglooPosition) {
        return false;
    }
    
    const iglooPosition = player.iglooPosition;
    const safeZoneRadius = GAME_CONSTANTS.IGLOO.SAFE_ZONE_RADIUS;
    
    const dx = point.x - iglooPosition.x;
    const dz = point.z - iglooPosition.z;
    const distanceSquared = dx * dx + dz * dz;
    
    return distanceSquared <= safeZoneRadius * safeZoneRadius;
};

/**
 * Static method to check if a player is in a safe zone
 * @param {Object} player - Player to check
 * @returns {boolean} True if player is in safe zone
 */
SnowBrawlPhysics.isPlayerInSafeZone = function(player) {
    return SnowBrawlPhysics.isPointInSafeZone(player.position, player);
};

// Expose SnowBrawlPhysics to the global scope as Physics to avoid conflicts with built-in objects
// and to maintain compatibility with existing code
window.Physics = SnowBrawlPhysics;
