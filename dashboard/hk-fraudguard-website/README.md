# HK FraudGuard Website

A professional landing page for the HK FraudGuard project - a RAG-Based Fraud Detection System.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge, class-variance-authority

## 📁 Project Structure

```
hk-fraudguard-website/
├── public/
│   └── images/           # Static images
├── src/
│   ├── app/
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/
│   │   ├── layout/       # Header, Footer
│   │   ├── sections/     # Page sections
│   │   └── ui/           # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── styles/           # Additional styles
│   └── types/            # TypeScript types
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone your repository and add this folder:
```bash
git clone https://github.com/Jendope/Final-Year-Project.git
cd Final-Year-Project
```

2. Copy this `hk-fraudguard-website` folder to your project

3. Install dependencies:
```bash
cd hk-fraudguard-website
npm install
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 📦 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically

### GitHub Pages
1. Run `npm run build`
2. Export static files
3. Deploy to GitHub Pages

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:
- Primary: Teal (#14b8a6)
- Accent: Emerald (#10b981)

### Content
Edit the section components in `src/components/sections/` to update:
- Team members
- Features
- Validation metrics
- etc.

## 📄 License

This project is part of the HK FraudGuard Final Year Project.

## 👥 Team

- Tan James Anthroi (240350922)
- Lin Yueying (240444846)
- Tan Xiuhao (240253372)
