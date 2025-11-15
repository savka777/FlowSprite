# Agent Guide - SpriteFlow Project

> **Last Updated**: December 2024  
> **Project Status**: Image Generation Integrated - Animation Generation Pending

## 🎯 Project Overview

**SpriteFlow** is a node-based visual editor for creating AI-generated 2D sprites and animations. Built with Next.js 14, React Flow, and TypeScript, it provides an intuitive drag-and-drop interface for building sprite generation workflows.

### Key Features
- **Node-based Editor**: Visual workflow builder using React Flow
- **5 Node Types**: Reference, Prompt, Preview, Animation, AnimationPreview
- **Fullscreen Layout**: Left sidebar (palette), center canvas, right sidebar (inspector)
- **Node Management**: Add, delete, connect, and configure nodes
- **AI Image Generation**: Google Gemini API integration for 2D sprite generation
- **Preview System**: Generate and regenerate sprites with play button when connected
- **Context-Aware Generation**: Automatically uses connected Prompt and Reference nodes

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

3. **Google Gemini Image Generation Integration** ⭐ **NEW**
   - **API Route**: Created `app/api/preview/route.ts` with Gemini API integration
   - **Model Selection**: Automatically detects and uses `gemini-2.5-flash-image` models
   - **Reference Image Support**: Reference nodes store base64 data for API calls
   - **Context Gathering**: Automatically collects prompt text and reference images from connected nodes
   - **Image Generation**: Uses Gemini 2.5 Flash Image model for sprite generation
   - **Prompt Engineering**: Optimized prompts for 2D pixel art sprites (not 3D)
   - **Error Handling**: Comprehensive error handling for quota, model not found, etc.
   - **Model Discovery**: Automatic model listing to find available image generation models

4. **UI Improvements**
   - **Preview Node Size**: Scaled down from `aspect-square` to `h-36` (144px) to match other nodes
   - **White Background**: Changed from gray/transparent checkerboard to solid white background
   - **Loading States**: Added spinner and "Generating..." message during API calls
   - **Error Display**: Better error messages in the UI

5. **Code Improvements**
   - Updated TypeScript types to include new callbacks (`onDelete`, `onPlay`)
   - Enhanced `getGraphState` to filter out callback functions during serialization
   - Added consistent button styling and hover effects
   - Improved event handling with proper propagation control
   - Added base64 image storage in ReferenceNode for API calls

### 📁 Files Modified
- `components/flow/nodes/SpriteNodeWrapper.tsx` - Added delete and play button support
- `components/SpriteFlowPage.tsx` - Added delete and play handlers, edge detection logic, Gemini API integration
- `components/flow/SpriteFlowCanvas.tsx` - Updated props, improved callback handling
- `components/flow/nodes/PreviewNode.tsx` - Updated size, white background, loading states
- `components/flow/nodes/ReferenceNode.tsx` - Added base64 encoding for API calls
- `lib/flowTypes.ts` - Added new callback types, base64 fields
- `app/api/preview/route.ts` - **NEW** Gemini API integration for image generation
- `package.json` - Added `@google/generative-ai` dependency

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

| Node Type | Handles | Actions Available |
|-----------|---------|-------------------|
| **Reference** | Image upload | Delete |
| **Prompt** | Text input | Delete |
| **Preview** | Sprite preview | Delete, Play (when connected), Regenerate |
| **Animation** | Animation config | Delete |
| **AnimationPreview** | Animation preview | Delete, Regenerate |

### 3. Callback System

All nodes receive callbacks through their `data` prop:
- `onUpdate`: For editable nodes (Reference, Prompt)
- `onDelete`: For all nodes (deletes node and connected edges)
- `onRegenerate`: For preview nodes (Preview, AnimationPreview)
- `onPlay`: For Preview nodes when connected to prompt/reference

**Important**: Callbacks are added in `SpriteFlowPage.tsx` via `nodesWithCallbacks` memo, which depends on `nodes`, `edges`, and handler functions.

### 4. Edge Connection Logic

Preview nodes show play button when:
```typescript
hasIncomingEdges && isConnectedToPromptOrReference
```

This is calculated in `SpriteFlowPage.tsx` by:
1. Finding all edges targeting the preview node
2. Getting source node IDs
3. Checking if any source nodes are type "prompt" or "reference"

---

## 🎨 UI Components

