# Agent Guide - SpriteFlow Project

> **Last Updated**: December 2024  
> **Project Status**: Image Generation ✅ | Animation Generation ✅ | UI Styling ✅

## 🎯 Project Overview

**SpriteFlow** is a node-based visual editor for creating AI-generated 2D sprites and animations. Built with Next.js 14, React Flow, and TypeScript, it provides an intuitive drag-and-drop interface for building sprite generation workflows.

### Key Features
- **Node-based Editor**: Visual workflow builder using React Flow
- **6 Node Types**: Reference, Prompt, Preview, Animation, AnimationPreview
- **Fullscreen Layout**: Left sidebar (palette), center canvas, right sidebar (inspector)
- **Node Management**: Add, delete, connect, and configure nodes
- **AI Image Generation**: Google Gemini API integration for 2D sprite generation
- **AI Video Generation**: Google Veo 3.1 API integration for character animations
- **Preview System**: Generate and regenerate sprites with play button when connected
- **Animation System**: Generate 4-second animation clips (idle, walk, run, jump) from sprites
- **Context-Aware Generation**: Automatically uses connected Prompt and Reference nodes
- **Scratch-Style UI**: Color-coded node borders, cursive "Flow" text, styled export button

---

## 📋 Recent Changes (Latest Session)

### ✅ Completed Features

1. **Delete Functionality for All Nodes**
   - Added delete button (trash icon) to all node types
   - Implemented `handleDeleteNode` in `SpriteFlowPage.tsx`
   - Automatically removes connected edges when node is deleted
   - Clears selection if deleted node was selected
   - All buttons use `stopPropagation()` to prevent node selection

2. **Play Button for Preview Node**
   - Play button appears when Preview node is connected to Prompt or Reference
   - Button visibility updates automatically when edges change
   - Triggers `handlePlay` callback for preview generation
   - Only shows when connected to valid source nodes (prompt/reference)

3. **Google Gemini Image Generation Integration** ✅
   - **API Route**: Created `app/api/preview/route.ts` with Gemini API integration
   - **Model Selection**: Automatically detects and uses `gemini-2.5-flash-image` models
   - **Reference Image Support**: Reference nodes store base64 data for API calls
   - **Context Gathering**: Automatically collects prompt text and reference images from connected nodes
   - **Image Generation**: Uses Gemini 2.5 Flash Image model for sprite generation
   - **Prompt Engineering**: Optimized prompts for 2D pixel art sprites (not 3D)
   - **Error Handling**: Comprehensive error handling for quota, model not found, etc.
   - **Model Discovery**: Automatic model listing to find available image generation models
   - **Preview Context Reuse**: Preview nodes can now use their generated images as context for new preview nodes

4. **Google Veo 3.1 Video Generation Integration** ⭐ **NEW**
   - **API Route**: Created `app/api/animation-video/route.ts` with Veo 3.1 API integration
   - **Model**: Uses `veo-3.1-fast-generate-preview` (configurable via `VEO_MODEL` env var)
   - **SDK**: Uses `@google/genai` SDK (`GoogleGenAI` client)
   - **Animation Types**: Supports idle, walk, run, and jump animations
   - **Image-to-Video**: Takes sprite from connected Preview node as input
   - **Video Specs**: 4-second clips, 16:9 aspect ratio, white background enforced
   - **Prompt Engineering**: Strong negative prompts to prevent 3D/realistic output, emphasizes 2D pixel art
   - **Deterministic Seeds**: Uses nodeId-based seed for consistent results
   - **Polling System**: Polls operation status every 5 seconds (max 60 polls = 5 minutes)
   - **Video Download**: Handles both `video.bytes` and HTTP URI downloads with API key authentication
   - **Error Handling**: Comprehensive error handling for API failures, quota limits, invalid parameters

5. **Animation Node System** ⭐ **NEW**
   - **Animation Node**: Configurable node with animation type selector (idle/walk/run/jump)
   - **Extra Prompt Input**: Optional text field to tweak animation behavior
   - **Play Button**: Appears when connected to Preview node with generated sprite
   - **Status Management**: Shows generating/ready/error states
   - **Video Storage**: Stores `videoBase64` and `mimeType` in node data
   - **Animation Preview Node**: Displays generated video in looping `<video>` element
   - **Redo Button**: Allows regenerating animation clips
   - **Connection Logic**: Animation nodes connect to Preview nodes, AnimationPreview nodes connect to Animation nodes

