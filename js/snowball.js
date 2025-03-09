/**
 * Snowball class for SnowBrawl game
 * Handles snowball physics, collisions, and lifecycle
 */

// Using SnowBrawlSnowball instead of Snowball to avoid conflicts with built-in globals
class SnowBrawlSnowball {
    constructor(scene, position, direction, ownerId, damage, radius, speed, maxDistance) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = direction.clone().multiplyScalar(speed);
        this.ownerId = ownerId;
        this.damage = damage;
        this.radius = radius;
        this.speed = speed;
        this.maxDistance = maxDistance;
        this.hasHit = false;
        this.creationTime = Date.now();
        this.lifetime = GAME_CONSTANTS.SNOWBALL.LIFETIME;
        
        // Distance tracking
        this.initialPosition = position.clone();
        this.distanceTraveled = 0;
        
        // Create snowball mesh
        this.createSnowballMesh();
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    /**
     * Create the snowball's 3D mesh
     */
    createSnowballMesh() {
        const geometry = new THREE.SphereGeometry(this.radius, 8, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Add trail effect
        this.createTrail();
    }
    
    /**
     * Create a trail effect for the snowball
     */
    createTrail() {
        // Create a simple trail using small spheres
        this.trail = [];
        const trailLength = 5;
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.5
        });
        
        for (let i = 0; i < trailLength; i++) {
            const size = this.radius * (1 - i / trailLength);
            const trailGeometry = new THREE.SphereGeometry(size, 4, 4);
            const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial.clone());
            trailMesh.material.opacity = 0.5 * (1 - i / trailLength);
            trailMesh.visible = false;
            
