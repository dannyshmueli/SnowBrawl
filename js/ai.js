/**
 * AI Player class for SnowBrawl game
 * Handles AI decision making and behavior
 * This is a simplified version for initial implementation
 */

// Using SnowBrawlAI instead of AIPlayer to avoid conflicts with built-in globals
class SnowBrawlAI extends Player {
    constructor(id, scene, camera, controls) {
        super(id, scene, camera, controls, false);
        
        // AI-specific properties
        this.updateInterval = GAME_CONSTANTS.AI.UPDATE_INTERVAL || 500;
        this.lastUpdateTime = 0;
        
        // AI state
        this.state = 'idle'; // idle, pursuing, attacking, retreating, collecting
        
        // Ensure AI has proper collision properties
        this.radius = GAME_CONSTANTS.PLAYER.RADIUS || 0.5;
        this.height = GAME_CONSTANTS.PLAYER.HEIGHT || 2.0;
        
        // Movement properties for smoother AI movement
        this.targetPosition = null;
        this.movementTimer = 0;
        this.movementDuration = 3000; // Time in ms before changing direction
        
        // Customize AI appearance with random color
        this.customizeAppearance();
        
        // Debug log to confirm AI creation
        console.log(`AI Player ${id} created with radius: ${this.radius}, height: ${this.height}`);
    }
    
    /**
     * Customize AI appearance with random color
     */
    customizeAppearance() {
        try {
            // Generate a random color for this AI
            const hue = Utils.randomRange(0, 360);
            const color = new THREE.Color().setHSL(hue / 360, 0.8, 0.5);
            
            // Apply color to mesh if it exists
            if (this.mesh && this.mesh.material) {
                this.mesh.material.color.copy(color);
            }
        } catch (error) {
            console.error('Error customizing AI appearance:', error);
        }
    }
    
