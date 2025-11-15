import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper function to list available models via REST API
async function listAvailableModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY!;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      console.error("Failed to list models:", response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    console.log("\n=== Available Models ===");
    models.forEach((model: any) => {
      console.log(`Model: ${model.name}`);
      console.log(`  Display Name: ${model.displayName || "N/A"}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
      console.log(`  Description: ${model.description || "N/A"}`);
      console.log("---");
    });
    
    return models;
  } catch (error) {
    console.error("Error listing models:", error);
    return [];
  }
}

// Type definitions for API request/response
interface PreviewRequest {
  nodeId: string;
  promptText?: string;
  references?: { mimeType: string; base64: string }[];
  seed?: number;
}

interface PreviewResponse {
  nodeId: string;
  imageBase64: string;
}

interface PreviewErrorResponse {
  nodeId: string;
  error: string;
}

// Generate a deterministic seed from nodeId
function generateSeed(nodeId: string): number {
  // Simple hash function to convert nodeId to a number
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    const char = nodeId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export async function POST(request: NextRequest) {
  let nodeId = "unknown";
  try {
    const body: PreviewRequest = await request.json();
    nodeId = body.nodeId;
    const { promptText, references, seed } = body;

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { nodeId, error: "GEMINI_API_KEY environment variable is not set" } as PreviewErrorResponse,
        { status: 500 }
      );
    }

    // List available models (for debugging)
    // TODO: Remove this after finding the correct model name
    const availableModels = await listAvailableModels();
    console.log("\n=== Available Models Summary ===");
    const modelNames = availableModels.map((m: any) => m.name);
    console.log("All model names:", JSON.stringify(modelNames, null, 2));
    
    const imagenModels = modelNames.filter((n: string) => n.toLowerCase().includes("imagen"));
    console.log("\nModels with 'imagen' in name:", JSON.stringify(imagenModels, null, 2));
    
    const generateContentModels = availableModels
      .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m: any) => m.name);
    console.log("\nModels with 'generateContent' in supported methods:", JSON.stringify(generateContentModels, null, 2));
    
    // If no Imagen models found, suggest alternatives
    if (imagenModels.length === 0) {
      console.warn("\n⚠️  WARNING: No Imagen models found in available models!");
      console.warn("Imagen models might not be available through the Gemini API with your current API key.");
      console.warn("You may need to use Vertex AI API instead, or check if Imagen access is enabled for your project.");
    }

    // Build the prompt with pixel art instructions
    // Emphasize 2D sprite style, pixel art, flat design - avoid 3D rendering
    const baseInstructions =
      "Generate a 2D pixel art sprite character. Style: flat 2D pixel art, NOT 3D, NOT photorealistic, NOT rendered. Use pixelated art style with visible pixels. Character should be a 2D sprite sheet style character, side view, full body, centered. White solid background (not transparent, not checkerboard). No shadows, no 3D effects, no depth, no gradients. Pure 2D pixel art sprite style like classic video game sprites. Do NOT add text or UI.";
    
    const fullPrompt = promptText
      ? `${promptText}\n\n${baseInstructions}`
      : baseInstructions;

    // Build parts array for Gemini
    // Start with text prompt
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: fullPrompt },
    ];

    // Add reference images as inlineData
    if (references && references.length > 0) {
      for (const ref of references) {
        parts.push({
          inlineData: {
            mimeType: ref.mimeType,
            data: ref.base64,
          },
        });
      }
    }

    // Use provided seed or generate from nodeId (not currently used, but kept for future use)
    const finalSeed = seed ?? generateSeed(nodeId);

    // IMPORTANT: Imagen models use "predict" method, not "generateContent"
    // However, gemini-2.5-flash-image models support generateContent and can generate images
    // Let's use gemini-2.5-flash-image which supports generateContent
    
    // Check for gemini-2.5-flash-image models first (they support generateContent)
    const imageGenerationModels = modelNames.filter((n: string) => 
      n.toLowerCase().includes("flash-image")
    );
    
    let modelName: string;
    if (imageGenerationModels.length > 0) {
      // Use gemini-2.5-flash-image which supports generateContent
      modelName = imageGenerationModels[0].replace("models/", "");
      console.log(`\n✅ Using Gemini image generation model: ${modelName}`);
      console.log(`   (This model supports generateContent, unlike Imagen which uses predict)`);
    } else if (imagenModels.length > 0) {
      // Fallback: Imagen models exist but use "predict" method (would need different implementation)
      console.warn(`\n⚠️  Imagen models found but they use "predict" method, not "generateContent"`);
      console.warn(`   Imagen models: ${imagenModels.join(", ")}`);
      console.warn(`   Using gemini-2.5-flash-image instead for generateContent support`);
      modelName = "gemini-2.5-flash-image";
    } else {
      // Last resort
      modelName = "gemini-2.5-flash-image";
      console.warn(`\n⚠️  Using default model: ${modelName}`);
    }
    
    console.log(`\n=== Attempting to use model: ${modelName} ===`);
    
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.4,
        // Note: seed is not supported in generationConfig type
      },
    });

    // Build parts array for image generation
    // Gemini image models support text prompts and can use reference images
    const imageParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: fullPrompt },
    ];

    // Add reference images if provided
    // Reference images can be used for style guidance
    if (references && references.length > 0) {
      for (const ref of references) {
        imageParts.push({
          inlineData: {
            mimeType: ref.mimeType,
            data: ref.base64,
          },
        });
      }
    }

    // Call Gemini image generation API - pass parts directly (text + optional reference images)
    const result = await model.generateContent(imageParts);

    // Extract image from response
    const response = result.response;
    const candidate = response.candidates?.[0];
    if (!candidate) {
      return NextResponse.json(
        { nodeId, error: "No candidate returned from image generation model" } as PreviewErrorResponse,
        { status: 500 }
      );
    }

    // Find the first image part in the response
    const imagePart = candidate.content?.parts?.find(
      (part: { inlineData?: { mimeType?: string; data?: string } }) =>
        part.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData?.data) {
      // If no image, check if there's text (for debugging)
      const textPart = candidate.content?.parts?.find(
        (part: { text?: string }) => part.text
      );
      const errorMsg = textPart?.text 
        ? `No image data found. Model returned text: ${textPart.text.substring(0, 100)}...`
        : "No image data found in response. The model may not support image generation or returned an error.";
      
      return NextResponse.json(
        { nodeId, error: errorMsg } as PreviewErrorResponse,
        { status: 500 }
      );
    }

    // Return the base64 image (without data URL prefix)
    const imageBase64 = imagePart.inlineData.data;

    return NextResponse.json({
      nodeId,
      imageBase64,
    } as PreviewResponse);
  } catch (error: any) {
    console.error("Error generating preview:", error);
    
    // Handle quota/rate limit errors specifically
    if (error?.status === 429) {
      const retryAfter = error?.errorDetails?.find(
        (detail: any) => detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
      )?.retryDelay || "2s";
      
      return NextResponse.json(
        {
          nodeId,
          error: `Quota exceeded. Please check your Gemini API plan. The free tier may have limited access to this model. Retry after ${retryAfter}. For more info: https://ai.google.dev/gemini-api/docs/rate-limits`,
        } as PreviewErrorResponse,
        { status: 429 }
      );
    }
    
    // Handle other API errors
    if (error?.message?.includes("GoogleGenerativeAI")) {
      return NextResponse.json(
        {
          nodeId,
          error: `Gemini API Error: ${error.message}`,
        } as PreviewErrorResponse,
        { status: error?.status || 500 }
      );
    }
    
    return NextResponse.json(
      {
        nodeId,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      } as PreviewErrorResponse,
      { status: 500 }
    );
  }
}

