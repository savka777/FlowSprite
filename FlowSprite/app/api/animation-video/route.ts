import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Veo client
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Fallback chain of Veo models to try when hitting rate limits
// Order: Try fastest/newest first, fall back to older models
// Note: All Veo models have similar rate limits (2 RPM, 10 RPD on Free tier)
// but switching can help if one model is temporarily unavailable
const VEO_MODEL_FALLBACKS = [
  "veo-3.1-fast-generate-preview",  // Primary: Fastest, newest
  "veo-3.1-generate-preview",        // Fallback 1: Standard quality
  "veo-3.0-generate-preview",        // Fallback 2: Older version
  "veo-2-generate-preview",          // Fallback 3: Veo 2 (has higher RPD: 50 vs 10)
];

// Get initial model from env or use first in fallback chain
const initialModel = process.env.VEO_MODEL || VEO_MODEL_FALLBACKS[0];

const ai = new GoogleGenAI({
  apiKey: apiKey!,
});

// Helper function to list available Veo models
async function listAvailableVeoModels() {
  try {
    if (!apiKey) {
      console.warn("[Veo Models] No API key available to list models");
      return [];
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      console.error("[Veo Models] Failed to list models:", response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    // Filter for Veo models
    const veoModels = models.filter((model: any) => 
      model.name?.toLowerCase().includes("veo")
    );
    
    console.log("\n=== Available Veo Models ===");
    veoModels.forEach((model: any) => {
      console.log(`Model: ${model.name}`);
      console.log(`  Display Name: ${model.displayName || "N/A"}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
      console.log(`  Description: ${model.description || "N/A"}`);
      console.log("---");
    });
    
    return veoModels.map((m: any) => m.name);
  } catch (error) {
    console.error("[Veo Models] Error listing models:", error);
    return [];
  }
}

// Type definitions
interface AnimationVideoRequest {
  nodeId: string;
  animationKind: "idle" | "walk" | "run" | "jump";
  spriteBase64: string; // PNG base64 WITHOUT the data URL prefix
  promptText?: string; // optional extra user instructions
}

type AnimationKind = "idle" | "walk" | "run" | "jump";

// Helper function to build animation prompt
function buildAnimationPrompt(
  animationKind: AnimationKind,
  spriteDescription?: string
): string {
  // CRITICAL: Strong negative prompts to prevent 3D rendering
  const baseStyle = `
CRITICAL STYLE REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
- This is a 2D PIXEL ART animation. The input image is a 2D pixel art sprite.
- The clip should be about 4 seconds long so it can be used as a game sprite animation.
- You MUST maintain the EXACT same 2D pixel art style as the input image.
- DO NOT make it 3D, DO NOT make it realistic, DO NOT add depth, DO NOT add shadows.
- DO NOT add lighting, DO NOT add gradients, DO NOT add shine or gloss.
- DO NOT render it in 3D style, DO NOT make it photorealistic.
- The character must remain flat 2D pixel art throughout the entire animation.
- Match the pixelated, low-resolution, retro game sprite aesthetic of the input image exactly.
- Use a solid pure white background (#FFFFFF), completely flat, no gradient, no textures, no shadows, no ground line, no objects.
- The character must stay centered, side view, and fill a reasonable portion of the frame.
- No text, UI, logos, borders, or props.
- Keep the same pixel density and resolution as the input image.
`.trim();

  const extra = spriteDescription
    ? `\nAdditional user instruction: ${spriteDescription.trim()}`
    : "";

  let motion = "";

  switch (animationKind) {
    case "idle":
      motion = `
ANIMATION TYPE: IDLE
- The character must stand completely still in place.
- Only animate a very subtle breathing motion: tiny up/down movement of the chest.
- Optional: very slight idle sway (left/right) of the body, but minimal.
- NO walking, NO movement across the screen, NO leg movement.
- The animation should be a single seamless idle loop that starts and ends in almost the same pose so it can be looped cleanly.
- Do not add any extra actions or transitions after the idle cycle finishes.
- Keep the animation loop smooth and subtle.
`.trim();
      break;
    case "walk":
      motion = `
ANIMATION TYPE: WALK CYCLE
- Animate a classic 2D side-scrolling walk cycle in place, side view.
- The character walks on the spot (does NOT move across the screen).
- Show clear leg alternation: left leg forward, right leg back, then switch.
- Arms should swing opposite to legs (left arm forward when right leg forward).
- The character's body should have a slight up/down bounce as they walk.
- The video should contain one clean walk cycle that returns to the starting pose so it can loop seamlessly.
- Avoid extra camera movement or additional actions at the end of the clip.
- The character must stay centered in the frame throughout.
`.trim();
      break;
    case "run":
      motion = `
ANIMATION TYPE: RUN CYCLE
- Animate a faster run cycle in place, side view.
- The character runs faster than walking with more exaggerated motion.
- Legs move faster with longer strides.
- Arms pump more vigorously than walking.
- Body has more pronounced up/down bounce.
- The character stays centered and runs on the spot, like a classic game sprite.
- The clip should be a single, smooth run cycle that ends in nearly the same pose as the first frame for looping.
- Do not add extra motions or transitions after the run cycle is complete.
`.trim();
      break;
    case "jump":
      motion = `
ANIMATION TYPE: JUMP CYCLE
- Animate a complete jump cycle in place: anticipation (squat down), jump up, hang time at peak, fall down, land, then settle back into the starting pose.
- The character should compress slightly before jumping (anticipation).
- At the peak of the jump, there should be a brief hang time.
- The landing should have a slight compression/squat.
- The clip should contain one complete jump cycle that ends very close to the initial idle pose, so it can be looped with other animations.
- Avoid adding extra steps, actions, or camera moves after the landing.
- NO camera movement, keep the character centered throughout.
`.trim();
      break;
  }

  const fullPrompt = [baseStyle, motion, extra].join("\n\n");
  
  // Log the prompt for debugging
  console.log(`[Animation Video] Full prompt (${animationKind}):\n${fullPrompt}\n`);
  
  return fullPrompt;
}

// Helper function to derive deterministic seed
function deriveSeed(
  nodeId: string,
  animationKind: AnimationKind
): number {
  let hash = 0;
  const key = `${nodeId}:${animationKind}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export async function POST(request: NextRequest) {
  let nodeId = "unknown";

  try {
    const body = (await request.json()) as AnimationVideoRequest;
    const { nodeId: id, animationKind, spriteBase64, promptText } = body;
    nodeId = id;

    // Validate API key
    if (!apiKey) {
      return NextResponse.json(
        { nodeId, error: "GOOGLE_API_KEY or GEMINI_API_KEY is not set" },
        { status: 500 }
      );
    }

    // Validate request body
    if (!spriteBase64) {
      return NextResponse.json(
        { nodeId, error: "Missing spriteBase64" },
        { status: 400 }
      );
    }

    if (!animationKind) {
      return NextResponse.json(
        { nodeId, error: "Missing animationKind" },
        { status: 400 }
      );
    }

    // Build prompt and seed
    const fullPrompt = buildAnimationPrompt(animationKind, promptText);
    const seed = deriveSeed(nodeId, animationKind);
    // Note: The SDK expects imageBytes as a base64 string, not a Buffer
    // spriteBase64 is already a base64 string (without data URL prefix)

    console.log(
      `[Animation Video] Generating ${animationKind} animation for node ${nodeId}`
    );
    
    // List available Veo models (for debugging and finding alternatives)
    const availableVeoModels = await listAvailableVeoModels();
    if (availableVeoModels.length > 0) {
      console.log(`[Animation Video] Available Veo models: ${availableVeoModels.join(", ")}`);
    }
    
    // Filter fallback models to only include available ones
    const modelsToTry = VEO_MODEL_FALLBACKS.filter(model => 
      availableVeoModels.length === 0 || availableVeoModels.includes(model)
    );
    
    // If VEO_MODEL env var is set, prioritize it
    const modelsToAttempt = initialModel && modelsToTry.includes(initialModel)
      ? [initialModel, ...modelsToTry.filter(m => m !== initialModel)]
      : modelsToTry;
    
    if (modelsToAttempt.length === 0) {
      return NextResponse.json(
        {
          nodeId,
          error: `No available Veo models found. Please check your API key and project configuration.`,
        },
        { status: 500 }
      );
    }
    
    console.log(`[Animation Video] Will try models in order: ${modelsToAttempt.join(" -> ")}`);
    console.log(`[Animation Video] Prompt length: ${fullPrompt.length} characters`);
    console.log(`[Animation Video] Extra prompt text: ${promptText || "none"}`);

    // Try each model in the fallback chain until one succeeds
    let lastError: any = null;
    let successfulModel: string | null = null;
    
    for (const currentModel of modelsToAttempt) {
      console.log(`[Animation Video] Attempting with model: ${currentModel}`);
      
      try {
        // Step 1: Start the Veo operation using ai.models.generateVideos
        // IMPORTANT: The image provided is a 2D pixel art sprite. Veo must maintain this exact style.
        let operation = await ai.models.generateVideos({
          model: currentModel,
          prompt: fullPrompt,
          image: {
            mimeType: "image/png",
            imageBytes: spriteBase64, // Pass the base64 string directly
            // Note: This is a 2D pixel art sprite - do NOT enhance or render in 3D
          },
          config: {
            aspectRatio: "16:9",
            durationSeconds: 4, // Veo API requires 4-8 seconds, using minimum for faster generation
            // Note: If the @google/genai types expose a resolution or quality field for 720p,
            // it would be set here. Currently relying on aspectRatio and model defaults.
            // seed, // Include if supported by the SDK
          } as any,
        } as any);
        
        successfulModel = currentModel;

        console.log(
          `[Animation Video] Operation started with ${currentModel}: ${(operation as any).name || "unknown"}`
        );

        // Step 2: Poll until operation.done or max poll count is reached
        let pollCount = 0;
        const maxPolls = 60; // 60 * 5s = 5 minutes max

        while (!operation.done && pollCount < maxPolls) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          try {
            operation = await ai.operations.getVideosOperation({ operation });
            pollCount++;
            console.log(
              `[Animation Video] Polling ${currentModel}... ${pollCount}/${maxPolls}, done=${operation.done}`
            );
          } catch (pollError: any) {
            // Handle rate limit errors during polling - try next model
            if (pollError?.status === 429 || pollError?.statusCode === 429) {
              console.warn(`[Animation Video] Rate limit during polling with ${currentModel}, will try next model`);
              lastError = pollError;
              throw pollError; // Break out of this model attempt, try next
            }
            // Re-throw other errors
            throw pollError;
          }
        }

        if (!operation.done) {
          const timeoutError = new Error("Video generation timed out after maximum polling attempts");
          (timeoutError as any).status = 500;
          throw timeoutError;
        }

        // Step 3: Extract the video object from the operation result
        const result: any =
          (operation as any).result ||
          (operation as any).response ||
          {};

        const videos =
          result.generatedVideos ||
          result.videos ||
          [];

        if (!videos.length) {
          console.error("Veo response structure:", JSON.stringify(result, null, 2));
          const noVideosError = new Error("Veo response did not contain any videos");
          (noVideosError as any).status = 500;
          throw noVideosError;
        }

        const video = videos[0].video;

        if (!video) {
          console.error("Video object missing from videos[0]:", videos[0]);
          const noVideoError = new Error("Video object missing from Veo response");
          (noVideoError as any).status = 500;
          throw noVideoError;
        }

        console.log(
          `[Animation Video] Video generated with ${currentModel}, extracting bytes from: ${video.uri || "bytes"}`
        );

        // Step 4: Resolve actual bytes
        let videoBytes: Uint8Array | Buffer | null = null;

        if (video.bytes) {
          // Direct bytes available
          videoBytes = Buffer.isBuffer(video.bytes)
            ? video.bytes
            : Buffer.from(video.bytes);
        } else if (video.uri && typeof video.uri === "string") {
          const uri: string = video.uri;

          if (uri.startsWith("http")) {
            // HTTP URI - fetch with API key if needed
            // Properly handle URLs that already have query parameters
            const urlObj = new URL(uri);
            if (apiKey) {
              urlObj.searchParams.set("key", apiKey);
            }
            const url = urlObj.toString();
            console.log(`[Animation Video] Downloading from HTTP URI: ${url.replace(apiKey || "", "***")}`);
            
            const resp = await fetch(url);
            if (!resp.ok) {
              const text = await resp.text();
              console.error("Veo download error:", text);
              const downloadError = new Error(`Download error: ${resp.status} ${resp.statusText}`);
              (downloadError as any).status = resp.status;
              throw downloadError;
            }
            const arrBuf = await resp.arrayBuffer();
            videoBytes = Buffer.from(arrBuf);
          } else if (uri.startsWith("gs://")) {
            // GCS URI - not supported in this implementation
            console.error("GCS URI not supported in this Node implementation:", uri);
            const gcsError = new Error("GCS URI outputs not supported in this environment");
            (gcsError as any).status = 500;
            throw gcsError;
          } else {
            // Unsupported URI format
            console.error("Unsupported video URI:", uri);
            const uriError = new Error("Unsupported video URI format");
            (uriError as any).status = 500;
            throw uriError;
          }
        }

        if (!videoBytes) {
          console.error("Could not resolve video bytes. Video object:", video);
          const bytesError = new Error("Could not resolve video bytes from Veo");
          (bytesError as any).status = 500;
          throw bytesError;
        }

        // Step 5: Convert to base64 and return JSON
        const buf = Buffer.isBuffer(videoBytes)
          ? videoBytes
          : Buffer.from(videoBytes);

        const videoBase64 = buf.toString("base64");

        console.log(
          `[Animation Video] Successfully generated video with ${currentModel} for node ${nodeId} (${buf.length} bytes)`
        );

        // Success! Break out of the retry loop
        return NextResponse.json({
          nodeId,
          animationKind,
          videoBase64,
          mimeType: "video/mp4",
        });
        
      } catch (modelError: any) {
        // If this is a 429 (rate limit), try the next model
        if (modelError?.status === 429 || modelError?.statusCode === 429) {
          console.warn(`[Animation Video] Rate limit hit with ${currentModel}, trying next model...`);
          lastError = modelError;
          // Continue to next model in the fallback chain
          continue;
        }
        
        // For non-429 errors, if this is the last model, fail
        // Otherwise, continue to next model
        lastError = modelError;
        if (currentModel === modelsToAttempt[modelsToAttempt.length - 1]) {
          // This was the last model, re-throw the error
          throw modelError;
        }
        console.warn(`[Animation Video] Error with ${currentModel}, trying next model:`, modelError.message);
        continue;
      }
    }
    
    // If we get here, all models failed
    const allModelsFailed = modelsToAttempt.length > 1
      ? `All ${modelsToAttempt.length} models failed. Last error from ${modelsToAttempt[modelsToAttempt.length - 1]}: ${lastError?.message || "Unknown error"}`
      : lastError?.message || "Unknown error";
    
    return NextResponse.json(
      {
        nodeId,
        error: allModelsFailed,
      },
      { status: lastError?.status || lastError?.statusCode || 500 }
    );
  } catch (err: any) {
    // This catch block handles unexpected errors that weren't caught by the model retry loop
    // (e.g., validation errors, API key issues, etc.)
    console.error("Error generating animation video:", err);
    
    // Handle API errors
    if (err?.message?.includes("ApiError") || err?.message?.includes("GoogleGenAI")) {
      return NextResponse.json(
        {
          nodeId,
          error: `Veo API Error: ${err.message}`,
        },
        { status: err?.status || err?.statusCode || 500 }
      );
    }
    
    return NextResponse.json(
      {
        nodeId,
        error: err?.message ?? "Unknown error generating animation video",
      },
      { status: 500 }
    );
  }
}