            this.scene.add(trailMesh);
            this.trail.push({
                mesh: trailMesh,
                position: this.position.clone(),
                age: i * 0.05
            });
        }
    }
    
    /**
     * Update snowball state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // If we've already hit something, don't continue
        if (this.hasHit) return;
        
        // Check lifetime
        if (Date.now() - this.creationTime > this.lifetime) {
            this.remove();
            return;
        }
        
        // Update position from physics system
        this.mesh.position.copy(this.position);

        // Update trail
        this.updateTrail(deltaTime);
        
        // Calculate distance traveled
        this.distanceTraveled = this.position.distanceTo(this.initialPosition);
        
        // Check if snowball has traveled its maximum distance
        if (this.distanceTraveled > this.maxDistance) {
            this.remove();
        }
        
        // Apply air resistance
        const airResistance = GAME_CONSTANTS.SNOWBALL.AIR_RESISTANCE;
        this.velocity.x *= (1 - airResistance);
        this.velocity.z *= (1 - airResistance);
    }
    
    /**
     * Update the snowball's trail effect
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateTrail(deltaTime) {
        // Update trail positions
        for (let i = this.trail.length - 1; i >= 0; i--) {
            const trailPoint = this.trail[i];
            
            // Increase age
            trailPoint.age += deltaTime;
            
            if (i === 0) {
                // First trail point follows the snowball with a delay
                trailPoint.position.lerp(this.position, 0.5);
            } else {
                // Other trail points follow the previous point
                trailPoint.position.lerp(this.trail[i - 1].position, 0.5);
            }
            
            // Update mesh position
            trailPoint.mesh.position.copy(trailPoint.position);
            trailPoint.mesh.visible = true;
        }
    }
    
    /**
     * Handle snowball hit
     */
    hit() {
        if (this.hasHit) return;
        
        this.hasHit = true;
        
        // Create hit effect
        this.createHitEffect();
        
        // Schedule for removal
        setTimeout(() => {
            this.remove();
        }, 100);
    }
    
    /**
     * Check for hits against AI players directly from the snowball
     * This is a special case to ensure player snowballs can hit AI players
     */
    checkAIPlayerHits() {
        // Skip if already hit
        if (this.hasHit) return;
        
        try {
            // Check if Game.aiPlayers exists
            if (!window.Game) {
                console.error('Game is not available for direct hit detection');
                return;
            }
            
            if (!window.Game.aiPlayers || !window.Game.aiPlayers.length) {
                console.error(`Game.aiPlayers is not available or empty: ${JSON.stringify(window.Game.aiPlayers)}`);
                return;
            }
                        
            // Check for hits against AI players with reasonable distance checks
            for (const ai of window.Game.aiPlayers) {
                // Skip invalid or dead AI players
                if (!ai || !ai.isAlive) {
                    continue;
                }
                
                // Calculate distance to AI player
                const distance = this.position.distanceTo(ai.position);
                const hitThreshold = this.radius + ai.radius * 1.5; // Reasonable hit threshold
                                
                // Skip AI players in safe zone (respecting the game mechanics)
                if (ai.isInSafeZone) {
                    console.log(`AI ${ai.id} is in safe zone, skipping`);
                    continue;
                }
                
                // If close enough, register a hit
                if (distance < hitThreshold) {
                    console.log(`Snowball hit AI ${ai.id} at distance ${distance.toFixed(1)}`);
                    
                    // Apply damage to AI player
                    try {
                        ai.takeDamage(this.damage, this.ownerId);
                    } catch (damageError) {
                        console.error(`Error applying damage to AI ${ai.id}: ${damageError.message}`);
                    }
                    
                    // Mark as hit
                    this.hit();
                    return;
                }
            }
        } catch (error) {
            console.error(`CRITICAL ERROR in checkAIPlayerHits: ${error.message}`);
            console.error(error.stack);
        }
    }
    
    /**
     * Create a visual effect when snowball hits something
     */
    createHitEffect() {
        // Create particle effect for hit
        const particleCount = 10;
        const particleGeometry = new THREE.SphereGeometry(this.radius / 3, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8
        });
        
        this.hitParticles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            particle.position.copy(this.position);
            
            // Random velocity for particle
            const velocity = new THREE.Vector3(
                Utils.randomRange(-1, 1),
                Utils.randomRange(0.5, 2),
                Utils.randomRange(-1, 1)
            ).normalize().multiplyScalar(Utils.randomRange(1, 3));
            
            this.scene.add(particle);
            this.hitParticles.push({
                mesh: particle,
                velocity: velocity,
                lifetime: Utils.randomRange(0.2, 0.5)
            });
        }
        
        // Hide the snowball mesh
        this.mesh.visible = false;
        
        // Hide trail
        for (const trailPoint of this.trail) {
            trailPoint.mesh.visible = false;
        }
        
        // Define lastTime before using it
        let lastTime = performance.now();
        
        // Update hit particles
        const updateHitParticles = (deltaTime) => {
            let allDone = true;
            
            for (const particle of this.hitParticles) {
                if (particle.lifetime > 0) {
                    // Update position
                    particle.mesh.position.x += particle.velocity.x * deltaTime;
                    particle.mesh.position.y += particle.velocity.y * deltaTime;
                    particle.mesh.position.z += particle.velocity.z * deltaTime;
                    
                    // Apply gravity
                    particle.velocity.y -= GAME_CONSTANTS.PHYSICS.GRAVITY * deltaTime;
                    
                    // Reduce lifetime
                    particle.lifetime -= deltaTime;
                    
                    // Fade out
                    particle.mesh.material.opacity = particle.lifetime * 2;
                    
                    allDone = false;
                } else {
                    // Remove particle
                    this.scene.remove(particle.mesh);
                }
            }
            
            if (!allDone) {
                requestAnimationFrame((time) => {
                    const delta = Math.min((time - lastTime) / 1000, 0.1);
                    lastTime = time;
                    updateHitParticles(delta);
                });
            }
        };
        
        requestAnimationFrame((time) => {
            lastTime = time;
            updateHitParticles(0.016);
        });
    }
    
    /**
     * Remove snowball from scene
     */
    remove() {
        // Remove from physics system
        Game.physics.unregisterCollider(this, 'snowballs');
        
        // Remove from game
        const index = Game.snowballs.indexOf(this);
        if (index !== -1) {
            Game.snowballs.splice(index, 1);
        }
        
        // Remove mesh from scene
        this.scene.remove(this.mesh);
        
        // Remove trail from scene
        for (const trailPoint of this.trail) {
            this.scene.remove(trailPoint.mesh);
        }
        
        // Remove hit particles from scene
        if (this.hitParticles) {
            for (const particle of this.hitParticles) {
                this.scene.remove(particle.mesh);
            }
        }
    }
}

// Expose SnowBrawlSnowball to the global scope as Snowball to avoid conflicts with built-in objects
// and to maintain compatibility with existing code
window.Snowball = SnowBrawlSnowball;
