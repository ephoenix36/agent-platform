#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
// Load environment variables
dotenv.config();
// Initialize Google AI
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
// Create MCP server
const server = new McpServer({
    name: "ui-design-mcp",
    version: "1.0.0",
    description: "AI-powered UI design concept generation server"
});
// UI Design Styles
const UI_STYLES = [
    "glassmorphism",
    "neumorphism",
    "brutalist",
    "minimalist",
    "maximalist",
    "retro-futuristic",
    "cyberpunk",
    "organic",
    "geometric",
    "gradient-heavy"
];
// Color Schemes
const COLOR_SCHEMES = [
    "vibrant-neon",
    "pastel-soft",
    "dark-mode",
    "light-airy",
    "monochrome",
    "earth-tones",
    "ocean-blues",
    "sunset-warmth",
    "forest-greens",
    "royal-purples"
];
// Component Types
const COMPONENT_TYPES = [
    "hero-section",
    "navigation-bar",
    "card-grid",
    "pricing-table",
    "dashboard",
    "chat-interface",
    "profile-page",
    "settings-panel",
    "data-visualization",
    "landing-page"
];
// Tool: Generate UI Design
const generateUIDesignSchema = z.object({
    componentType: z.enum(COMPONENT_TYPES).describe("Type of UI component to generate"),
    style: z.enum(UI_STYLES).describe("Visual design style"),
    colorScheme: z.enum(COLOR_SCHEMES).describe("Color palette to use"),
    description: z.string().describe("Additional requirements or features"),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).default("16:9"),
    outputPath: z.string().optional().describe("Path to save the generated image")
});
server.tool("generate_ui_design", "Generate an AI-powered UI design concept based on specifications", generateUIDesignSchema.shape, async (input) => {
    try {
        // Construct detailed prompt
        const prompt = `Professional UI/UX design mockup for a ${input.componentType}. 
Style: ${input.style} design with ${input.colorScheme} color scheme.
Requirements: ${input.description}

The design should be:
- Modern and production-ready
- Pixel-perfect with proper spacing and alignment
- Include realistic content and typography
- Show interactive elements (buttons, inputs, cards)
- Desktop/web interface at high resolution
- Clean, professional, and visually stunning
- No watermarks or mockup frames, just the pure UI design`;
        console.error(`Generating ${input.componentType} with ${input.style} style...`);
        // Generate image using Imagen
        const response = await ai.models.generateImages({
            model: "imagen-4.0-generate-001",
            prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: input.aspectRatio
            }
        });
        if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0]?.image?.imageBytes) {
            return {
                content: [{ type: "text", text: "Failed to generate UI design image" }],
                isError: true
            };
        }
        const imageBytes = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${imageBytes}`;
        // Save to file if path provided
        if (input.outputPath && imageBytes) {
            const buffer = Buffer.from(imageBytes, "base64");
            await fs.writeFile(input.outputPath, buffer);
            console.error(`Saved to: ${input.outputPath}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: `✅ Generated ${input.componentType} design with ${input.style} style and ${input.colorScheme} colors.\n\nPrompt used: ${prompt}\n\nImage data (base64): ${imageUrl.substring(0, 100)}...`
                },
                {
                    type: "image",
                    data: imageBytes,
                    mimeType: "image/png"
                }
            ]
        };
    }
    catch (error) {
        console.error("Error generating UI design:", error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// Tool: Generate UI Variation
const generateVariationSchema = z.object({
    baseDesignPath: z.string().describe("Path to base design image"),
    variation: z.string().describe("What to change or vary in the design"),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).default("16:9"),
    outputPath: z.string().optional()
});
server.tool("generate_ui_variation", "Generate a variation of an existing UI design", generateVariationSchema.shape, async (input) => {
    try {
        // Read base image
        const imageBuffer = await fs.readFile(input.baseDesignPath);
        const base64Image = imageBuffer.toString("base64");
        const mimeType = input.baseDesignPath.endsWith(".png") ? "image/png" : "image/jpeg";
        const prompt = `Create a variation of this UI design. ${input.variation}. Maintain the overall structure but apply the requested changes. Keep it professional and production-ready.`;
        // Generate variation using Gemini with reference image
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType } },
                    { text: prompt }
                ]
            },
            config: { responseModalities: ["IMAGE", "TEXT"] }
        });
        // Extract image from response
        let generatedImage = null;
        let imageData = null;
        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    imageData = part.inlineData.data;
                    // Save if path provided
                    if (input.outputPath) {
                        const buffer = Buffer.from(part.inlineData.data, "base64");
                        await fs.writeFile(input.outputPath, buffer);
                    }
                    break;
                }
            }
        }
        if (!generatedImage || !imageData) {
            return {
                content: [{ type: "text", text: "Failed to generate variation" }],
                isError: true
            };
        }
        return {
            content: [
                { type: "text", text: `✅ Generated UI variation: ${input.variation}` },
                { type: "image", data: imageData, mimeType: "image/png" }
            ]
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// Tool: List Available Options
server.tool("list_design_options", "List all available UI styles, color schemes, and component types", {}, async () => {
    const options = {
        componentTypes: COMPONENT_TYPES,
        styles: UI_STYLES,
        colorSchemes: COLOR_SCHEMES,
        aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"]
    };
    return {
        content: [{
                type: "text",
                text: `Available Design Options:\n\n${JSON.stringify(options, null, 2)}`
            }]
    };
});
// Tool: Generate Design System
const generateDesignSystemSchema = z.object({
    theme: z.string().describe("Theme name/description"),
    components: z.array(z.enum(COMPONENT_TYPES)).describe("Components to generate"),
    style: z.enum(UI_STYLES),
    colorScheme: z.enum(COLOR_SCHEMES),
    outputDir: z.string().describe("Directory to save all generated designs")
});
server.tool("generate_design_system", "Generate a complete design system with multiple components", generateDesignSystemSchema.shape, async (input) => {
    try {
        // Create output directory
        await fs.mkdir(input.outputDir, { recursive: true });
        const results = [];
        for (const componentType of input.components) {
            const filename = `${componentType}-${input.style}-${Date.now()}.png`;
            const outputPath = path.join(input.outputDir, filename);
            const prompt = `Professional UI/UX design mockup for ${componentType} component.
Theme: ${input.theme}
Style: ${input.style} with ${input.colorScheme} color scheme.
High-quality, production-ready design with proper spacing and modern aesthetics.`;
            const response = await ai.models.generateImages({
                model: "imagen-4.0-generate-001",
                prompt,
                config: { numberOfImages: 1, aspectRatio: "16:9" }
            });
            if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0]?.image?.imageBytes) {
                const imageBytes = response.generatedImages[0].image.imageBytes;
                const buffer = Buffer.from(imageBytes, "base64");
                await fs.writeFile(outputPath, buffer);
                results.push(`✅ ${componentType}: ${outputPath}`);
            }
            else {
                results.push(`❌ ${componentType}: Failed to generate`);
            }
            // Delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return {
            content: [{
                    type: "text",
                    text: `Design System Generated:\n\n${results.join("\n")}\n\nAll files saved to: ${input.outputDir}`
                }]
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// Start server
async function main() {
    try {
        if (!process.env.GOOGLE_API_KEY) {
            console.error("⚠️  Warning: GOOGLE_API_KEY not set in environment");
        }
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("🎨 UI Design MCP Server started successfully");
    }
    catch (error) {
        console.error("Server error:", error);
        process.exit(1);
    }
}
main();
