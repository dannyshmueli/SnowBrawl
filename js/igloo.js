/**
 * Igloo class for SnowBrawl game
 * Handles the creation and management of player igloos
 */

class Igloo {
    /**
     * Create a new igloo
     * @param {THREE.Scene} scene - The scene to add the igloo to
     * @param {THREE.Vector3} position - Position of the igloo
     * @param {number} entranceDirection - Direction of the entrance in radians (0 = positive X axis)
     * @param {string} ownerId - ID of the player who owns this igloo
     * @param {number} playerColor - Color to use for the igloo (hex value)
     */
    constructor(scene, position, entranceDirection = 0, ownerId = null, playerColor = null) {
        this.scene = scene;
        this.position = position;
        this.entranceDirection = entranceDirection;
        this.ownerId = ownerId; // Store the owner's ID
        this.playerColor = playerColor; // Store the player's color directly
        this.meshes = [];
        
        // Default color if none provided
        if (this.playerColor === null) {
            if (this.ownerId === 'player') {
                // Human player gets a bright blue color
                this.playerColor = 0x0088FF;
            } else if (this.ownerId && this.ownerId.includes('ai-')) {
                // AI players get colors based on their ID
                const aiNumber = parseInt(this.ownerId.replace('ai-', ''), 10) || 0;
                const hue = (aiNumber * 137.5) % 360;
                this.playerColor = new THREE.Color().setHSL(hue / 360, 0.8, 0.5).getHex();
            } else {
                // Default white color
                this.playerColor = 0xEEEEEE;
            }
        }
        
        // Igloo dimensions from constants
        this.width = GAME_CONSTANTS.IGLOO.WIDTH;
        this.height = GAME_CONSTANTS.IGLOO.HEIGHT;
        this.depth = GAME_CONSTANTS.IGLOO.DEPTH;
        this.wallThickness = GAME_CONSTANTS.IGLOO.WALL_THICKNESS;
        this.entranceWidth = GAME_CONSTANTS.IGLOO.ENTRANCE_WIDTH;
        this.entranceHeight = GAME_CONSTANTS.IGLOO.ENTRANCE_HEIGHT;
        
        // Verify we're using the correct constants
        console.log(`Creating igloo with height: ${this.height}, entrance height: ${this.entranceHeight}, owner: ${this.ownerId}`);
        
        // Create the igloo structure
        this.createIgloo();
    }
    
    /**
     * Create the igloo structure
     */
    createIgloo() {
        // Create a group to hold all igloo parts
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        this.group.rotation.y = this.entranceDirection;
        this.scene.add(this.group);
        
        // Use the player color that was set in the constructor
        console.log(`Using player color for igloo: ${this.playerColor.toString(16)}`);
        
        // Materials for the igloo using player's color
        const iglooMaterial = new THREE.MeshLambertMaterial({ 
            color: this.playerColor,
            side: THREE.DoubleSide
        });
        
        // Slightly different color for the roof to add visual interest
        // Make it a bit lighter than the base color
        const roofColor = new THREE.Color(this.playerColor).multiplyScalar(1.2);
        const roofMaterial = new THREE.MeshLambertMaterial({ 
            color: roofColor,
            side: THREE.DoubleSide
        });
        
        // Create the floor
        const floorGeometry = new THREE.BoxGeometry(this.width, this.wallThickness, this.depth);
        const floor = new THREE.Mesh(floorGeometry, iglooMaterial);
        floor.position.y = -this.wallThickness / 2;
        this.group.add(floor);
        this.meshes.push(floor);
        
        // Create the walls (three walls, leaving one side open for entrance)
        this.createWalls(iglooMaterial);
        
        // Create the entrance
        this.createEntrance(iglooMaterial);
        
        // Create a roof
        this.createRoof(roofMaterial);
    }
    
    /**
     * Create the walls of the igloo
     * @param {THREE.Material} material - Material to use for the walls
     */
    createWalls(material) {
        // Back wall (opposite to entrance)
        const backWallGeometry = new THREE.BoxGeometry(this.width, this.height, this.wallThickness);
        const backWall = new THREE.Mesh(backWallGeometry, material);
        backWall.position.set(0, this.height / 2, -this.depth / 2 + this.wallThickness / 2);
        this.group.add(backWall);
        this.meshes.push(backWall);
        
        // Left wall
        const leftWallGeometry = new THREE.BoxGeometry(this.wallThickness, this.height, this.depth);
        const leftWall = new THREE.Mesh(leftWallGeometry, material);
        leftWall.position.set(-this.width / 2 + this.wallThickness / 2, this.height / 2, 0);
        this.group.add(leftWall);
        this.meshes.push(leftWall);
        
        // Right wall
        const rightWallGeometry = new THREE.BoxGeometry(this.wallThickness, this.height, this.depth);
        const rightWall = new THREE.Mesh(rightWallGeometry, material);
        rightWall.position.set(this.width / 2 - this.wallThickness / 2, this.height / 2, 0);
        this.group.add(rightWall);
        this.meshes.push(rightWall);
    }
    
