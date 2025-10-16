<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Chrome Extension Development Instructions

This is a Chrome extension project that replaces select dropdown elements with autocomplete inputs on Google Forms pages.

## Project Structure
- `manifest.json` - Extension manifest with permissions and content script configuration
- `content.js` - Main content script that handles select element replacement
- `styles.css` - CSS styles for autocomplete elements
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality and communication with content script

## Development Guidelines
- Follow Chrome Extension Manifest V3 specifications
- Use modern JavaScript (ES6+) features
- Ensure compatibility with Google Forms dynamic content loading
- Focus on accessibility and user experience

## Browser Compatibility
- Target Chrome/Chromium browsers with Manifest V3 support
- Ensure graceful degradation if extension is disabled
