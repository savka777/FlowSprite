import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import JSZip from "jszip";

// Function to get and validate ffmpeg path
function getFfmpegPath(): string | null {
  if (!ffmpegStatic) {
    console.error("ffmpeg-static module returned null/undefined");
    return null;
  }

  console.log(`ffmpeg-static provided path: ${ffmpegStatic}`);

  // Check if the path exists (this is the primary path from ffmpeg-static)
  if (fsSync.existsSync(ffmpegStatic)) {
    console.log(`Using ffmpeg at: ${ffmpegStatic}`);
    return ffmpegStatic;
  }

  // Try alternative paths - ffmpeg-static exports the path, but Next.js might bundle it differently
  const cwd = process.cwd();
  
  // Get the platform-specific executable name
  const isWindows = process.platform === "win32";
  const exeName = isWindows ? "ffmpeg.exe" : "ffmpeg";
  
  const possiblePaths = [
    // Try in node_modules/ffmpeg-static directly (check common locations)
    path.join(cwd, "node_modules", "ffmpeg-static", exeName),
    // Try the path from ffmpeg-static but relative to cwd if it's relative
    path.isAbsolute(ffmpegStatic) 
      ? ffmpegStatic 
      : path.join(cwd, ffmpegStatic),
    // Try .bin directory
    path.join(cwd, "node_modules", ".bin", exeName),
    // Try to find it by searching the ffmpeg-static package
    ...(function() {
      try {
        // Try to resolve the package location
        const packagePath = require.resolve("ffmpeg-static/package.json");
        const packageDir = path.dirname(packagePath);
        return [
          path.join(packageDir, exeName),
          path.join(packageDir, "ffmpeg", exeName),
        ];
      } catch {
        return [];
      }
    })(),
  ];

  console.log(`Searching for ffmpeg in: ${possiblePaths.join(", ")}`);

  for (const possiblePath of possiblePaths) {
    try {
      if (fsSync.existsSync(possiblePath)) {
        console.log(`Found ffmpeg at: ${possiblePath}`);
        return possiblePath;
      }
    } catch (err) {
      // Continue to next path
    }
  }

  console.error(`FFmpeg not found. Original path: ${ffmpegStatic}`);
  console.error(`Checked paths: ${possiblePaths.join(", ")}`);
  return null;
}

interface CutFramesRequest {
  nodeId: string;
  videoBase64: string; // MP4 as base64 (no data: prefix)
  fps?: number; // optional sampling rate, default ~8–10 fps
}

interface CutFramesResponse {
  nodeId: string;
  frames: { index: number; filename: string; base64: string }[];
  zipBase64: string;
}

export async function POST(request: NextRequest) {
  let nodeId = "unknown";

  try {
    const body = (await request.json()) as CutFramesRequest;
    const { nodeId: id, videoBase64, fps } = body;
    nodeId = id;

    if (!videoBase64) {
      return NextResponse.json(
        { nodeId, error: "Missing videoBase64" },
        { status: 400 }
      );
    }

    // Get and validate ffmpeg path
    const ffmpegPath = getFfmpegPath();
    if (!ffmpegPath) {
      console.error("FFmpeg binary not found");
      return NextResponse.json(
        { 
          nodeId, 
          error: "FFmpeg not available. Please ensure ffmpeg-static is properly installed. Try running: npm install ffmpeg-static" 
        },
        { status: 500 }
      );
    }

    // Set ffmpeg path
    ffmpeg.setFfmpegPath(ffmpegPath);

    // Create temporary directory
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cut-frames-"));
    const inputPath = path.join(tmpDir, "input.mp4");
    
    // Decode base64 and write video file
    const buf = Buffer.from(videoBase64, "base64");
    await fs.writeFile(inputPath, buf);

    const framePattern = path.join(tmpDir, "frame_%03d.png");
    const targetFps = fps ?? 8; // ~8 fps from ~3–4s video gives ~24–32 frames

    // Extract frames using ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .output(framePattern)
        .outputOptions(["-vf", `fps=${targetFps}`])
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    // Read all frame files
    const files = await fs.readdir(tmpDir);
    const frameFiles = files
      .filter((f) => f.startsWith("frame_") && f.endsWith(".png"))
      .sort();

    const frames: { index: number; filename: string; base64: string }[] = [];
    const zip = new JSZip();

    // Process each frame
    for (let i = 0; i < frameFiles.length; i++) {
      const filename = frameFiles[i];
      const framePath = path.join(tmpDir, filename);
      const fileBytes = await fs.readFile(framePath);
      const base64 = fileBytes.toString("base64");
      frames.push({ index: i, filename, base64 });
      zip.file(filename, fileBytes);
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipBase64 = zipBuffer.toString("base64");

    // Cleanup temporary files
    try {
      await Promise.all(
        frameFiles.map((f) => fs.unlink(path.join(tmpDir, f)))
      );
      await fs.unlink(inputPath);
      await fs.rmdir(tmpDir);
    } catch (err) {
      console.warn("Failed to cleanup temp files:", err);
      // best-effort cleanup, continue anyway
    }

    return NextResponse.json({
      nodeId,
      frames,
      zipBase64,
    } as CutFramesResponse);
  } catch (err: any) {
    console.error("Error cutting frames:", err);
    return NextResponse.json(
      {
        nodeId,
        error: err?.message ?? "Unknown error cutting frames",
      },
      { status: 500 }
    );
  }
}

