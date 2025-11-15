# Agent Guide - SpriteFlow Project

> **Last Updated**: December 2024  
> **Project Status**: Frontend Complete - Backend Integration Pending

## 🎯 Project Overview

**SpriteFlow** is a node-based visual editor for creating AI-generated 2D sprites and animations. Built with Next.js 14, React Flow, and TypeScript, it provides an intuitive drag-and-drop interface for building sprite generation workflows.

### Key Features
- **Node-based Editor**: Visual workflow builder using React Flow
- **5 Node Types**: Reference, Prompt, Preview, Animation, AnimationPreview
- **Fullscreen Layout**: Left sidebar (palette), center canvas, right sidebar (inspector)
- **Node Management**: Add, delete, connect, and configure nodes
- **Preview System**: Generate and regenerate sprites with play button when connected

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

3. **Code Improvements**
   - Updated TypeScript types to include new callbacks (`onDelete`, `onPlay`)
   - Enhanced `getGraphState` to filter out callback functions during serialization
   - Added consistent button styling and hover effects
   - Improved event handling with proper propagation control

### 📁 Files Modified
- `components/flow/nodes/SpriteNodeWrapper.tsx` - Added delete and play button support
- `components/SpriteFlowPage.tsx` - Added delete and play handlers, edge detection logic
- `components/flow/SpriteFlowCanvas.tsx` - Updated props, improved callback handling
- `lib/flowTypes.ts` - Added new callback types
- All node components - Added delete button support

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

## 🔌 Backend Integration Points (TODOs)

### 1. Reference Node Image Upload
**File**: `components/flow/nodes/ReferenceNode.tsx:14`
```typescript
// TODO: Upload to backend and get imageUrl
const imageUrl = URL.createObjectURL(file);
```
**Action Needed**: Replace with API call to upload image and receive backend URL

### 2. Export Functionality
**File**: `components/SpriteFlowPage.tsx:96`
```typescript
// TODO: Replace with API call to backend
console.log("Exporting graph:", JSON.stringify(graphState, null, 2));
```
**Action Needed**: Send graph state to backend API to generate spritesheet and metadata

### 3. Regenerate Callback
**File**: `components/SpriteFlowPage.tsx:101`
```typescript
// TODO: Call backend API to regenerate sprite/animation
```
**Action Needed**: 
- Call backend API with node ID and context
- Update node status based on API response
- Set `imageUrl` when generation completes

### 4. Play/Generate Preview
**File**: `components/SpriteFlowPage.tsx:136`
```typescript
// TODO: Call backend API to generate preview
```
**Action Needed**:
- Collect connected prompt/reference data
- Send to backend API for sprite generation
- Update preview node with generated image URL
- Handle status updates (generating → ready/error)

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
- ✅ Upload reference images (local preview)
- ✅ Play button appears when Preview connected to Prompt/Reference
- ✅ Regenerate button for preview nodes
- ✅ Node selection and inspector panel
- ✅ Export graph state (logs to console)

### ⚠️ Frontend Only (Backend Needed)
- ⚠️ Image upload to backend
- ⚠️ Sprite generation API calls
- ⚠️ Animation generation API calls
- ⚠️ Export functionality (backend processing)

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

### Setup
```bash
npm install
npm run dev
```

### Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

### Development Workflow
1. Make changes to components
2. Hot reload will update automatically
3. Check browser console for any errors
4. Test node interactions (add, delete, connect)
5. Verify play button appears when Preview connected

---

## 🔍 Important Files Reference

### Core Files
- **`components/SpriteFlowPage.tsx`**: Main state management, handlers, node/edge logic
- **`components/flow/SpriteFlowCanvas.tsx`**: React Flow wrapper, node type registration
- **`lib/flowTypes.ts`**: All TypeScript type definitions
- **`components/flow/nodes/SpriteNodeWrapper.tsx`**: Shared UI wrapper for all nodes

### Node Components
- **`ReferenceNode.tsx`**: Image upload (TODO: backend integration)
- **`PromptNode.tsx`**: Text input with `onUpdate` callback
- **`PreviewNode.tsx`**: Preview with play/regenerate/delete buttons
- **`AnimationNode.tsx`**: Animation configuration
- **`AnimationPreviewNode.tsx`**: Animation preview with regenerate

---

## 💡 Tips for Future Agents

1. **When adding backend integration**:
   - Start with Reference node upload (simplest)
   - Then Preview generation (most important)
   - Finally Export functionality

2. **Testing node connections**:
   - Preview node needs incoming edge from Prompt or Reference
   - Play button visibility depends on edge connections
   - Use React DevTools to inspect node data

3. **Debugging**:
   - Check `nodesWithCallbacks` memo dependencies
   - Verify callbacks are being passed correctly
   - Use console.log in handlers to trace execution

4. **Performance**:
   - `nodesWithCallbacks` memo prevents unnecessary re-renders
   - Edge detection runs on every nodes/edges change (acceptable for small graphs)

5. **Type Safety**:
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

---

## 🐛 Known Issues / Future Improvements

1. **No backend integration** - All API calls are stubbed
2. **No error handling** - API failures not handled
3. **No loading states** - Status changes but no visual feedback during generation
4. **No undo/redo** - Node deletion is permanent
5. **No save/load** - Graph state not persisted
6. **Edge validation** - No validation for which nodes can connect to which

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

---

**Happy Coding! 🎨**

