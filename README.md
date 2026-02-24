# MarketEasy

A comprehensive marketing automation platform designed to streamline campaign management, lead generation, and social media coordination across multiple platforms including Instagram and LinkedIn.

## 🚀 Features

- **Campaign Management**: Create, manage, and track marketing campaigns
- **Lead Management**: Dashboard for viewing and organizing leads
- **Pitch Generation**: AI-powered pitch generator for personalized outreach (Pitch Lab)
- **Social Media Integration**: Instagram and LinkedIn campaign coordination
- **Voice Input Support**: Voice-based input capabilities for hands-free operation
- **Real-time Dashboard**: Intuitive dashboard for monitoring campaign performance

## 📋 Project Structure

```
MarketEasy/
├── Backend/                    # Python Flask/FastAPI backend
│   ├── integrated_market_easy.py
│   └── __init__.py
├── marketing-frontend/         # Next.js TypeScript frontend
│   ├── app/                   # Next.js app directory
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── campaigns/     # Campaign management
│   │   │   ├── instagram/     # Instagram integration
│   │   │   ├── leads/         # Lead management
│   │   │   ├── pitch/         # Pitch templates
│   │   │   └── pitch-lab/     # AI Pitch generator
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Reusable React components
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utility functions
├── requirements.txt           # Python dependencies
├── Procfile                   # Deployment configuration
├── render.yaml               # Render deployment config
└── Various Scripts:
    ├── app.py
    ├── main.py
    ├── pitch_generator.py
    ├── linkedin_campaign.py
    └── voice_input.py
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js with TypeScript
- **Styling**: PostCSS & Tailwind CSS
- **Components**: Custom UI component library
- **Package Manager**: npm

### Backend
- **Language**: Python
- **Runtime Support**: Python 3.12+

## 📦 Installation

### Prerequisites
- Node.js (for frontend)
- Python 3.8+ (for backend)
- npm or yarn

### Backend Setup

1. Create and activate virtual environment:
   ```bash
   python -m venv mvenv
   # On Windows:
   mvenv\Scripts\activate
   # On macOS/Linux:
   source mvenv/bin/activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd marketing-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## 🚀 Usage

### Backend
```bash
python Backend/integrated_market_easy.py
# or
python app.py
```

### Frontend
```bash
cd marketing-frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📱 Dashboard Features

- **Campaigns**: Manage marketing campaigns across channels
- **Instagram**: Monitor and create Instagram-specific campaigns
- **LinkedIn**: Coordinate LinkedIn outreach and campaigns
- **Leads**: Track and manage leads from various sources
- **Pitch**: Templates and quick-reference pitches
- **Pitch Lab**: AI-powered pitch generation tool

## 🔧 Configuration

- **Deployment**: Configured for Render (see `render.yaml`)
- **Process Management**: See `Procfile` for process definitions

## 📝 Scripts

- `app.py`: Main application entry point
- `main.py`: Alternative main script
- `pitch_generator.py`: Pitch generation utility
- `linkedin_campaign.py`: LinkedIn campaign management
- `voice_input.py`: Voice input handler

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is proprietary. All rights reserved.

## 📞 Support

For support, please contact the development team.

