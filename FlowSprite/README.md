# SpriteFlow

A powerful node-based visual editor for creating AI-generated 2D sprites and animations using **Google Gemini AI**. Build game-ready sprites and animations through an intuitive drag-and-drop interface powered by Google's cutting-edge AI models.

![SpriteFlow](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5-orange?style=flat-square)

## 🏆 Hackathon Win

SpriteFlow was built for the **[Gemini Vibe Code Hackathon – London](https://cerebralvalley.ai/e/vibe-code-gemini-london)** and **took 1st place**, winning **$50,000 in Gemini API credits** from Google.  
This project started as a rapid prototype in Google AI Studio and grew into a full end-to-end AI-powered sprite and animation pipeline.

## 🎯 What is SpriteFlow?

SpriteFlow is a visual workflow editor that leverages **Google Gemini AI** to generate 2D pixel art sprites and animations for game development. Instead of manually drawing sprites, you can:

- **Generate sprites** from text descriptions using Gemini 2.5 Flash Image
- **Create animations** from sprites using Veo 3.1 video generation
- **Extract frames** from animations to create sprite sheets
- **Export everything** as organized ZIP files for your game engine

All powered by Google's Gemini AI models running in the cloud.

## ✨ Key Features

### 🎨 AI-Powered Sprite Generation
- **Gemini 2.5 Flash Image**: Generate 2D pixel art sprites from text prompts
- **Reference Image Support**: Use uploaded images as style references
- **Context-Aware**: Automatically combines prompts and references from connected nodes
- **2D Pixel Art Focus**: Optimized prompts ensure flat, game-ready sprites (not 3D)

### 🎬 AI-Powered Animation Generation
- **Veo 3.1 Fast**: Generate 4-second animation clips from sprite images
- **Animation Types**: Idle, Walk, Run, and Jump animations
- **Image-to-Video**: Seamlessly convert static sprites into animated sequences
- **Automatic Model Fallback**: Switches between Veo models when hitting rate limits

### 🎮 Complete Pipeline
- **Frame Extraction**: Cut animation videos into individual PNG frames
- **Sprite Sheet Preview**: Interactive carousel to preview all frames
- **Export System**: Download sprites and frames as organized ZIP files
- **Community Demos**: Play games built with generated sprites

### 🎨 Visual Editor
- **Node-Based Workflow**: Drag-and-drop interface using React Flow
- **Real-Time Preview**: See generated sprites and animations instantly
- **Inspector Panel**: View and edit node properties
- **Scratch-Style UI**: Color-coded nodes with intuitive design

## 🤖 Google Gemini Integration

SpriteFlow is built around **Google Gemini AI** models for both image and video generation.

### Image Generation: Gemini 2.5 Flash Image

**Model**: `gemini-2.5-flash-image` (automatically detected)

**Features**:
- Generates 2D pixel art sprites with transparent or white backgrounds
- Accepts text prompts and reference images
- Optimized for game sprite style (flat, not 3D)
- Fast generation with high quality output

**API Endpoint**: `/api/preview`

**Rate Limits** (Free Tier):
- 500 RPM (Requests Per Minute)
- 500,000 TPM (Tokens Per Minute)
- 2,000 RPD (Requests Per Day)

### Video Generation: Veo 3.1 Fast

**Model**: `veo-3.1-fast-generate-preview` (with automatic fallback chain)

**Features**:
- Converts static sprites into animated video clips
- 4-second clips at 16:9 aspect ratio
- Enforces 2D pixel art style (prevents 3D rendering)
- Asynchronous generation with polling system

**API Endpoint**: `/api/animation-video`

**Rate Limits** (Free Tier):
- 2 RPM (Requests Per Minute)
- 10 RPD (Requests Per Day)

**Model Fallback Chain**:
1. `veo-3.1-fast-generate-preview` (primary)
2. `veo-3.1-generate-preview` (fallback 1)
3. `veo-3.0-generate-preview` (fallback 2)
4. `veo-2-generate-preview` (fallback 3 - higher daily limit: 50 RPD)

The system automatically switches models when hitting rate limits, ensuring maximum availability.

### Frame Extraction

**Technology**: FFmpeg + JSZip

**Features**:
- Extracts PNG frames from animation videos
- Configurable frame rate (default: 8 fps)
- Creates ZIP archives of all frames
- Organizes exports for game engines

**API Endpoint**: `/api/cut-frames`

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework
- **TypeScript** - Type-safe development
- **React Flow v11** - Node-based visual editor
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Backend (API Routes)
- **Google Gemini API** (`@google/generative-ai`) - Image generation
- **Google Veo API** (`@google/genai`) - Video generation
- **FFmpeg** (`fluent-ffmpeg` + `ffmpeg-static`) - Video processing
- **JSZip** - ZIP file creation

### AI Models Used
- **Gemini 2.5 Flash Image** - Sprite generation
- **Veo 3.1 Fast** - Animation generation
- **Veo 3.1** - Animation fallback
- **Veo 3.0** - Animation fallback
- **Veo 2** - Animation fallback (higher daily limit)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API Key ([Get one here](https://ai.google.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FlowSprite/FlowSprite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   # Optional: Override default Veo model
   # VEO_MODEL=veo-3.1-generate-preview
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 📖 Usage Guide

### Creating a Sprite

1. **Add a Prompt Node**: Click "Prompt" in the sidebar and enter a description (e.g., "A cute pixel art dragon")
2. **Add a Preview Node**: Click "Preview" in the sidebar
3. **Connect Nodes**: Drag from the Prompt node's output handle to the Preview node's input handle
4. **Generate**: Click the play button (▶️) on the Preview node
5. **View Result**: The generated sprite appears in the Preview node

### Adding Reference Images

1. **Add a Reference Node**: Click "Reference" in the sidebar
2. **Upload Image**: Click the upload area and select an image file
3. **Connect to Preview**: Link the Reference node to your Preview node
4. **Generate**: The sprite will use the reference image as style guidance

### Creating Animations

1. **Generate a Sprite**: Follow the steps above to create a sprite
2. **Add an Animation Node**: Click "Idle Animation", "Walk Animation", "Run Animation", or "Jump Animation"
3. **Connect to Preview**: Link the Animation node to your Preview node (with generated sprite)
4. **Generate Animation**: Click the play button on the Animation node
5. **Add Animation Preview**: Add an "Animation Preview" node and connect it to see the video
6. **Wait for Generation**: Video generation takes 1-5 minutes (polling happens automatically)

### Extracting Frames

1. **Add a Cut Node**: Click "Cut to Sprites" in the sidebar
2. **Connect to Animation**: Link the Cut node to an Animation or AnimationPreview node
3. **Cut Frames**: Click "Cut Frames" button
4. **Preview Frames**: Add a "Sprite Frames Preview" node and connect it to the Cut node
5. **Download**: Click "Download Sprites" to get a ZIP file with all frames

### Exporting Everything

Click the "Export" button in the top-right corner to download:
- All generated sprites in a `character/` folder
- All frame sequences in `frames/` folders
- Organized as a single ZIP file

## 🎮 Community Demos

Click the "Community Demo" button in the sidebar to:
- Browse community-created games
- Play games built with SpriteFlow-generated sprites
- See examples of what's possible with the tool

## 📁 Project Structure

```
FlowSprite/
├── app/
│   ├── api/
│   │   ├── preview/              # Gemini image generation
│   │   ├── animation-video/      # Veo video generation
│   │   └── cut-frames/           # Frame extraction
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── SpriteFlowPage.tsx        # Main page component
│   └── flow/
│       ├── SpriteFlowCanvas.tsx  # React Flow wrapper
│       └── nodes/                # Node components
├── lib/
│   └── flowTypes.ts              # TypeScript types
├── public/
│   └── cropped_no_bg/            # Community demos
└── package.json
```

## 🔧 API Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |
| `VEO_MODEL` | Override default Veo model | No |
| `GOOGLE_API_KEY` | Alternative to GEMINI_API_KEY | No |

### Model Selection

The system automatically:
- **Detects available Gemini models** for image generation
- **Falls back to alternative Veo models** when hitting rate limits
- **Logs available models** to console for debugging

### Rate Limit Handling

- **Automatic model switching** when hitting 429 errors
- **Clear error messages** explaining quota issues
- **Fallback chain** ensures maximum availability

## 🎨 Node Types

| Node Type | Purpose | Border Color | Icon |
|-----------|---------|--------------|------|
| **Reference** | Upload reference images | Blue (#4C97FF) | 📷 |
| **Prompt** | Text descriptions | Green (#4CBF4F) | ✏️ |
| **Preview** | Sprite preview & generation | Purple (#9966FF) | 👁️ |
| **Animation** | Animation configuration | Orange (#FF8C1A) | 🎬 |
| **AnimationPreview** | Video preview | Pink (#FF6680) | 🎥 |
| **Cut** | Frame extraction | Teal (#1ABC9C) | ✂️ |
| **SpriteFramesPreview** | Frame carousel | Blue (#3498DB) | 📊 |

## 🐛 Troubleshooting

### "Quota exceeded" errors

- **Image Generation**: Check your Gemini API quota in [Google Cloud Console](https://console.cloud.google.com/)
- **Video Generation**: Veo has separate rate limits (2 RPM, 10 RPD on free tier)
- **Solution**: The system automatically tries alternative models, or wait for quota reset

### "Model not found" errors

- The system automatically lists available models
- Check console logs to see which models are available
- Ensure your API key has access to the required models

### Video generation taking too long

- Normal generation time: 1-5 minutes
- The system polls every 5 seconds automatically
- Maximum wait time: 5 minutes (60 polls)

## 📚 Resources

- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Veo 3.1 Documentation](https://ai.google.dev/gemini-api/docs/veo)
- [React Flow Documentation](https://reactflow.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own games and projects!

## 🙏 Acknowledgments

- **Google Gemini AI** for powering sprite and animation generation
- **React Flow** for the excellent node-based editor
- **Next.js** for the amazing framework
- The open-source community for inspiration and tools

---

**Built with ❤️ using Google Gemini AI**
