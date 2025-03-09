/**
 * Player class for SnowBrawl game
 * Handles player movement, shooting, and upgrades
 */

// Using SnowBrawlPlayer instead of Player to avoid conflicts with built-in globals
class SnowBrawlPlayer {
    constructor(id, scene, camera, controls, isHuman = false) {
        this.id = id;
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.isHuman = isHuman;
        
        // Player stats
        this.health = GAME_CONSTANTS.PLAYER.INITIAL_HEALTH;
        this.snowballCount = GAME_CONSTANTS.SNOWBALL.INITIAL_COUNT;
        this.maxSnowballCount = GAME_CONSTANTS.SNOWBALL.INITIAL_COUNT;
        this.diamondCount = 0;
        this.score = 0;
        
        // Movement properties
        this.position = new THREE.Vector3(0, GAME_CONSTANTS.PLAYER.HEIGHT / 2, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.moveSpeed = GAME_CONSTANTS.PLAYER.MOVEMENT_SPEED;
        this.jumpForce = GAME_CONSTANTS.PLAYER.JUMP_FORCE;
        this.height = GAME_CONSTANTS.PLAYER.HEIGHT;
        this.radius = GAME_CONSTANTS.PLAYER.RADIUS;
        this.isOnGround = true;
        
        // Snowball properties
        // Note: We'll use GAME_CONSTANTS.SNOWBALL.DAMAGE directly when creating snowballs
        // to ensure we always have the latest value
        this.snowballSize = GAME_CONSTANTS.SNOWBALL.RADIUS;
        this.throwSpeed = GAME_CONSTANTS.SNOWBALL.THROW_SPEED;
        this.throwRange = GAME_CONSTANTS.SNOWBALL.MAX_THROW_DISTANCE;
        this.lastThrowTime = 0;
        this.throwCooldown = GAME_CONSTANTS.SNOWBALL.THROW_COOLDOWN;
        
        // Debug log player creation
        console.log(`Player ${id} created. isHuman: ${isHuman}, radius: ${this.radius}, height: ${this.height}`);
        
        // Status flags
        this.isAlive = true;
        this.isInIgloo = false;
        this.lastReplenishTime = 0;
        
        // Igloo position (will be set by game)
        this.iglooPosition = null;
        
        // Upgrades
        this.upgrades = {
            speed: 0,
            damage: 0,
            range: 0,
            size: 0,
            capacity: 0
        };
        
        // Create player mesh
        this.createPlayerMesh();
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Input state (for human player)
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            shoot: false
        };
        
        // Set up input handlers if human player
        if (isHuman) {
            this.setupInputHandlers();
        }
    }
    
