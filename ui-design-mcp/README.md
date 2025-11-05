



# UI Design MCP Server

An MCP (Model Context Protocol) server that generates AI-powered UI design concepts using Google's Imagen and Gemini models.

## Features

- **Generate UI Designs**: Create custom UI component designs with specific styles and color schemes
- **Design Variations**: Generate variations of existing designs
- **Design Systems**: Generate complete design systems with multiple components
- **Multiple Styles**: Support for glassmorphism, neumorphism, brutalist, minimalist, and more
- **Color Schemes**: Various color palettes from vibrant neon to earth tones
- **Component Types**: Hero sections, navigation, cards, dashboards, chat interfaces, and more

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

1. Copy `.env.example` to `.env`
2. Add your Google AI API key:

```env
GOOGLE_API_KEY=your-api-key-here
```

Get your API key from: https://ai.google.dev/

## Tools

### 1. `generate_ui_design`
Generate a UI design concept from scratch.

**Parameters:**
- `componentType`: Type of component (hero-section, navigation-bar, card-grid, etc.)
- `style`: Visual style (glassmorphism, neumorphism, brutalist, etc.)
- `colorScheme`: Color palette (vibrant-neon, pastel-soft, dark-mode, etc.)
- `description`: Additional requirements
- `aspectRatio`: Image dimensions (16:9, 1:1, etc.)
- `outputPath`: (Optional) Path to save the image

### 2. `generate_ui_variation`
Create a variation of an existing design.

**Parameters:**
- `baseDesignPath`: Path to the base design image
- `variation`: Description of changes to make
- `aspectRatio`: Image dimensions
- `outputPath`: (Optional) Path to save the variation

### 3. `list_design_options`
List all available styles, color schemes, and component types.

### 4. `generate_design_system`
Generate multiple components as a cohesive design system.

**Parameters:**
- `theme`: Theme name/description
- `components`: Array of component types to generate
- `style`: Visual style
- `colorScheme`: Color palette
- `outputDir`: Directory to save all designs

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ui-design": {
      "command": "node",
      "args": ["C:/path/to/ui-design-mcp/build/index.js"],
      "env": {
        "GOOGLE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Example Usage

```typescript
// Generate a glassmorphism hero section
generate_ui_design({
  componentType: "hero-section",
  style: "glassmorphism",
  colorScheme: "vibrant-neon",
  description: "Modern SaaS landing page with CTA buttons and feature highlights",
  aspectRatio: "16:9",
  outputPath: "./designs/hero.png"
})

// Generate a complete design system
generate_design_system({
  theme: "AI Agent Marketplace",
  components: ["hero-section", "navigation-bar", "card-grid", "pricing-table"],
  style: "minimalist",
  colorScheme: "dark-mode",
  outputDir: "./design-system"
})
```

## Available Options

### Component Types
- hero-section
- navigation-bar
- card-grid
- pricing-table
- dashboard
- chat-interface
- profile-page
- settings-panel
- data-visualization
- landing-page

### Styles
- glassmorphism
- neumorphism
- brutalist
- minimalist
- maximalist
- retro-futuristic
- cyberpunk
- organic
- geometric
- gradient-heavy

### Color Schemes
- vibrant-neon
- pastel-soft
- dark-mode
- light-airy
- monochrome
- earth-tones
- ocean-blues
- sunset-warmth
- forest-greens
- royal-purples

## License

MIT