    /**
     * Update AI state and behavior
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Call parent update method
        super.update(deltaTime);
        
        if (!this.isAlive) return;
        
        // Debug: Periodically log AI position to verify it's where we expect
        const currentTime = Date.now();
        if (currentTime % 5000 < 50) { // Log roughly every 5 seconds
            console.log(`AI ${this.id} position: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)})`);
        }
        
        // For now, just implement simple random movement
        this.simpleRandomMovement(deltaTime);
    }
    
    /**
     * Simple random movement for AI
     * @param {number} deltaTime - Time since last frame in seconds
     */
    simpleRandomMovement(deltaTime) {
        try {
            const currentTime = Date.now();
            
            // Update movement timer
            this.movementTimer += deltaTime * 1000; // Convert to milliseconds
            
            // Only change direction after the movement duration has passed
            if (!this.targetPosition || this.movementTimer >= this.movementDuration) {
                this.movementTimer = 0;
                
                // Check if AI is in safe zone
                const inSafeZone = Physics.isPlayerInSafeZone(this);
                
                // Set a new target position
                if (inSafeZone && this.iglooPosition) {
                    // Move away from igloo (safe zone center)
                    const directionX = this.position.x - this.iglooPosition.x;
                    const directionZ = this.position.z - this.iglooPosition.z;
                    
                    // Normalize direction
                    const length = Math.sqrt(directionX * directionX + directionZ * directionZ);
                    if (length > 0.001) { // Avoid division by zero
                        const normalizedX = directionX / length;
                        const normalizedZ = directionZ / length;
                        
                        // Set target position away from igloo
                        const distance = 20 + Math.random() * 10; // Move 20-30 units away
                        this.targetPosition = {
                            x: this.position.x + normalizedX * distance,
                            z: this.position.z + normalizedZ * distance
                        };
                        
                        console.log(`AI ${this.id} moving away from safe zone to (${this.targetPosition.x.toFixed(1)}, ${this.targetPosition.z.toFixed(1)})`);
                    } else {
                        // Random direction if too close to center
                        const angle = Utils.randomRange(0, Math.PI * 2);
                        const distance = 15 + Math.random() * 10;
                        this.targetPosition = {
                            x: this.position.x + Math.cos(angle) * distance,
                            z: this.position.z + Math.sin(angle) * distance
                        };
                    }
                } else {
                    // Random movement in the game area
                    const gameSize = 100; // Assuming game area is 100x100
                    const margin = 10;
                    
                    // Pick a random position within game bounds
                    this.targetPosition = {
                        x: Utils.randomRange(-gameSize/2 + margin, gameSize/2 - margin),
                        z: Utils.randomRange(-gameSize/2 + margin, gameSize/2 - margin)
                    };
                }
                
                // Calculate velocity towards target position
                const dx = this.targetPosition.x - this.position.x;
                const dz = this.targetPosition.z - this.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance > 0.1) {
                    this.velocity.x = (dx / distance) * this.moveSpeed * 0.7;
                    this.velocity.z = (dz / distance) * this.moveSpeed * 0.7;
                }
            } else {
                // Check if we've reached the target position
                const dx = this.targetPosition.x - this.position.x;
                const dz = this.targetPosition.z - this.position.z;
                const distanceSquared = dx * dx + dz * dz;
                
                if (distanceSquared < 1) {
                    // We've reached the target, reset timer to pick a new target next frame
                    this.movementTimer = this.movementDuration;
                }
            }
            
            // Change behavior occasionally
            if (currentTime - this.lastUpdateTime > this.updateInterval) {
                this.lastUpdateTime = currentTime;
                
                // Occasionally throw a snowball
                if (Math.random() < 0.1 && this.snowballCount > 0) {
                    this.throwSnowball();
                }
            }
        } catch (error) {
            console.error('Error in AI movement:', error);
        }
    }
    
    /**
     * Set igloo position for the AI player
     * @param {THREE.Vector3} position - Position for the igloo
     */
    setIglooPosition(position) {
        if (position) {
            this.iglooPosition = position.clone();
        }
    }
    
    /**
     * Throw a snowball in a random direction
     */
    throwSnowball() {
        try {
            // Check if we have snowballs
            if (this.snowballCount <= 0) return;
            
            // Generate a random direction
            const angle = Utils.randomRange(0, Math.PI * 2);
            const direction = new THREE.Vector3(
                Math.cos(angle),
                0.2, // Slight upward angle
                Math.sin(angle)
            ).normalize();
            
            // Call the parent throwSnowball method
            super.throwSnowball(direction);
        } catch (error) {
            console.error('Error throwing AI snowball:', error);
        }
    }
    

    
    /**
     * Execute retreating behavior - move toward igloo
     * @param {number} deltaTime - Time since last update in seconds
     */
    executeRetreatingBehavior() {
        // Check if igloo position is set
        if (!this.iglooPosition) {
            this.state = 'idle';
            this.stateStartTime = Date.now();
            return;
        }
        
        // Calculate direction to igloo
        const direction = new THREE.Vector3()
            .subVectors(this.iglooPosition, this.position)
            .normalize();
        
        // Set velocity toward igloo
        this.velocity.x = direction.x * this.moveSpeed;
        this.velocity.z = direction.z * this.moveSpeed;
        
        // Check if reached safe zone 
        if (Physics.isPlayerInSafeZone(this)) {
            // If health and snowballs are good, exit retreat mode
            if (
                this.health > GAME_CONSTANTS.PLAYER.INITIAL_HEALTH * 0.8 &&
                this.snowballCount > this.maxSnowballCount * 0.8
            ) {
                this.state = 'idle';
                this.stateStartTime = Date.now();
            }
        }
    }
    
    /**
     * Execute collecting behavior - move toward target diamond
     */
    executeCollectingBehavior() {
        // Check if target is still valid
        if (!this.targetDiamond || this.targetDiamond.isCollected) {
            this.targetDiamond = null;
            this.state = 'idle';
            this.stateStartTime = Date.now();
            return;
        }
        
        // Calculate direction to diamond
        const direction = new THREE.Vector3()
            .subVectors(this.targetDiamond.position, this.position)
            .normalize();
        
        // Set velocity toward diamond
        this.velocity.x = direction.x * this.moveSpeed;
        this.velocity.z = direction.z * this.moveSpeed;
        
        // Check if diamond was collected
        const distance = this.position.distanceTo(this.targetDiamond.position);
        if (distance < GAME_CONSTANTS.DIAMOND_GARDEN.COLLECTION_RADIUS) {
            // Diamond will be collected by physics system
            this.state = 'idle';
            this.stateStartTime = Date.now();
        }
    }
    
    /**
     * Find the nearest player within sight range
     * @returns {Object|null} Nearest player or null if none found
     */
    findNearestPlayer() {
        let nearestPlayer = null;
        let nearestDistance = GAME_CONSTANTS.AI.SIGHT_RANGE;
        
        for (const player of Game.players) {
            // Skip self and non-alive players
            if (player.id === this.id || !player.isAlive) continue;
            
            // Skip players in safe zones
            if (Physics.isPlayerInSafeZone(player)) continue;
            
            // Calculate distance
            const distance = this.position.distanceTo(player.position);
            
            // Check if within sight range and closer than current nearest
            if (distance < nearestDistance) {
                nearestPlayer = player;
                nearestDistance = distance;
            }
        }
        
        return nearestPlayer;
    }
    
    /**
     * Find the nearest diamond within sight range
     * @returns {Object|null} Nearest diamond or null if none found
     */
    findNearestDiamond() {
        let nearestDiamond = null;
        let nearestDistance = GAME_CONSTANTS.AI.SIGHT_RANGE;
        
        for (const diamond of Game.diamonds) {
            // Skip collected diamonds
            if (diamond.isCollected) continue;
            
            // Calculate distance
            const distance = this.position.distanceTo(diamond.position);
            
            // Check if within sight range and closer than current nearest
            if (distance < nearestDistance) {
                nearestDiamond = diamond;
                nearestDistance = distance;
            }
        }
        
        return nearestDiamond;
    }
    
    /**
     * Apply an upgrade based on AI preferences
     */
    chooseUpgrade() {
        // Skip if no diamonds
        if (this.diamondCount <= 0) return;
        
        // Choose upgrade based on personality and current state
        const upgrades = ['speed', 'damage', 'range', 'size', 'capacity'];
        const weights = [1, 1, 1, 1, 1];
        
        // Adjust weights based on traits
        if (this.traits.aggression > 0.6) {
            // Aggressive AI prefers damage and range
            weights[1] *= 2; // damage
            weights[2] *= 1.5; // range
        } else {
            // Less aggressive AI prefers speed and capacity
            weights[0] *= 1.5; // speed
            weights[4] *= 2; // capacity
        }
        
        // Adjust weights based on current levels
        for (let i = 0; i < upgrades.length; i++) {
            const upgradeType = upgrades[i];
            const currentLevel = this.upgrades[upgradeType];
            const maxLevel = GAME_CONSTANTS.UPGRADES[upgradeType.toUpperCase()].MAX_LEVEL;
            
            // Reduce weight for upgrades close to max level
            weights[i] *= (maxLevel - currentLevel) / maxLevel;
            
            // Set weight to 0 for maxed out upgrades
            if (currentLevel >= maxLevel) {
                weights[i] = 0;
            }
        }
        
        // Choose upgrade based on weights
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        // If no valid upgrades, return
        if (totalWeight <= 0) return;
        
        const random = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        
        for (let i = 0; i < upgrades.length; i++) {
            cumulativeWeight += weights[i];
            if (random < cumulativeWeight) {
                // Apply chosen upgrade
                this.applyUpgrade(upgrades[i]);
                break;
            }
        }
    }
}

// Expose SnowBrawlAI to the global scope as AIPlayer to avoid conflicts with built-in objects
// and to maintain compatibility with existing code
window.AIPlayer = SnowBrawlAI;