6. **UI Styling Improvements** ⭐ **NEW**
   - **Scratch-Style Colored Borders**: Each node type has a unique border color
     - Reference: `#4C97FF` (Scratch blue)
     - Prompt: `#4CBF4F` (Scratch green)
     - Preview: `#9966FF` (Scratch purple)
     - Animation: `#FF8C1A` (Scratch orange)
     - AnimationPreview: `#FF6680` (Scratch pink)
   - **Cursive "Flow" Text**: Uses Pacifico Google Font, yellow color (#FFD700), thin black border
   - **Export Button**: Yellow fill (#FFD700), black text, black border, hover effect
   - **Sidebar Icons**: Lucide React icons for each node type in the palette
     - Reference: `ImageIcon`
     - Prompt: `Type`
     - Preview: `Eye`
     - Animation: `Film`
     - AnimationPreview: `Video`
   - **Preview Sizing**: Preview nodes use `h-48` (192px), AnimationPreview nodes use `h-40` (160px)
   - **Border Styling**: 3px solid borders with matching box shadows for depth

7. **Code Improvements**
   - Updated TypeScript types to include animation callbacks (`onGenerateAnimation`, `onPlay`)
   - Enhanced `getGraphState` to filter out new callback properties
   - Added `handleGenerateAnimation` function for video generation flow
   - Improved connection detection for Animation nodes
   - Added `borderColor` prop to `SpriteNodeWrapper` for custom node colors
   - Google Font integration via `next/font/google` for reliable cursive rendering

### 📁 Files Modified
- `components/flow/nodes/SpriteNodeWrapper.tsx` - Added delete, play button support, `borderColor` prop for Scratch-style borders
- `components/SpriteFlowPage.tsx` - Added delete, play, animation handlers, edge detection logic, Gemini/Veo API integration, UI styling (cursive font, export button, sidebar icons)
- `components/flow/SpriteFlowCanvas.tsx` - Updated props, improved callback handling, filters new callbacks in serialization
- `components/flow/nodes/PreviewNode.tsx` - Updated size (`h-48`), white background, loading states, purple border
- `components/flow/nodes/ReferenceNode.tsx` - Added base64 encoding for API calls, blue border
- `components/flow/nodes/PromptNode.tsx` - Added green border
- `components/flow/nodes/AnimationNode.tsx` - Complete rewrite with play button, extra prompt input, status management, orange border
- `components/flow/nodes/AnimationPreviewNode.tsx` - Complete rewrite with video player, redo button, status management, pink border
- `lib/flowTypes.ts` - Added animation types, callbacks, video fields, status management
- `app/api/preview/route.ts` - Gemini API integration for image generation
- `app/api/animation-video/route.ts` - **NEW** Veo 3.1 API integration for video generation
- `app/layout.tsx` - Added Pacifico Google Font for cursive "Flow" text
- `package.json` - Added `@google/genai` dependency (for Veo 3.1)

---

## 🏗️ Architecture & Code Structure

### Project Structure
```
FlowSprite/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page (dynamically loads SpriteFlowPage)
│   └── globals.css         # Global styles
├── components/
│   ├── SpriteFlowPage.tsx  # Main page component (state management)
│   └── flow/
│       ├── SpriteFlowCanvas.tsx  # React Flow canvas wrapper
│       └── nodes/
│           ├── SpriteNodeWrapper.tsx    # Shared node UI wrapper
│           ├── ReferenceNode.tsx         # Reference image upload
│           ├── PromptNode.tsx            # Text prompt input
│           ├── PreviewNode.tsx           # Sprite preview with play/regenerate
│           ├── AnimationNode.tsx         # Animation generation nodes
│           └── AnimationPreviewNode.tsx  # Animation preview
└── lib/
    └── flowTypes.ts        # TypeScript type definitions
```

### Component Hierarchy
```
SpriteFlowPage (State Management)
  ├── Left Sidebar (Node Palette)
  ├── SpriteFlowCanvas (React Flow Wrapper)
  │   └── Individual Node Components
  │       └── SpriteNodeWrapper (Shared UI)
  └── Right Sidebar (Inspector)
```

---

## 🔑 Key Concepts & Patterns

### 1. Node Data Flow
- **State Management**: All node state lives in `SpriteFlowPage.tsx`
- **Callback Pattern**: Callbacks are injected into node data via `nodesWithCallbacks` memo
- **Edge Detection**: Preview nodes check for incoming edges from prompt/reference to show play button
- **Serialization**: `getGraphState()` filters out callbacks before export

### 2. Node Types & Their Capabilities

| Node Type | Handles | Actions Available | Border Color |
|-----------|---------|-------------------|-------------|
| **Reference** | Image upload | Delete | Blue (#4C97FF) |
| **Prompt** | Text input | Delete | Green (#4CBF4F) |
| **Preview** | Sprite preview | Delete, Play (when connected), Regenerate | Purple (#9966FF) |
| **Animation** | Animation config (idle/walk/run/jump) | Delete, Play (when connected to Preview), Extra prompt input | Orange (#FF8C1A) |
| **AnimationPreview** | Animation video preview | Delete, Redo (regenerate) | Pink (#FF6680) |

### 3. Callback System

All nodes receive callbacks through their `data` prop:
- `onUpdate`: For editable nodes (Reference, Prompt, Animation)
- `onDelete`: For all nodes (deletes node and connected edges)
- `onRegenerate`: For preview nodes (Preview, AnimationPreview)
- `onPlay`: For Preview nodes when connected to prompt/reference, and for Animation nodes when connected to Preview
- `onGenerateAnimation`: For Animation nodes (triggers video generation)

**Important**: Callbacks are added in `SpriteFlowPage.tsx` via `nodesWithCallbacks` memo, which depends on `nodes`, `edges`, and handler functions.

### 4. Edge Connection Logic

**Preview nodes** show play button when:
```typescript
hasIncomingEdges && isConnectedToPromptOrReference
```
Calculated by finding edges targeting the preview node and checking if source nodes are "prompt" or "reference".

**Animation nodes** show play button when:
```typescript
hasIncomingEdges && isConnectedToPreview
```
Calculated by finding edges targeting the animation node and checking if source node is "preview" with a generated image.

**AnimationPreview nodes** connect to Animation nodes and display the generated video.

---

## 🎨 UI Components

### SpriteNodeWrapper
Shared wrapper component for all nodes providing:
- **Header**: Title, status indicator, action buttons
- **Status Colors**: 
  - Gray (idle), Yellow (generating), Green (ready), Red (error)
- **Action Buttons**:
  - Play (green) - For Preview when connected to Prompt/Reference, and for Animation when connected to Preview
  - Regenerate (gray) - For preview nodes
  - Delete (red) - All nodes
- **Custom Borders**: `borderColor` prop for Scratch-style colored borders (3px solid with matching shadow)
- **Preview Frame**: White background container for images/videos

### Button Behavior
- All action buttons use `e.stopPropagation()` to prevent node selection
- Hover effects with color-coded backgrounds
- Icons from `lucide-react`
- Export button: Yellow fill (#FFD700), black text, black border, hover to lighter yellow

---

## 🔌 Backend Integration Points

### ✅ Completed

1. **Image Generation API** ✅
   - **File**: `app/api/preview/route.ts`
   - **Status**: Fully implemented
   - **Model**: Uses `gemini-2.5-flash-image` (automatically detected)
   - **Features**:
     - Accepts prompt text and reference images
     - Generates 2D pixel art sprites
     - Returns base64 image data
     - Comprehensive error handling
     - Supports using Preview node images as context for new previews

2. **Video Generation API** ✅
   - **File**: `app/api/animation-video/route.ts`
   - **Status**: Fully implemented
   - **Model**: Uses `veo-3.1-fast-generate-preview` (configurable via `VEO_MODEL` env var)
   - **SDK**: `@google/genai` with `GoogleGenAI` client
   - **Features**:
     - Image-to-video generation from sprite images
     - 4-second clips, 16:9 aspect ratio
     - White background enforcement
     - Deterministic seeds (nodeId-based)
     - Asynchronous polling (5s intervals, max 60 polls)
     - Video download from `video.bytes` or HTTP URI
     - Comprehensive error handling

3. **Reference Node Base64 Encoding** ✅
   - **File**: `components/flow/nodes/ReferenceNode.tsx`
   - **Status**: Implemented
   - Stores both `imageUrl` (for preview) and `imageBase64` (for API)
   - Also stores `mimeType` for proper API formatting

4. **Preview Generation Flow** ✅
   - **File**: `components/SpriteFlowPage.tsx` - `handleRegenerate`
   - **Status**: Fully implemented
   - Gathers context from connected Prompt/Reference nodes
   - Can also use connected Preview node images as context
   - Calls `/api/preview` endpoint
   - Updates node status and displays generated image

5. **Animation Generation Flow** ✅
   - **File**: `components/SpriteFlowPage.tsx` - `handleGenerateAnimation`
   - **Status**: Fully implemented
   - Finds connected Preview node with generated sprite
   - Extracts `spriteBase64` from Preview node
   - Calls `/api/animation-video` endpoint
   - Updates Animation node and connected AnimationPreview nodes with video data
   - Handles status updates (generating → ready/error)

### ⚠️ Remaining TODOs

1. **Export Functionality**
   - **File**: `components/SpriteFlowPage.tsx:96`
   - **Current**: Logs graph state to console
   - **Action Needed**: Send graph state to backend API to generate spritesheet and metadata

---

## 🛠️ Development Guidelines

### Adding a New Node Type

1. **Define Type** in `lib/flowTypes.ts`:
   ```typescript
   export interface MyNodeData {
     type: 'myNode';
     // ... other properties
     onDelete?: () => void;
   }
   ```

2. **Create Component** in `components/flow/nodes/MyNode.tsx`:
   ```typescript
   export function MyNode({ id, data }: NodeProps<MyNodeData>) {
     const handleDelete = () => {
       if (data.onDelete) data.onDelete();
     };
     
     return (
       <>
         <Handle type="target" position={Position.Left} />
         <SpriteNodeWrapper 
           title="My Node"
           showDelete={true}
           onDelete={handleDelete}
         >
           {/* Content */}
         </SpriteNodeWrapper>
       </>
     );
   }
   ```

3. **Register** in `components/flow/SpriteFlowCanvas.tsx`:
   ```typescript
   const nodeTypes: NodeTypes = {
     // ... existing
     myNode: MyNode,
   };
   ```

4. **Add to Palette** in `components/SpriteFlowPage.tsx`:
   - Add button in left sidebar
   - Add case in `handleAddNode` switch statement
   - Add callback handling in `nodesWithCallbacks` memo

### State Management Pattern

- **Nodes & Edges**: Managed in `SpriteFlowPage` with React state
- **Callbacks**: Injected via `useMemo` that depends on nodes, edges, and handlers
- **Updates**: Use functional updates (`prev => ...`) for state updates
- **Selection**: Tracked with `selectedNodeId` state

### Event Handling

- **Node Clicks**: Use `onNodeClick` to select nodes (shows in inspector)
- **Button Clicks**: Always use `e.stopPropagation()` to prevent node selection
- **Edge Changes**: Handled via `handleEdgesChange` with `applyEdgeChanges`
- **Node Changes**: Handled via `handleNodesChange` with `applyNodeChanges`

---

## 📝 Current State

### ✅ Working Features
- ✅ Add nodes from palette (with Lucide React icons)
- ✅ Connect nodes via drag-and-drop
- ✅ Delete nodes (removes connected edges automatically)
- ✅ Edit prompt text
- ✅ Upload reference images (with base64 encoding for API)
- ✅ Play button appears when Preview connected to Prompt/Reference
- ✅ Regenerate button for preview nodes
- ✅ **AI Image Generation**: Generate 2D pixel art sprites using Gemini API
- ✅ **AI Video Generation**: Generate 4-second animation clips using Veo 3.1 API
- ✅ **Animation Types**: Idle, walk, run, and jump animations
- ✅ **Context Gathering**: Automatically collects prompt and reference images from connected nodes
- ✅ **Preview Context Reuse**: Preview nodes can use generated images as context for new previews
- ✅ **Status Management**: Visual feedback during generation (spinner, error states)
- ✅ **Scratch-Style UI**: Color-coded node borders, cursive "Flow" text, styled export button
- ✅ Node selection and inspector panel
- ✅ Export graph state (logs to console)

### ✅ Backend Integration Status
- ✅ **Image Generation**: Fully integrated with Google Gemini API (`gemini-2.5-flash-image`)
- ✅ **Video Generation**: Fully integrated with Google Veo 3.1 API (`veo-3.1-fast-generate-preview`)
- ✅ **Reference Image Upload**: Base64 encoding for API calls
- ✅ **Preview Image Storage**: Base64 encoding for use as context in new previews
- ✅ **Prompt + Reference Context**: Automatically gathered from connected nodes
- ✅ **Sprite-to-Video**: Animation nodes extract sprite from connected Preview nodes
- ⚠️ Export functionality (backend processing - currently logs to console)

### 🎯 Node Status Flow
```
idle → generating → ready/error
```
- **idle**: Initial state, no generation
- **generating**: API call in progress
- **ready**: Generation complete, image available
- **error**: Generation failed

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Gemini API Key (for image generation)

### Setup
```bash
npm install
```

### Environment Setup
Create `.env.local` file in the project root:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_google_api_key_here  # Alternative name (both work)
VEO_MODEL=veo-3.1-fast-generate-preview  # Optional, defaults to veo-3.1-fast-generate-preview
```

**Note**: Both `GEMINI_API_KEY` and `GOOGLE_API_KEY` are supported. The Veo API route checks both.

### Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

### Development Workflow
1. Set up `.env.local` with `GEMINI_API_KEY`
2. Run `npm run dev`
3. Make changes to components
4. Hot reload will update automatically
5. Check browser console for frontend errors
6. Check server console for API errors and model listings
7. Test node interactions (add, delete, connect)
8. Test image generation by connecting Prompt/Reference to Preview and clicking regenerate

### Testing Image Generation
1. Add a Prompt node with text description
2. Optionally add a Reference node with an image
3. Add a Preview node
4. Connect Prompt/Reference to Preview
5. Click the regenerate button (circular arrow) or play button
6. Wait for generation (shows spinner)
7. Generated sprite should appear with white background

---

## 🔍 Important Files Reference

### Core Files
- **`components/SpriteFlowPage.tsx`**: Main state management, handlers, node/edge logic
- **`components/flow/SpriteFlowCanvas.tsx`**: React Flow wrapper, node type registration
- **`lib/flowTypes.ts`**: All TypeScript type definitions
- **`components/flow/nodes/SpriteNodeWrapper.tsx`**: Shared UI wrapper for all nodes

### Node Components
- **`ReferenceNode.tsx`**: Image upload with base64 encoding for API
- **`PromptNode.tsx`**: Text input with `onUpdate` callback
- **`PreviewNode.tsx`**: Preview with play/regenerate/delete buttons, image display
- **`AnimationNode.tsx`**: Animation configuration
- **`AnimationPreviewNode.tsx`**: Animation preview with regenerate

### API Routes
- **`app/api/preview/route.ts`**: Gemini API integration for sprite image generation
  - Model selection (auto-detects `gemini-2.5-flash-image`)
  - Prompt engineering for 2D pixel art
  - Reference image support
  - Preview image context reuse
  - Error handling

- **`app/api/animation-video/route.ts`**: Veo 3.1 API integration for video generation
  - Model: `veo-3.1-fast-generate-preview` (configurable)
  - Image-to-video generation from sprites
  - 4-second clips, 16:9 aspect ratio
  - White background enforcement
  - Deterministic seeds
  - Asynchronous polling and video download
  - Comprehensive error handling

---

## 💡 Tips for Future Agents

1. **Image Generation**:
   - Uses `gemini-2.5-flash-image` model (automatically detected)
   - Model selection happens in `app/api/preview/route.ts`
   - Prompt engineering is critical - see current prompt for 2D sprite style
   - Reference images are sent as base64 `inlineData` parts
   - Generated images are returned as base64 and converted to data URLs
   - Preview nodes can use their generated images as context for new previews

2. **Video Generation**:
   - Uses `veo-3.1-fast-generate-preview` model (configurable via `VEO_MODEL` env var)
   - SDK: `@google/genai` with `GoogleGenAI` client
   - Image-to-video: Takes sprite base64 from connected Preview node
   - Duration: 4 seconds (minimum allowed by Veo API, range is 4-8 seconds)
   - Aspect ratio: 16:9
   - Polling: Checks operation status every 5 seconds, max 60 polls (5 minutes)
   - Video download: Handles both `video.bytes` (direct) and HTTP URI (with API key in query params)
   - Deterministic: Uses nodeId-based seed for consistent results

3. **Model Selection**:
   - Image generation: Code automatically lists available models on each request (for debugging)
   - Prefers `gemini-2.5-flash-image` models (support `generateContent`)
   - Imagen models exist but use `predict` method (different API structure)
   - Video generation: Uses fixed model name `veo-3.1-fast-generate-preview` (can be overridden)
   - Check console logs to see which models are available

4. **Prompt Engineering for Images**:
   - **Location**: `app/api/preview/route.ts` - `baseInstructions` variable
   - **Current Prompt Strategy**:
     - Emphasizes: "flat 2D pixel art, NOT 3D, NOT photorealistic, NOT rendered"
     - Negative prompts: "no shadows, no 3D effects, no depth, no gradients"
     - References: "classic video game sprite style", "2D sprite sheet style"
     - Background: "white solid background (not transparent, not checkerboard)"
   - **If images look too 3D**: 
     - Strengthen negative prompts
     - Add more pixel art references (e.g., "8-bit", "16-bit", "retro game sprite")
     - Consider adjusting temperature (currently 0.4)
   - **Prompt Structure**: User prompt + base instructions combined

5. **Prompt Engineering for Videos**:
   - **Location**: `app/api/animation-video/route.ts` - `buildAnimationPrompt` function
   - **Current Prompt Strategy**:
     - **CRITICAL STYLE REQUIREMENTS**: Strong negative prompts to prevent 3D/realistic output
     - Emphasizes: "2D PIXEL ART animation", "maintain EXACT same 2D pixel art style"
     - Negative prompts: "DO NOT make it 3D", "DO NOT make it photorealistic", "DO NOT add depth/shadows/lighting/gradients/shine"
     - Background: "solid pure white background (#FFFFFF), completely flat"
     - **Animation-Specific Instructions**:
       - **Idle**: Subtle breathing motion, single seamless loop, no extra actions
       - **Walk**: Walk cycle in place, side view, one clean cycle returning to start pose
       - **Run**: Faster than walk, stronger motion, single smooth cycle ending near start pose
       - **Jump**: Anticipation → jump → hang → landing → settle, one complete cycle
     - **Duration**: Explicitly mentions "about 4 seconds" and "single seamless cycle"
     - **Loopability**: Emphasizes returning to starting pose for seamless looping
   - **If videos look too 3D**: 
     - Strengthen the base style negative prompts
     - Add more explicit "2D pixel art" references
     - Consider the model may have limitations (Veo 3.1 is designed for realistic video)
   - **Prompt Structure**: Base style + animation-specific motion + optional extra prompt

4. **Testing node connections**:
   - Preview node needs incoming edge from Prompt or Reference (or another Preview)
   - Animation node needs incoming edge from Preview with generated image
   - AnimationPreview node needs incoming edge from Animation node
   - Play button visibility depends on edge connections
   - Use React DevTools to inspect node data

5. **Video Generation Workflow**:
   - Create a Preview node and generate a sprite
   - Create an Animation node (select idle/walk/run/jump)
   - Connect Preview → Animation
   - Click play button on Animation node (or use "Generate Clip" if visible)
   - Wait for polling to complete (check console for progress)
   - Video appears in connected AnimationPreview node(s)
   - Can add extra prompt text in Animation node to tweak motion

5. **Debugging**:
   - Check `nodesWithCallbacks` memo dependencies
   - Verify callbacks are being passed correctly
   - Check server console for model listing and API errors
   - Use browser console for frontend errors

6. **Performance**:
   - `nodesWithCallbacks` memo prevents unnecessary re-renders
   - Edge detection runs on every nodes/edges change (acceptable for small graphs)
   - Model listing happens on each request (consider caching if needed)
   - Video generation is asynchronous with polling (5s intervals)
   - Video files are stored as base64 in node data (consider streaming for large files)

7. **Type Safety**:
   - All node data types are in `flowTypes.ts`
   - Use TypeScript's discriminated unions for type narrowing
   - Check `node.data.type` before accessing type-specific properties

---

## 📚 Dependencies

- **Next.js 14**: App Router, SSR disabled for React Flow
- **React Flow v11**: Node-based editor library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **lucide-react**: Icons
- **@google/generative-ai**: Google Gemini API SDK for image generation
- **@google/genai**: Google Veo 3.1 API SDK for video generation
- **next/font/google**: Google Fonts integration (Pacifico for cursive text)

---

## 🐛 Known Issues / Future Improvements

1. ✅ **Backend integration** - Image generation fully implemented with Gemini API
2. ✅ **Video generation** - Fully implemented with Veo 3.1 API
3. ✅ **Error handling** - Comprehensive error handling for API failures, quota limits, model not found
4. ✅ **Loading states** - Visual feedback with spinner during generation
5. ✅ **UI Styling** - Scratch-style colored borders, cursive font, styled buttons
6. **No undo/redo** - Node deletion is permanent
7. **No save/load** - Graph state not persisted
8. **Edge validation** - No validation for which nodes can connect to which
9. **Model listing** - Currently lists models on every request (could be cached)
10. **Video style** - Veo 3.1 may still produce 3D-looking videos despite strong prompts (model limitation)
11. **Prompt refinement** - May need further tuning for better 2D sprite/video results
12. **Video file size** - Base64 storage in node data may be inefficient for large files

---

## 📞 Quick Reference

### Delete a Node
```typescript
handleDeleteNode(nodeId) // Removes node and all connected edges
```

### Check if Preview Can Play
```typescript
hasIncomingEdges && isConnectedToPromptOrReference
```

### Generate Preview Image
```typescript
// In SpriteFlowPage.tsx - handleRegenerate
// 1. Finds connected Prompt/Reference nodes
// 2. Gathers prompt text and reference images (base64)
// 3. Calls POST /api/preview with context
// 4. Updates node with generated image
```

### API Endpoint: Generate Preview
```typescript
POST /api/preview
Body: {
  nodeId: string;
  promptText?: string;
  references?: { mimeType: string; base64: string }[];
  seed?: number;
}
Response: {
  nodeId: string;
  imageBase64: string;
}
```

### API Endpoint: Generate Animation Video
```typescript
POST /api/animation-video
Body: {
  nodeId: string;
  animationKind: "idle" | "walk" | "run" | "jump";
  spriteBase64: string;  // Base64 string (no data: prefix)
  promptText?: string;  // Optional extra prompt
}
Response: {
  nodeId: string;
  animationKind: string;
  videoBase64: string;  // Base64 string (no data: prefix)
  mimeType: string;     // e.g. "video/mp4"
}
```

### Get Graph State (for export)
```typescript
const graphState = getGraphState(nodes, edges);
// Filters out callbacks automatically
```

### Update Node Data
```typescript
setNodes((prev) =>
  prev.map((node) =>
    node.id === targetId
      ? { ...node, data: { ...node.data, ...updates } }
      : node
  )
);
```

### Environment Variables Required
```bash
GEMINI_API_KEY=your_api_key_here
# OR
GOOGLE_API_KEY=your_api_key_here
# Optional:
VEO_MODEL=veo-3.1-fast-generate-preview
```

**Note**: Both `GEMINI_API_KEY` and `GOOGLE_API_KEY` are supported. The Veo API route checks both.

---

**Happy Coding! 🎨**