    /**
     * Create the entrance of the igloo
     * @param {THREE.Material} material - Material to use for the entrance
     */
    createEntrance(material) {
        // Calculate dimensions for the front wall parts (on either side of the entrance)
        const sideWidth = (this.width - this.entranceWidth) / 2;
        
        // Calculate and store the entrance position (center of the entrance)
        // This will be used for collision detection
        // Adjust the entrance position to be slightly in front of the igloo for easier entry
        const entranceOffset = 1.0; // Move entrance position 1 unit outward from igloo
        
        this.entrancePosition = new THREE.Vector3(
            this.position.x, // X position is the same as the igloo position
            this.position.y + this.entranceHeight / 3, // Lower the Y position to 1/3 of entrance height for easier entry
            this.position.z + this.depth / 2 + entranceOffset // Z position is at the front of the igloo plus offset
        );
        
        // Apply rotation to entrance position based on entrance direction
        if (this.entranceDirection !== 0) {
            // Create a vector for the entrance position relative to igloo center
            const relativePos = new THREE.Vector3(0, 0, this.depth / 2 + entranceOffset);
            
            // Rotate this vector by the entrance direction
            relativePos.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.entranceDirection);
            
            // Update the entrance position
            this.entrancePosition.x = this.position.x + relativePos.x;
            this.entrancePosition.z = this.position.z + relativePos.z;
        }
        
        // Create a helper object to visualize the entrance position (for debugging)
        // Use the player's color for the entrance marker
        const entranceMarker = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({ color: this.playerColor, wireframe: true })
        );
        entranceMarker.position.copy(this.entrancePosition);
        this.scene.add(entranceMarker);
        
        console.log(`Igloo entrance position: (${this.entrancePosition.x.toFixed(2)}, ${this.entrancePosition.y.toFixed(2)}, ${this.entrancePosition.z.toFixed(2)})`);
        
        // Left part of front wall
        if (sideWidth > 0) {
            const leftFrontGeometry = new THREE.BoxGeometry(sideWidth, this.height, this.wallThickness);
            const leftFront = new THREE.Mesh(leftFrontGeometry, material);
            leftFront.position.set(-this.width / 2 + sideWidth / 2, this.height / 2, this.depth / 2 - this.wallThickness / 2);
            this.group.add(leftFront);
            this.meshes.push(leftFront);
            
            // Right part of front wall
            const rightFrontGeometry = new THREE.BoxGeometry(sideWidth, this.height, this.wallThickness);
            const rightFront = new THREE.Mesh(rightFrontGeometry, material);
            rightFront.position.set(this.width / 2 - sideWidth / 2, this.height / 2, this.depth / 2 - this.wallThickness / 2);
            this.group.add(rightFront);
            this.meshes.push(rightFront);
        }
        
        // Top part of front wall (above entrance)
        const topHeight = this.height - this.entranceHeight;
        if (topHeight > 0) {
            const topFrontGeometry = new THREE.BoxGeometry(this.entranceWidth, topHeight, this.wallThickness);
            const topFront = new THREE.Mesh(topFrontGeometry, material);
            topFront.position.set(0, this.height - topHeight / 2, this.depth / 2 - this.wallThickness / 2);
            this.group.add(topFront);
            this.meshes.push(topFront);
        }
        
        // Create a small step at the entrance
        const stepGeometry = new THREE.BoxGeometry(this.entranceWidth, this.wallThickness, this.wallThickness * 2);
        const step = new THREE.Mesh(stepGeometry, material);
        step.position.set(0, this.wallThickness / 2, this.depth / 2 + this.wallThickness);
        this.group.add(step);
        this.meshes.push(step);
    }
    
    /**
     * Create a roof for the igloo
     * @param {THREE.Material} material - Material to use for the roof
     */
    createRoof(material) {
        // Create a simple roof that extends slightly beyond the walls
        const roofWidth = this.width + this.wallThickness;
        const roofDepth = this.depth + this.wallThickness;
        const roofHeight = this.wallThickness;
        
        const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
        const roof = new THREE.Mesh(roofGeometry, material);
        roof.position.set(0, this.height + roofHeight / 2, 0);
        this.group.add(roof);
        this.meshes.push(roof);
    }
    
    /**
     * Get the position of the igloo
     * @returns {THREE.Vector3} Position of the igloo
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Register the igloo with the physics system
     * @param {Physics} physics - Physics system
     */
    registerWithPhysics(physics) {
        if (!physics) return;
        
        // Register each mesh as a static body
        for (const mesh of this.meshes) {
            physics.registerBody(mesh, true); // true = isStatic
        }
        
        // Register the igloo itself as a collider for player-igloo collision detection
        physics.registerCollider(this, 'igloos');
        console.log(`Registered igloo with physics system, owner: ${this.ownerId}`);
    }
    
    /**
     * Get the color of the player who owns this igloo
     * @returns {number} - The color as a hex value
     */
    getPlayerColor() {
        // Default color if no owner or player not found
        const defaultColor = 0xEEEEEE; // White
        
        try {
            // If no owner ID, return default color
            if (!this.ownerId) {
                console.log('No owner ID for igloo, using default color');
                return defaultColor;
            }
            
            if (this.playerColor) {
                return this.playerColor;
            }else {
                return defaultColor;    
            }
            
        } catch (error) {
            console.error('Error getting player color:', error);
            return defaultColor;
        }
    }
}

// Expose Igloo to the global scope
window.Igloo = Igloo;
