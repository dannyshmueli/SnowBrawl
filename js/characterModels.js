/**
 * Character Models for SnowBrawl game
 * Provides cute character models for AI players with progression to more intimidating forms
 */

// Using SnowBrawlCharacterModels to avoid conflicts with built-in globals
class SnowBrawlCharacterModels {
    /**
     * Create a character model
     * @param {THREE.Scene} scene - The scene to add the character to
     * @param {string} id - The ID of the character
     * @param {number} difficultyMultiplier - The difficulty multiplier (affects appearance)
     * @param {number} colorValue - The color value for the character
     * @returns {THREE.Group} The character model group
     */
    static createCharacter(scene, id, difficultyMultiplier = 1.0, colorValue) {
        // Create a group to hold all character parts
        const characterGroup = new THREE.Group();
        
        // Extract AI number from ID for deterministic randomization
        const aiNumber = parseInt(id.replace('ai-', ''), 10) || 0;
        
        // Use the aiNumber as a seed for pseudo-random values
        const seed = aiNumber * 137.5;
        
        // Helper function for deterministic random values
        const random = (min, max, float = false) => {
            const val = ((Math.sin(seed * (min + max)) + 1) / 2) * (max - min) + min;
            return float ? val : Math.floor(val);
        };
        
        // Determine character dimensions based on difficulty
        // As difficulty increases, characters get bigger and less cute
        const roundFactor = Math.min(difficultyMultiplier, 2.5); // Cap at 2.5x for reasonable sizes
        
        const dimensions = {
            head: random(3, 5, true) * (roundFactor > 1.5 ? 0.8 : 1), // Smaller head in later rounds
            bodyWidth: random(2, 4, true) * roundFactor,
            bodyHeight: random(2, 5, true) * roundFactor,
            legHeight: random(1, 3, true) * roundFactor
        };
        
        // Create materials with the provided color
        const headHue = colorValue ? new THREE.Color(colorValue) : new THREE.Color().setHSL(random(0, 360, true) / 360, 0.3, 0.5);
        const bodyHue = colorValue ? new THREE.Color(colorValue) : new THREE.Color().setHSL(random(0, 360, true) / 360, 0.85, 0.5);
        
        const headMaterial = new THREE.MeshLambertMaterial({ color: headHue });
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyHue });
        
        // Create body
        const bodyGeometry = new THREE.BoxGeometry(
            dimensions.bodyWidth, 
            dimensions.bodyHeight, 
            dimensions.bodyWidth
        );
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        characterGroup.add(body);
        
        // Create head
        const headGroup = new THREE.Group();
        const headGeometry = new THREE.BoxGeometry(
            dimensions.head, 
            dimensions.head, 
            dimensions.head
        );
        const head = new THREE.Mesh(headGeometry, headMaterial);
        headGroup.add(head);
        characterGroup.add(headGroup);
        
        // Position head on top of body
        headGroup.position.y = (dimensions.bodyHeight * 0.5) + (dimensions.head * 0.5) + 0.2;
        
        // Create eyes (only for cute characters in early rounds)
        if (difficultyMultiplier < 1.6) {
            const eyesGroup = new THREE.Group();
            const eyeRadius = random(0.3, 0.5, true);
            const eyeGeometry = new THREE.SphereGeometry(eyeRadius, 12, 8);
            const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x44445c });
            
            // Position eyes
            const eyeX = random(eyeRadius + 0.2, dimensions.head * 0.4 - eyeRadius, true);
            const eyeY = random(0, 0.8, true);
            
            for (let i = 0; i < 2; i++) {
                const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
                const m = i % 2 === 0 ? 1 : -1;
                
                eyesGroup.add(eye);
                eye.position.x = eyeX * m;
            }
            
            headGroup.add(eyesGroup);
            eyesGroup.position.y = eyeY * -0.5;
            eyesGroup.position.z = dimensions.head * 0.5;
        } else {
            // For more intimidating characters, add glowing eyes
            const eyesGroup = new THREE.Group();
            const eyeRadius = random(0.2, 0.4, true);
            const eyeGeometry = new THREE.SphereGeometry(eyeRadius, 12, 8);
            const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000 });
            
            // Position eyes
            const eyeX = random(eyeRadius + 0.2, dimensions.head * 0.4 - eyeRadius, true);
            const eyeY = random(0, 0.8, true);
            
            for (let i = 0; i < 2; i++) {
                const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
                const m = i % 2 === 0 ? 1 : -1;
                
                eyesGroup.add(eye);
                eye.position.x = eyeX * m;
            }
            
            headGroup.add(eyesGroup);
            eyesGroup.position.y = eyeY * -0.5;
            eyesGroup.position.z = dimensions.head * 0.5;
        }
        
        // Create arms
        const armHeight = random(1.5, 3, true) * roundFactor;
        const armWidth = 0.5 * roundFactor;
        const armXPos = dimensions.bodyWidth * 0.5 + armWidth * 0.5;
        
        for (let i = 0; i < 2; i++) {
            const armGroup = new THREE.Group();
            const armGeometry = new THREE.BoxGeometry(armWidth, armHeight, armWidth);
            const arm = new THREE.Mesh(armGeometry, headMaterial);
            const m = i % 2 === 0 ? 1 : -1;
            
            // Add arm to group
            armGroup.add(arm);
            
            // Add group to character
            characterGroup.add(armGroup);
            
            // Position arm
            arm.position.y = armHeight * -0.5;
            armGroup.position.x = m * armXPos;
            armGroup.position.y = dimensions.bodyHeight * 0.3;
            
            // Rotate arm based on difficulty
            const armRotation = difficultyMultiplier > 1.5 ? 
                random(10, 30, true) : // More aggressive stance for later rounds
                random(5, 85, true);   // More relaxed stance for early rounds
                
            armGroup.rotation.z = (Math.PI / 180) * (armRotation * m);
        }
        
        // Create legs
        const legWidth = 0.5 * roundFactor;
        const legsGroup = new THREE.Group();
        
        for (let i = 0; i < 2; i++) {
            const legGeometry = new THREE.BoxGeometry(legWidth, dimensions.legHeight, legWidth);
            const leg = new THREE.Mesh(legGeometry, headMaterial);
            const m = i % 2 === 0 ? 1 : -1;
            
            legsGroup.add(leg);
            leg.position.x = m * dimensions.bodyWidth * 0.3;
            leg.position.y = dimensions.legHeight * -0.5;
        }
        
        characterGroup.add(legsGroup);
        legsGroup.position.y = dimensions.bodyHeight * -0.5;
        
        // Add spikes for more difficult enemies (round 4+)
        if (difficultyMultiplier >= 1.6) {
            const numSpikes = Math.floor(difficultyMultiplier * 2);
            for (let i = 0; i < numSpikes; i++) {
                const spikeHeight = random(0.5, 1.2, true) * roundFactor;
                const spikeGeometry = new THREE.ConeGeometry(0.3 * roundFactor, spikeHeight, 4);
                const spike = new THREE.Mesh(spikeGeometry, new THREE.MeshLambertMaterial({ color: 0x444444 }));
                
                // Position spike on the head
                const angle = (i / numSpikes) * Math.PI * 2;
                const radius = dimensions.head * 0.4;
                spike.position.x = Math.cos(angle) * radius;
                spike.position.z = Math.sin(angle) * radius;
                spike.position.y = dimensions.head * 0.5;
                
                // Rotate spike to point outward
                spike.rotation.x = Math.PI / 2;
                spike.rotation.z = -angle;
                
                headGroup.add(spike);
            }
        }
        
        // Scale the entire character to match the player's height but make them larger
        const playerHeight = GAME_CONSTANTS.PLAYER.HEIGHT;
        const characterHeight = dimensions.bodyHeight + dimensions.head + dimensions.legHeight;
        const scale = (playerHeight / characterHeight) * 2.5; // Make characters 50% larger
        characterGroup.scale.set(scale, scale, scale);
        
        // Position character so its feet are at y=0
        characterGroup.position.y = 0;//playerHeight / 2;
        
        return characterGroup;
    }
}

// Expose SnowBrawlCharacterModels to the global scope
window.CharacterModels = SnowBrawlCharacterModels;