### SpriteNodeWrapper
Shared wrapper component for all nodes providing:
- **Header**: Title, status indicator, action buttons
- **Status Colors**: 
  - Gray (idle), Yellow (generating), Green (ready), Red (error)
- **Action Buttons**:
  - Play (green) - Only for Preview when connected
  - Regenerate (gray) - For preview nodes
  - Delete (red) - All nodes

### Button Behavior
- All action buttons use `e.stopPropagation()` to prevent node selection
- Hover effects with color-coded backgrounds
- Icons from `lucide-react`

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

2. **Reference Node Base64 Encoding** ✅
   - **File**: `components/flow/nodes/ReferenceNode.tsx`
   - **Status**: Implemented
   - Stores both `imageUrl` (for preview) and `imageBase64` (for API)

3. **Preview Generation Flow** ✅
   - **File**: `components/SpriteFlowPage.tsx` - `handleRegenerate`
   - **Status**: Fully implemented
   - Gathers context from connected Prompt/Reference nodes
   - Calls `/api/preview` endpoint
   - Updates node status and displays generated image

### ⚠️ Remaining TODOs

1. **Export Functionality**
   - **File**: `components/SpriteFlowPage.tsx:96`
   - **Current**: Logs graph state to console
   - **Action Needed**: Send graph state to backend API to generate spritesheet and metadata

2. **Animation Generation**
   - **Status**: Not yet implemented
   - **Action Needed**: Similar to preview generation but for animation sequences
   - Can follow the same pattern as preview generation

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
- ✅ Add nodes from palette
- ✅ Connect nodes via drag-and-drop
- ✅ Delete nodes (removes connected edges automatically)
- ✅ Edit prompt text
- ✅ Upload reference images (with base64 encoding for API)
- ✅ Play button appears when Preview connected to Prompt/Reference
- ✅ Regenerate button for preview nodes
- ✅ **AI Image Generation**: Generate 2D pixel art sprites using Gemini API
- ✅ **Context Gathering**: Automatically collects prompt and reference images from connected nodes
- ✅ **Status Management**: Visual feedback during generation (spinner, error states)
- ✅ Node selection and inspector panel
- ✅ Export graph state (logs to console)

### ✅ Backend Integration Status
- ✅ **Image Generation**: Fully integrated with Google Gemini API
- ✅ **Reference Image Upload**: Base64 encoding for API calls
- ✅ **Prompt + Reference Context**: Automatically gathered from connected nodes
- ⚠️ Animation generation API calls (not yet implemented)
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
```

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
  - Error handling

---

## 💡 Tips for Future Agents

1. **Image Generation**:
   - Uses `gemini-2.5-flash-image` model (automatically detected)
   - Model selection happens in `app/api/preview/route.ts`
   - Prompt engineering is critical - see current prompt for 2D sprite style
   - Reference images are sent as base64 `inlineData` parts
   - Generated images are returned as base64 and converted to data URLs

2. **Model Selection**:
   - Code automatically lists available models on each request (for debugging)
   - Prefers `gemini-2.5-flash-image` models (support `generateContent`)
   - Imagen models exist but use `predict` method (different API structure)
   - Check console logs to see which models are available

3. **Prompt Engineering**:
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

4. **Testing node connections**:
   - Preview node needs incoming edge from Prompt or Reference
   - Play button visibility depends on edge connections
   - Use React DevTools to inspect node data

5. **Debugging**:
   - Check `nodesWithCallbacks` memo dependencies
   - Verify callbacks are being passed correctly
   - Check server console for model listing and API errors
   - Use browser console for frontend errors

6. **Performance**:
   - `nodesWithCallbacks` memo prevents unnecessary re-renders
   - Edge detection runs on every nodes/edges change (acceptable for small graphs)
   - Model listing happens on each request (consider caching if needed)

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

---

## 🐛 Known Issues / Future Improvements

1. ✅ **Backend integration** - Image generation fully implemented with Gemini API
2. ✅ **Error handling** - Comprehensive error handling for API failures, quota limits, model not found
3. ✅ **Loading states** - Visual feedback with spinner during generation
4. **No undo/redo** - Node deletion is permanent
5. **No save/load** - Graph state not persisted
6. **Edge validation** - No validation for which nodes can connect to which
7. **Model listing** - Currently lists models on every request (could be cached)
8. **Animation generation** - Not yet implemented (can follow preview pattern)
9. **Prompt refinement** - May need further tuning for better 2D sprite results

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
```

---

**Happy Coding! 🎨**

