# SnowBrawl Game

A first-person snowball fighting game built with Three.js where players compete to be the last one standing.

## Game Overview

**Objectives:**
1. Hit opponents with snowballs to reduce their health
2. Stay alive longer than everyone else
3. Collect diamonds to upgrade your abilities

## Game Features

- **Free-for-All Mode:** Compete against AI opponents to be the last player standing
- **Health System:** Each player starts with 10 health points, eliminated when health reaches 0
- **Snowball Mechanics:** Throw snowballs at opponents to deal damage
- **Safe Zones:** Each player has a personal igloo that serves as a safe zone
- **Upgrades:** Collect diamonds to upgrade movement speed, snowball damage, throw range, snowball size, and bag capacity

## Controls

- **Movement:** W, A, S, D keys
- **Look Around:** Mouse movement
- **Shoot:** Left mouse button
- **Access Upgrades:** Click the Upgrades button in the HUD

## Installation and Setup

1. Clone the repository
2. Open the `index.html` file in a modern web browser that supports WebGL

## Development

The game is built with the following technologies:
- Three.js for 3D rendering
- Vanilla JavaScript for game logic
- HTML/CSS for UI elements

### Project Structure

- `index.html` - Main HTML file
- `css/style.css` - Styling for UI elements
- `js/` - JavaScript files:
  - `main.js` - Entry point for the game
  - `game.js` - Core game logic
  - `constants.js` - Game configuration parameters
  - `player.js` - Player class
  - `ai.js` - AI player behavior
  - `snowball.js` - Snowball mechanics
  - `map.js` - Game environment
  - `physics.js` - Collision detection and physics
  - `ui.js` - User interface management
  - `utils.js` - Utility functions

## Future Enhancements

- Team mode
- Network multiplayer
- Additional maps
- Sound effects and music
- Mobile support

## License

This project is licensed under the MIT License - see the LICENSE file for details.
