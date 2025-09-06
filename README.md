# Social Bingo

A modern, interactive Social Bingo game platform designed for parties, get-togethers, and social events. Host engaging bingo games with customizable cards and real-time gameplay.

## Overview

This is a "Social Bingo" game meant for parties and get-togethers. By signing in, users can access the host view and create games with custom prompts. Players can join games using invite codes and play in real-time without needing to sign in.

## Key Features

### 🎯 **Game Hosting**
- **Easy Game Creation**: Set up bingo games with custom titles and prompts
- **Flexible Card Sizes**: Choose between 3x3 or 5x5 bingo cards
- **Multiple Input Methods**:
  - Manual prompt entry
  - CSV file import for bulk prompts
  - Random prompt generation from curated lists
- **Invite Code System**: Share games easily with generated invite codes

### 🎮 **Player Experience**
- **No Account Required**: Players join games without signing up
- **Real-time Gameplay**: Live updates as items are called
- **Interactive Cards**: Tap to mark called items
- **Progress Tracking**: Visual feedback on marked items
- **Win Detection**: Automatic bingo detection and celebration

### 🔧 **Host Management**
- **Game Dashboard**: Overview of hosted games
- **Real-time Control**: Call items and manage game flow
- **Player Monitoring**: See all connected players
- **Game Gallery**: Review completed games and results

### 📱 **Mobile Optimized**
- Responsive design works perfectly on all devices
- Touch-friendly interface for mobile gameplay
- Optimized for both portrait and landscape modes

## How It Works

### For Hosts:
1. **Sign In** to access hosting features
2. **Create Game** with custom prompts (manual, CSV, or random)
3. **Share Invite Code** with players
4. **Manage Game** - call items and track progress
5. **View Results** in the game gallery

### For Players:
1. **Join Game** using the invite code (no account needed)
2. **Get Bingo Card** with randomized prompts
3. **Mark Items** as they're called by the host
4. **Win** when you get a bingo pattern!

## CSV Import Format

When importing prompts via CSV, use this format:
```csv
prompt
"Your first prompt here"
"Second prompt"
"Third prompt"
```

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Routing**: React Router DOM
- **State Management**: TanStack Query
- **Build Tool**: Vite

## Database Schema

### Core Tables:
- **games**: Game metadata, host info, and settings
- **bingo_items**: Individual prompts for each game
- **players**: Player information and game participation
- **player_progress**: Real-time tracking of marked items

### Key Features:
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live gameplay
- Automatic invite code generation
- Host-only game management permissions

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Local Development
```bash
# Clone the repository
git clone <your-git-url>
cd <project-name>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
The app uses Supabase for backend services. The configuration is already set up for the hosted environment.

## Deployment

This project is optimized for deployment on Lovable. Simply use the publish feature in the Lovable interface.

For custom deployments:
```bash
# Build for production
npm run build

# Preview build locally
npm run preview
```

## Game Flow

<lov-mermaid>
flowchart TD
    A[Host Signs In] --> B[Create Game]
    B --> C[Add Prompts]
    C --> D[CSV Import]
    C --> E[Manual Entry]
    C --> F[Random Generation]
    D --> G[Generate Invite Code]
    E --> G
    F --> G
    G --> H[Share Code with Players]
    H --> I[Players Join]
    I --> J[Generate Player Cards]
    J --> K[Host Starts Game]
    K --> L[Call Items]
    L --> M[Players Mark Cards]
    M --> N{Bingo?}
    N -->|Yes| O[Winner Celebration]
    N -->|No| L
    O --> P[Game Complete]
    
    style A fill:#e1f5fe
    style O fill:#c8e6c9
    style P fill:#ffecb3
</lov-mermaid>

## Contributing

This project is built with Lovable. To contribute or modify:

1. Use the Lovable editor for real-time development
2. All changes are automatically committed
3. Test changes in the live preview

## Support

For questions or issues:
- Check the [Lovable Documentation](https://docs.lovable.dev/)
- Join the [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)

---

**Built with ❤️ using [Lovable](https://lovable.dev)**