    /**
     * Create the player's 3D mesh
     */
    createPlayerMesh() {
        // Create player body
        const geometry = new THREE.CapsuleGeometry(this.radius, this.height - 2 * this.radius, 8, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0x0000FF });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Create player name tag with health display
        this.updateNameTag();
        this.nameTag.position.y = this.height + 0.5;
        this.mesh.add(this.nameTag);
    }
    
    /**
     * Set up input handlers for human player
     */
    setupInputHandlers() {
        // Keyboard input
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // Mouse input for shooting
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Left mouse button
                this.input.shoot = true;
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) { // Left mouse button
                this.input.shoot = false;
            }
        });
    }
    
    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.input.forward = true;
                break;
            case 'KeyS':
                this.input.backward = true;
                break;
            case 'KeyA':
                this.input.left = true;
                break;
            case 'KeyD':
                this.input.right = true;
                break;
            case 'Space':
                this.input.jump = true;
                break;
        }
    }
    
    /**
     * Handle keyup events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.input.forward = false;
                break;
            case 'KeyS':
                this.input.backward = false;
                break;
            case 'KeyA':
                this.input.left = false;
                break;
            case 'KeyD':
                this.input.right = false;
                break;
            case 'Space':
                this.input.jump = false;
                break;
        }
    }
    
    /**
     * Update player state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.isAlive) return;
        
        // Update position from physics system
        this.mesh.position.copy(this.position);
        
        // Replenish snowballs if in igloo
        if (this.isInIgloo) {
            this.replenishSnowballs();
        }
        
        // Handle input for human player
        if (this.isHuman) {
            this.handleMovementInput(deltaTime);
            this.handleShootInput();
        }
        
        // Update camera position for human player
        if (this.isHuman && this.camera) {
            this.updateCamera();
        }
    }
    
    /**
     * Handle movement input for human player
     * @param {number} deltaTime - Time since last update in seconds
     */
    handleMovementInput(deltaTime) {
        // Calculate movement direction based on camera orientation
        const moveDirection = new THREE.Vector3();
        
        // Forward/backward movement
        if (this.input.forward) {
            moveDirection.z -= 1;
        }
        if (this.input.backward) {
            moveDirection.z += 1;
        }
        
        // Left/right movement
        if (this.input.left) {
            moveDirection.x -= 1;
        }
        if (this.input.right) {
            moveDirection.x += 1;
        }
        
        // Normalize movement direction
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
        }
        
        // Calculate the actual movement direction based on camera orientation
        // This is a more direct approach that doesn't rely on rotation angles
        const worldMoveDirection = new THREE.Vector3();
        
        // Get camera direction vectors (normalized and with y component removed for horizontal movement)
        const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        cameraForward.y = 0;
        cameraForward.normalize();
        
        const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        cameraRight.y = 0;
        cameraRight.normalize();
        
        // Add the appropriate direction vectors based on input
        if (this.input.forward) {
            worldMoveDirection.add(cameraForward);
        }
        if (this.input.backward) {
            worldMoveDirection.sub(cameraForward);
        }
        if (this.input.right) {
            worldMoveDirection.add(cameraRight);
        }
        if (this.input.left) {
            worldMoveDirection.sub(cameraRight);
        }
        
        // Normalize the result to maintain consistent speed in all directions
        if (worldMoveDirection.length() > 0) {
            worldMoveDirection.normalize();
        }
        
        // Use the calculated world direction directly
        const rotatedX = worldMoveDirection.x;
        const rotatedZ = worldMoveDirection.z;
        
        // Set velocity based on movement direction
        const acceleration = GAME_CONSTANTS.PLAYER.ACCELERATION * deltaTime;
        const deceleration = GAME_CONSTANTS.PLAYER.DECELERATION * deltaTime;
        
        // Apply acceleration in movement direction
        if (Math.abs(rotatedX) > 0) {
            this.velocity.x = Utils.lerp(this.velocity.x, rotatedX * this.moveSpeed, acceleration);
        } else {
            // Apply deceleration when no input
            this.velocity.x = Utils.lerp(this.velocity.x, 0, deceleration);
        }
        
        if (Math.abs(rotatedZ) > 0) {
            this.velocity.z = Utils.lerp(this.velocity.z, rotatedZ * this.moveSpeed, acceleration);
        } else {
            // Apply deceleration when no input
            this.velocity.z = Utils.lerp(this.velocity.z, 0, deceleration);
        }
        
        // Handle jumping
        if (this.input.jump && this.isOnGround) {
            this.velocity.y = this.jumpForce;
            this.isOnGround = false;
        }
    }
    
    /**
     * Handle shoot input for human player
     */
    handleShootInput() {
        if (this.input.shoot) {
            this.throwSnowball();
        }
    }
    
    /**
     * Update the player's name tag with health information
     */
    updateNameTag() {
        // Remove existing name tag if it exists
        if (this.nameTag && this.mesh) {
            this.mesh.remove(this.nameTag);
        }
        
        // Create name with health percentage
        const healthPercent = Math.round((this.health / GAME_CONSTANTS.PLAYER.INITIAL_HEALTH) * 100);
        const nameText = this.isHuman ? `You (${healthPercent}%)` : `AI ${this.id} (${healthPercent}%)`;
        
        // Create text sprite
        this.nameTag = Utils.createTextSprite(nameText);
        this.nameTag.position.y = this.height + 0.5;
        
        // Add to mesh
        if (this.mesh) {
            this.mesh.add(this.nameTag);
        }
    }
    
    /**
     * Update camera position for human player
     */
    updateCamera() {
        // Position camera at player's eye level
        this.camera.position.set(
            this.position.x,
            this.position.y + GAME_CONSTANTS.PLAYER.CAMERA_HEIGHT,
            this.position.z
        );
    }
    
    /**
     * Throw a snowball
     */
    throwSnowball() {
        // Check if player has snowballs and cooldown has elapsed
        const currentTime = Date.now();
        if (
            this.snowballCount <= 0 ||
            currentTime - this.lastThrowTime < this.throwCooldown
        ) {
            return;
        }
        
        // Decrease snowball count
        this.snowballCount--;
        
        // Set last throw time
        this.lastThrowTime = currentTime;
        
        // Create snowball
        const direction = new THREE.Vector3();
        
        if (this.isHuman) {
            // For human player, use camera direction
            this.camera.getWorldDirection(direction);
        } else {
            // For AI, use mesh forward direction
            this.mesh.getWorldDirection(direction);
        }
        
        // Create snowball at player position + offset in direction
        const spawnPosition = new THREE.Vector3().copy(this.position);
        spawnPosition.y += GAME_CONSTANTS.PLAYER.CAMERA_HEIGHT;
        spawnPosition.add(direction.multiplyScalar(this.radius + this.snowballSize + 0.1));
        
        // Create snowball with player's stats
        // Make sure we're using the current damage value from constants
        const snowballDamage = GAME_CONSTANTS.SNOWBALL.DAMAGE;
        console.log(`Creating snowball with damage: ${snowballDamage}, owner: ${this.id}`);
        
        const snowball = new Snowball(
            this.scene,
            spawnPosition,
            direction,
            this.id,
            snowballDamage, // Use the current damage value directly from constants
            this.snowballSize,
            this.throwSpeed,
            this.throwRange
        );
        
        // Register snowball with physics system
        Game.physics.registerCollider(snowball, 'snowballs');
        
        // Add snowball to game
        Game.snowballs.push(snowball);
        
        // Play throw sound
        // TODO: Add sound effect
        
        // Update UI
        if (this.isHuman && Game && Game.ui) {
            Game.ui.updateSnowballCount(this.snowballCount);
        }
    }
    
    /**
     * Take damage from a hit
     * @param {number} damage - Amount of damage to take
     * @param {string} attackerId - ID of attacker
     */
    takeDamage(damage, attackerId) {
        // Safe zone protection - players in safe zones can't be hit
        if (Physics.isPlayerInSafeZone(this)) {
            console.log(`Player ${this.id} is in safe zone, can't be hit`);
            return;
        }
        
        // Debug log to show actual damage being applied
        console.log(`Player ${this.id} taking damage: ${damage} from ${attackerId}`);
        
        // Reduce health - ensure we're using the passed damage value
        this.health -= damage;
        
        // Check if eliminated
        if (this.health <= 0) {
            this.health = 0;
            this.eliminate(attackerId);
        }
        
        // Update UI if human player
        if (this.isHuman) {
            if (Game && Game.ui) {
                Game.ui.updateHealth(this.health);
                Game.ui.showHitIndicator();
            }
        }
        
        // Update health display for all players
        this.updateNameTag();
    }
    
    /**
     * Eliminate player
     * @param {string} attackerId - ID of attacker
     */
    eliminate(attackerId) {
        this.isAlive = false;
        
        // Award points to attacker
        const attacker = Game.getPlayerById(attackerId);
        if (attacker) {
            attacker.score += GAME_CONSTANTS.SCORING.ELIMINATION_POINTS;
            
            // Update UI if attacker is human
            if (attacker.isHuman) {
                if (Game && Game.ui) {
                    Game.ui.updateScore(attacker.score);
                }
            }
        }
        
        // Remove player mesh from scene
        this.scene.remove(this.mesh);
        
        // Show elimination message
        if (this.isHuman) {
            if (Game && Game.ui) {
                Game.ui.showGameOver(false);
            }
        } else if (attacker && attacker.isHuman) {
            Utils.showMessage(`You eliminated AI ${this.id}!`);
        }
        
        // Check if game is over
        Game.checkGameOver();
    }
    
    /**
     * Apply knockback force to player
     * @param {THREE.Vector3} direction - Direction of knockback
     * @param {number} force - Force of knockback
     */
    applyKnockback(direction, force) {
        this.velocity.x += direction.x * force;
        this.velocity.z += direction.z * force;
    }
        
    /**
     * Replenish snowballs when in igloo
     */
    replenishSnowballs() {
        const currentTime = Date.now();
        const timeSinceLastReplenish = (currentTime - this.lastReplenishTime) / 1000; // Convert to seconds
        
        if (timeSinceLastReplenish >= 1 / GAME_CONSTANTS.SNOWBALL.REPLENISH_RATE) {
            if (this.snowballCount < this.maxSnowballCount) {
                this.snowballCount++;
                this.lastReplenishTime = currentTime;
                
                // Update UI if human player
                if (this.isHuman) {
                    if (Game && Game.ui) {
                        Game.ui.updateSnowballCount(this.snowballCount);
                    }
                }
            }
        }
    }
    
    /**
     * Collect a diamond and update player stats
     * @param {Object} diamond - Diamond object
     */
    collectDiamond() {
        this.diamondCount++;
        this.score += GAME_CONSTANTS.SCORING.DIAMOND_POINTS;
        
        // Update UI if human player
        if (this.isHuman) {
            if (Game && Game.ui) {
                Game.ui.updateDiamondCount(this.diamondCount);
                Game.ui.updateScore(this.score);
                Game.ui.showDiamondIndicator();
            }
            
            // Show upgrade menu
            if (Game && Game.ui) {
                Game.ui.showUpgradeMenu();
            }
        }
    }
    
    /**
     * Apply an upgrade
     * @param {string} upgradeType - Type of upgrade (speed, damage, range, size, capacity)
     */
    applyUpgrade(upgradeType) {
        // Check if player has enough diamonds
        const upgradeCost = GAME_CONSTANTS.UPGRADES[upgradeType.toUpperCase()].COST;
        
        if (this.diamondCount < upgradeCost) {
            return false;
        }
        
        // Check if upgrade is at max level
        const maxLevel = GAME_CONSTANTS.UPGRADES[upgradeType.toUpperCase()].MAX_LEVEL;
        
        if (this.upgrades[upgradeType] >= maxLevel) {
            return false;
        }
        
        // Deduct diamonds
        this.diamondCount -= upgradeCost;
        
        // Increment upgrade level
        this.upgrades[upgradeType]++;
        
        // Apply upgrade effect
        const increment = GAME_CONSTANTS.UPGRADES[upgradeType.toUpperCase()].INCREMENT;
        
        switch (upgradeType) {
            case 'speed':
                this.moveSpeed += increment;
                break;
            case 'damage':
                this.snowballDamage += increment;
                break;
            case 'range':
                this.throwRange += increment;
                break;
            case 'size':
                this.snowballSize += increment;
                break;
            case 'capacity':
                this.maxSnowballCount += increment;
                break;
        }
        
        // Update UI if human player
        if (this.isHuman) {
            if (Game && Game.ui) {
                Game.ui.updateDiamondCount(this.diamondCount);
            }
            Utils.showMessage(`Upgraded ${upgradeType}!`);
        }
        
        return true;
    }
    
    /**
     * Set player's igloo position
     * @param {THREE.Vector3} position - Igloo position
     */
    setIglooPosition(position) {
        this.iglooPosition = position;
    }
    
    /**
     * Reset player to initial state
     */
    reset() {
        // Reset stats
        this.health = GAME_CONSTANTS.PLAYER.INITIAL_HEALTH;
        this.snowballCount = GAME_CONSTANTS.SNOWBALL.INITIAL_COUNT;
        this.maxSnowballCount = GAME_CONSTANTS.SNOWBALL.INITIAL_COUNT;
        this.diamondCount = 0;
        this.score = 0;
        
        // Reset movement
        this.velocity.set(0, 0, 0);
        this.moveSpeed = GAME_CONSTANTS.PLAYER.MOVEMENT_SPEED;
        
        // Reset snowball properties
        this.snowballDamage = GAME_CONSTANTS.SNOWBALL.DAMAGE;
        this.snowballSize = GAME_CONSTANTS.SNOWBALL.RADIUS;
        this.throwRange = GAME_CONSTANTS.SNOWBALL.MAX_THROW_DISTANCE;
        
        // Reset status
        this.isAlive = true;
        this.isInIgloo = false;
        
        // Reset upgrades
        for (const upgrade in this.upgrades) {
            this.upgrades[upgrade] = 0;
        }
        
        // Add mesh back to scene
        if (!this.scene.children.includes(this.mesh)) {
            this.scene.add(this.mesh);
        }
        
        // Update UI if human player
        if (this.isHuman) {
            if (Game && Game.ui) {
                Game.ui.updateHealth(this.health);
                Game.ui.updateSnowballCount(this.snowballCount);
                Game.ui.updateDiamondCount(this.diamondCount);
                Game.ui.updateScore(this.score);
            }
        }
    }
}

// Expose SnowBrawlPlayer to the global scope as Player to avoid conflicts with built-in objects
// and to maintain compatibility with existing code
window.Player = SnowBrawlPlayer;
