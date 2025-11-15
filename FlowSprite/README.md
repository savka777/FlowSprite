# SpriteFlow

A node-based editor for creating AI-generated 2D sprites and animations using React Flow.

## Features

- **Node-based Editor**: Visual workflow builder using React Flow
- **Node Types**:
  - Reference Node: Upload reference images
  - Prompt Node: Text input for character descriptions
  - Preview Node: Single-image sprite preview with regeneration
  - Animation Nodes: Generate idle, walk, run, and jump animations
  - Animation Preview Node: Preview animations with timeline
- **Fullscreen Layout**: 
  - Left sidebar: Node palette
  - Center: React Flow canvas
  - Right sidebar: Inspector panel for selected nodes
  - Top bar: Export functionality

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Flow** (v11)
- **lucide-react** (Icons)

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── SpriteFlowPage.tsx  # Main page component
│   └── flow/
│       ├── SpriteFlowCanvas.tsx  # React Flow canvas wrapper
│       └── nodes/
│           ├── SpriteNodeWrapper.tsx    # Shared node styling
│           ├── ReferenceNode.tsx
│           ├── PromptNode.tsx
│           ├── PreviewNode.tsx
│           ├── AnimationNode.tsx
│           └── AnimationPreviewNode.tsx
└── lib/
    └── flowTypes.ts        # TypeScript type definitions
```

## TODO / Backend Integration Points

The following areas are marked with `TODO` comments and need backend integration:

1. **ReferenceNode** (`components/flow/nodes/ReferenceNode.tsx`):
   - Image upload to backend
   - Replace `URL.createObjectURL` with backend image URL

2. **Export Button** (`components/SpriteFlowPage.tsx`):
   - Replace `console.log` with API call to backend
   - Backend should generate spritesheet and metadata

3. **Regenerate Callbacks** (`components/SpriteFlowPage.tsx`):
   - Call backend API to regenerate sprites/animations
   - Update node status based on API response

## Usage

1. **Add Nodes**: Click buttons in the left sidebar to add nodes to the canvas
2. **Connect Nodes**: Drag from node handles to create connections
3. **Edit Nodes**: 
   - Click on nodes to select them (shows in inspector)
   - Edit prompt text directly in PromptNode
   - Upload images in ReferenceNode
4. **Export**: Click the "Export" button in the top-right to export the current graph (currently logs to console)

## License

MIT

