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
        
        // Hit effect properties
        this.isHit = false;
        this.hitTime = 0;
        this.hitDuration = GAME_CONSTANTS.PLAYER.HIT_EFFECT_DURATION;
        this.hitFlashCount = GAME_CONSTANTS.PLAYER.HIT_FLASH_COUNT;
        this.originalColor = null; // will store the original mesh color
        
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
        
        // Determine player color based on whether they're human or AI
        let playerColor;
        
        if (this.isHuman) {
            // Human player gets a bright blue color
            playerColor = 0x0088FF; // Bright blue for human player
        } else {
            // AI players get colors based on their ID to ensure they're all different
            // Extract number from AI ID (e.g., 'ai-1' becomes 1)
            const aiNumber = parseInt(this.id.replace('ai-', ''), 10) || 0;
            
            // Use a golden ratio multiplier to get well-distributed colors
            const hue = (aiNumber * 137.5) % 360; // 137.5° is approximately the golden angle in degrees
            playerColor = new THREE.Color().setHSL(hue / 360, 0.8, 0.5).getHex();
        }
        
        const material = new THREE.MeshLambertMaterial({ color: playerColor });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Create player name tag with health display
        this.updateNameTag();
        this.nameTag.position.y = this.height + 0.5;
        this.mesh.add(this.nameTag);
        
        // Create health bar
        this.createHealthBar();
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
        
        // Update health bar
        if (this.healthBarSprite) {
            this.updateHealthBar();
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
        
        // Choose text color based on health percentage
        let healthColor = '#00ff00'; // Green for good health
        if (healthPercent < 30) {
            healthColor = '#ff0000'; // Red for low health
        } else if (healthPercent < 70) {
            healthColor = '#ffff00'; // Yellow for medium health
        }
        
        const nameText = this.isHuman ? `You (${healthPercent}%)` : `AI ${this.id} (${healthPercent}%)`;
        
        // Create text sprite with color based on health
        this.nameTag = Utils.createTextSprite(nameText, {
            fontColor: healthColor,
            fontSize: 24,
            borderColor: '#000000',
            borderThickness: 4
        });
        
        // Position the name tag higher above the character model
        this.nameTag.position.y = this.height * 1.5;
        
        // Make the name tag larger and more visible
        this.nameTag.scale.set(1.5, 1.5, 1.5);
        
        // Add to mesh
        if (this.mesh) {
            this.mesh.add(this.nameTag);
        }
        
        // Update health bar
        this.updateHealthBar();
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
     * Create a health bar above the player using a sprite
     */
    createHealthBar() {
        // Create a canvas to draw the health bar
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        this.healthBarCanvas = canvas;
        this.healthBarContext = canvas.getContext('2d');
        
        // Draw the initial health bar
        this.drawHealthBarOnCanvas();
        
        // Create a sprite using the canvas as a texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false // Ensure it's always visible
        });
        
        this.healthBarSprite = new THREE.Sprite(spriteMaterial);
        
        // Make the sprite larger
        this.healthBarSprite.scale.set(5, 1.2, 1);
        
        // Position above player's head
        this.healthBarSprite.position.y = this.height + 3.0;
        
        // Add to scene directly instead of to the mesh
        // This ensures it's not affected by the mesh's transformations
        if (Game && Game.scene) {
            Game.scene.add(this.healthBarSprite);
            this.healthBarInScene = true;
        } else if (this.mesh) {
            // Fallback to adding to mesh if scene not available
            this.mesh.add(this.healthBarSprite);
            this.healthBarInScene = false;
        }
    }
    
    /**
     * Draw the health bar on the canvas
     */
    drawHealthBarOnCanvas() {
        if (!this.healthBarCanvas || !this.healthBarContext) return;
        
        const ctx = this.healthBarContext;
        const canvas = this.healthBarCanvas;
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate health percentage
        const healthPercent = this.health / GAME_CONSTANTS.PLAYER.INITIAL_HEALTH;
        
        // Draw border (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background (black)
        ctx.fillStyle = '#000000';
        ctx.fillRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Choose color based on health percentage
        let healthColor;
        if (healthPercent < 0.3) {
            healthColor = '#FF0000'; // Red for low health
        } else if (healthPercent < 0.7) {
            healthColor = '#FFFF00'; // Yellow for medium health
        } else {
            healthColor = '#00FF00'; // Green for good health
        }
        
        // Draw health bar
        ctx.fillStyle = healthColor;
        const barWidth = (canvas.width - 8) * healthPercent;
        ctx.fillRect(4, 4, barWidth, canvas.height - 8);
        
        // Add health percentage text
        const healthText = Math.round(healthPercent * 100) + '%';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        
        // Draw text with outline for better visibility
        const textX = canvas.width / 2;
        const textY = canvas.height / 2;
        ctx.strokeText(healthText, textX, textY);
        ctx.fillText(healthText, textX, textY);
    }
    
    /**
     * Update the health bar to reflect current health
     */
    updateHealthBar() {
        if (!this.healthBarSprite) return;
        
        // Update the canvas
        this.drawHealthBarOnCanvas();
        
        // Update the sprite position to follow the player
        if (this.healthBarInScene && this.mesh) {
            // Get the player's world position
            const playerWorldPos = new THREE.Vector3();
            this.mesh.getWorldPosition(playerWorldPos);
            
            // Position the health bar above the player
            this.healthBarSprite.position.x = playerWorldPos.x;
            this.healthBarSprite.position.z = playerWorldPos.z;
            this.healthBarSprite.position.y = playerWorldPos.y + this.height + 3.0;
        }
        
        // Update the texture
        if (this.healthBarSprite.material && this.healthBarSprite.material.map) {
            this.healthBarSprite.material.map.needsUpdate = true;
        }
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
            Game.ui.updateSnowballCount(this.snowballCount, this.maxSnowballs);
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
            return; // Don't apply hit effect if eliminated
        }
        
        // Get attacker to calculate knockback direction
        const attacker = Game.getPlayerById(attackerId);
        if (attacker) {
            // Calculate direction from attacker to this player
            const knockbackDir = new THREE.Vector3()
                .subVectors(this.position, attacker.position)
                .normalize();
            
            // Apply knockback based on damage
            const knockbackForce = damage * 0.5;
            this.applyKnockback(knockbackDir, knockbackForce);
        }
        
        // Apply hit effect - flash the player's color
        this.applyHitEffect();
        
        // Update UI if human player
        if (this.isHuman) {
            if (Game && Game.ui) {
                Game.ui.updateHealth(this.health);
                Game.ui.showHitIndicator();
            }
        }
        
        // Update health display for all players
        this.updateNameTag();
        
        // Update the 3D health bar
        this.updateHealthBar();
    }
    
    /**
     * Apply a visual hit effect to the player
     */
    applyHitEffect() {
        // Only apply if we have a valid mesh
        if (!this.mesh) {
            return;
        }
        
        // Store original colors if not already stored
        if (!this.originalColors) {
            this.originalColors = new Map();
            
            // Check if this is a character model (has children with materials)
            if (this.mesh.children && this.mesh.children.length > 0) {
                // Store original colors for all mesh children
                this.mesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        // Handle both single materials and material arrays
                        if (Array.isArray(child.material)) {
                            // For multi-material objects
                            const colorArray = [];
                            child.material.forEach((mat, index) => {
                                if (mat.color) {
                                    colorArray[index] = mat.color.clone();
                                }
                            });
                            this.originalColors.set(child.uuid, colorArray);
                        } else if (child.material.color) {
                            // For single material objects
                            this.originalColors.set(child.uuid, child.material.color.clone());
                        }
                    }
                });
            } else if (this.mesh.material && this.mesh.material.color) {
                // For simple meshes with a single material
                this.originalColors.set(this.mesh.uuid, this.mesh.material.color.clone());
            }
        }
        
        // Set hit state
        this.isHit = true;
        this.hitTime = Date.now();
        this.hitDuration = 500; // 500ms hit effect
        this.hitFlashCount = 3; // Flash 3 times
        
        // Apply hit color to all materials (bright red)
        this.applyColorToAllMaterials(0xFF0000);
        
        // Create snow particle effect for hit
        this.createHitParticles();
        
        // Schedule the hit effect update
        this.updateHitEffect();
    }
    
    /**
     * Apply a color to all materials in the mesh hierarchy
     * @param {number} colorValue - Hex color value to apply
     */
    applyColorToAllMaterials(colorValue) {
        if (!this.mesh) return;
        
        // Check if this is a character model with children
        if (this.mesh.children && this.mesh.children.length > 0) {
            // Apply color to all mesh children
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Handle both single materials and material arrays
                    if (Array.isArray(child.material)) {
                        // For multi-material objects
                        child.material.forEach(mat => {
                            if (mat.color) {
                                mat.color.set(colorValue);
                            }
                        });
                    } else if (child.material.color) {
                        // For single material objects
                        child.material.color.set(colorValue);
                    }
                }
            });
        } else if (this.mesh.material && this.mesh.material.color) {
            // For simple meshes with a single material
            this.mesh.material.color.set(colorValue);
        }
    }
    
    /**
     * Restore original colors to all materials
     */
    restoreOriginalColors() {
        if (!this.mesh || !this.originalColors) return;
        
        // Check if this is a character model with children
        if (this.mesh.children && this.mesh.children.length > 0) {
            // Restore original colors to all mesh children
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    const originalColor = this.originalColors.get(child.uuid);
                    if (originalColor) {
                        if (Array.isArray(child.material) && Array.isArray(originalColor)) {
                            // For multi-material objects
                            child.material.forEach((mat, index) => {
                                if (mat.color && originalColor[index]) {
                                    mat.color.copy(originalColor[index]);
                                }
                            });
                        } else if (!Array.isArray(child.material) && !Array.isArray(originalColor)) {
                            // For single material objects
                            child.material.color.copy(originalColor);
                        }
                    }
                }
            });
        } else if (this.mesh.material && this.mesh.material.color) {
            // For simple meshes with a single material
            const originalColor = this.originalColors.get(this.mesh.uuid);
            if (originalColor) {
                this.mesh.material.color.copy(originalColor);
            }
        }
    }
    
    /**
     * Update the hit effect animation
     */
    updateHitEffect() {
        if (!this.isHit || !this.mesh) return;
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.hitTime;
        
        // Check if hit effect duration has expired
        if (elapsedTime >= this.hitDuration) {
            // Reset to original colors
            this.restoreOriginalColors();
            this.isHit = false;
            return;
        }
        
        // Calculate flash state based on elapsed time
        const flashPeriod = this.hitDuration / (this.hitFlashCount * 2);
        const flashState = Math.floor(elapsedTime / flashPeriod) % 2;
        
        // Toggle between red and original colors
        if (flashState === 0) {
            this.applyColorToAllMaterials(0xFF0000);
        } else {
            this.restoreOriginalColors();
        }
        
        // Schedule next update
        requestAnimationFrame(() => this.updateHitEffect());
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
        
        // Remove health bar sprite from scene if it exists
        if (this.healthBarSprite) {
            // If health bar was added directly to the scene
            if (this.healthBarInScene && Game && Game.scene) {
                Game.scene.remove(this.healthBarSprite);
            } else if (this.mesh) {
                // If health bar was added to the mesh
                this.mesh.remove(this.healthBarSprite);
            }
            
            // Dispose of health bar sprite material
            if (this.healthBarSprite.material) {
                if (this.healthBarSprite.material.map) {
                    this.healthBarSprite.material.map.dispose();
                }
                this.healthBarSprite.material.dispose();
            }
            
            // Clear the reference
            this.healthBarSprite = null;
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
     * Create particle effect for hit
     */
    createHitParticles() {
        // Clean up any existing hit particles
        if (this.hitParticles) {
            this.hitParticles.forEach(particle => {
                if (particle.mesh && particle.mesh.parent) {
                    this.scene.remove(particle.mesh);
                }
            });
        }
        
        // Create new particles
        const particleCount = 20; // More particles for better effect
        const particleGeometry = new THREE.SphereGeometry(0.2, 4, 4);
        
        // Determine base color for particles
        let particleBaseColor = 0xFFFFFF; // Default white
        
        // Try to extract a color from the mesh to make particles match the character
        if (this.mesh) {
            // For character models, try to find a body part to get color from
            let colorFound = false;
            
            if (this.mesh.children && this.mesh.children.length > 0) {
                this.mesh.traverse((child) => {
                    if (!colorFound && child.isMesh && child.material && child.material.color) {
                        particleBaseColor = child.material.color.getHex();
                        colorFound = true;
                    }
                });
            } else if (this.mesh.material && this.mesh.material.color) {
                particleBaseColor = this.mesh.material.color.getHex();
            }
        }
        
        this.hitParticles = [];
        
        // Calculate position at the center of the mesh
        const position = new THREE.Vector3();
        this.mesh.getWorldPosition(position);
        
        // Adjust height to be around the center of the character
        position.y += this.height / 2;
        
        for (let i = 0; i < particleCount; i++) {
            // Create particles with varying colors based on the character's color
            const hue = new THREE.Color(particleBaseColor).getHSL({}).h;
            const saturation = 0.8;
            const lightness = Utils.randomRange(0.5, 0.9); // Varying brightness
            
            const particleColor = new THREE.Color().setHSL(
                hue, 
                saturation, 
                lightness
            );
            
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: particleColor,
                transparent: true,
                opacity: 0.9
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Add some random offset to start position
            particle.position.x += Utils.randomRange(-0.7, 0.7);
            particle.position.y += Utils.randomRange(-0.7, 0.7);
            particle.position.z += Utils.randomRange(-0.7, 0.7);
            
            // Random velocity for particle - more explosive
            const velocity = new THREE.Vector3(
                Utils.randomRange(-6, 6),
                Utils.randomRange(3, 10), // More upward momentum
                Utils.randomRange(-6, 6)
            );
            
            this.scene.add(particle);
            this.hitParticles.push({
                mesh: particle,
                velocity: velocity,
                lifetime: Utils.randomRange(0.7, 1.2), // Longer lifetime
                rotationSpeed: new THREE.Vector3(
                    Utils.randomRange(-5, 5),
                    Utils.randomRange(-5, 5),
                    Utils.randomRange(-5, 5)
                )
            });
        }
        
        // Set up animation for particles
        let lastTime = performance.now();
        
        const updateParticles = (time) => {
            const deltaTime = Math.min((time - lastTime) / 1000, 0.1);
            lastTime = time;
            
            let allDone = true;
            
            for (const particle of this.hitParticles) {
                if (particle.lifetime > 0) {
                    // Update position
                    particle.mesh.position.x += particle.velocity.x * deltaTime;
                    particle.mesh.position.y += particle.velocity.y * deltaTime;
                    particle.mesh.position.z += particle.velocity.z * deltaTime;
                    
                    // Apply gravity
                    particle.velocity.y -= GAME_CONSTANTS.PHYSICS.GRAVITY * 2 * deltaTime;
                    
                    // Slow down horizontal movement with air resistance
                    particle.velocity.x *= 0.95;
                    particle.velocity.z *= 0.95;
                    
                    // Add rotation to particles for more dynamic effect
                    if (particle.rotationSpeed) {
                        particle.mesh.rotation.x += particle.rotationSpeed.x * deltaTime;
                        particle.mesh.rotation.y += particle.rotationSpeed.y * deltaTime;
                        particle.mesh.rotation.z += particle.rotationSpeed.z * deltaTime;
                    }
                    
                    // Reduce lifetime
                    particle.lifetime -= deltaTime;
                    
                    // Fade out
                    particle.mesh.material.opacity = particle.lifetime;
                    
                    // Scale down as lifetime decreases
                    const scale = Math.max(0.1, particle.lifetime);
                    particle.mesh.scale.set(scale, scale, scale);
                    
                    allDone = false;
                } else if (particle.mesh && particle.mesh.parent) {
                    // Remove particle
                    this.scene.remove(particle.mesh);
                }
            }
            
            if (!allDone) {
                requestAnimationFrame(updateParticles);
            }
        };
        
        requestAnimationFrame(updateParticles);
    }
    
    /**
     * Apply knockback force to player
     * @param {THREE.Vector3} direction - Direction of knockback
     * @param {number} force - Force of knockback
     */
    applyKnockback(direction, force) {
        // Apply stronger horizontal knockback
        this.velocity.x += direction.x * force * 2.5; // Increased multiplier for more visible effect
        this.velocity.z += direction.z * force * 2.5;
        
        // Add a larger vertical component to make the knockback more visible
        // This creates a more pronounced "hop" effect when hit
        this.velocity.y += force * 1.2; // Increased vertical force
        
        // Ensure player is not on ground during knockback
        this.isOnGround = false;
        
        // Add a small random rotation to make the knockback feel more impactful
        // This is especially effective for character models
        if (!this.isHuman) { // Only for AI players to avoid disorienting the human player
            // Add a small random rotation around the Y axis
            const rotationImpulse = (Math.random() - 0.5) * Math.PI * 0.25; // Up to 45 degrees rotation
            if (this.mesh) {
                this.mesh.rotation.y += rotationImpulse;
            }
        }
        
        console.log(`Applied knockback to player ${this.id}: velocity=(${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)}, ${this.velocity.z.toFixed(2)})`);
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
    
    /**
     * Clean up resources when player is removed
     */
    dispose() {
        // Remove health bar sprite from scene if it was added directly to the scene
        if (this.healthBarInScene && this.healthBarSprite && Game && Game.scene) {
            Game.scene.remove(this.healthBarSprite);
        }
        
        // Dispose of health bar sprite material
        if (this.healthBarSprite && this.healthBarSprite.material) {
            if (this.healthBarSprite.material.map) {
                this.healthBarSprite.material.map.dispose();
            }
            this.healthBarSprite.material.dispose();
        }
        
        // Remove from scene
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        
        // Dispose of geometries and materials
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}

// Expose SnowBrawlPlayer to the global scope as Player to avoid conflicts with built-in objects
// and to maintain compatibility with existing code
window.Player = SnowBrawlPlayer;
