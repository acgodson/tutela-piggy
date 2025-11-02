# 🐷 Tutela - AI-Powered Livestock Health Monitoring

**Early Disease Detection for Pigs** - Monitor your animals' health 24/7 with thermal imaging, AI, and blockchain-verified alerts.

Tutela combines smart thermal cameras, AI-vision analysis, and a farmer-friendly interface to spot early signs of illness or farm anomalies automatically. Built for African farmers with immutable verification on Hedera Hashgraph.

## Problem

- Livestock disease costs farmers billions each year
- In Nigeria alone, livestock disease losses reach **$2.5 billion annually**
- Outbreaks can wipe out **30–60% of a herd** within days
- Farmers often don't spot sick animals until outbreaks are widespread

## Solution

Tutela uses **YOLOv8 object detection** and **ByteTrack tracking** to monitor pigs in real-time, detecting:
- Count mismatches (missing or extra animals)
- Inactivity patterns (possible illness)
- Movement anomalies

All alerts are **blockchain-verified** on Hedera Hashgraph for transparency, insurance claims, and regulatory compliance.

## Architecture

### Demo Flow
```
Frontend (Next.js)
  ↓ sends frame + expected_pig_count
Next.js API Route (/api/detect)
  ↓ forwards frame
Python Backend (EC2) → YOLO + Tracking
  ↓ returns detections
Next.js API Route
  ↓ analyzes alerts + logs to Hedera
Hedera HCS (blockchain logging)
  ↓ returns receipts
Frontend (displays detections + alerts)
```

### Project Structure

| Layer | File | Purpose |
|-------|------|---------|
| **API Routes** | `app/api/detect/route.ts` | Request orchestration & service composition |
| **Services** | `services/hedera.service.ts` | Hedera blockchain operations & HCS logging |
| | `services/alert-detection.service.ts` | Alert detection logic & position tracking |
| | `services/backend.service.ts` | Python backend communication |
| **Hooks** | `hooks/useVideoStream.ts` | Video streaming & camera management |
| | `hooks/useDetection.ts` | AI detection processing loop |
| | `hooks/useModals.ts` | Modal state management |
| | `hooks/useEmbed.ts` | Embed code generation utilities |
| **Components** | `components/EmbedModal.tsx` | Share & embed modal UI |
| | `components/AlertsPanel.tsx` | Alerts history panel |
| | `components/VideoPlayer.tsx` | Video display with overlays |
| | `components/DetectionSidebar.tsx` | Detection info sidebar |
| **Main** | `LivePigDetection.tsx` | Main orchestration component |

## 📊 Alert Systems

### Motion Alerts

| Alert Type           | Trigger                        | Severity | Detection Method                                                     | Status            |
| -------------------- | ------------------------------ | -------- | -------------------------------------------------------------------- | ----------------- |
| **Count Mismatch**   | Detected pigs ≠ Expected count | `HIGH`   | Frame analysis comparing detection count vs. user-set expected value | ✅ **Implemented** |
| **Inactivity Alert** | <50px movement in 15 seconds   | `MEDIUM` | Position tracking across frames, calculates Euclidean distance       | ✅ **Implemented** |

### Advanced Alerts (Requires Additional Hardware)

| Alert Type            | Trigger                               | Required Hardware          | Detection Method                   | Status       |
| --------------------- | ------------------------------------- | -------------------------- | ---------------------------------- | ------------ |
| **Thermal Anomaly**   | Body temperature >38.5°C or <37°C     | Thermal imaging camera     | Thermal sensor data analysis       | ✅ **Implemented** |
| **Abnormal Behavior** | Aggressive/isolated behavior patterns | Camera + AI behavior model | Movement pattern ML classification | 🔜 **Future** |

*🎥 [Watch Demo: Tutela thermal Hardware Capturing and Sending Alerts to Hedera](https://vimeo.com/1040586569)*

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- Python 3.9+ (for backend)
- Hedera account ([portal.hedera.com](https://portal.hedera.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tutela-piggy/tutela-piggy.git
   cd tutela-piggy
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py  # Runs on port 8002
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   pnpm install
   cp .env.example .env.local
   # Edit .env.local with your values
   pnpm dev  # Runs on port 3000
   ```

4. **Configure Environment Variables**
   
   Copy `frontend/.env.example` to `frontend/.env.local` and fill in:
   
   ```env
   # Backend API
   NEXT_PUBLIC_API_ENDPOINT=http://localhost:8002
   API_ENDPOINT=http://localhost:8002
   
   # Hedera Blockchain (Get from portal.hedera.com)
   HEDERA_ACCOUNT_ID=0.0.xxxxxxx
   HEDERA_PRIVATE_KEY=302e0201...
   HEDERA_TOPIC_ID=0.0.xxxxxxx
   NEXT_PUBLIC_HEDERA_TOPIC_ID=0.0.xxxxxxx
   
   # Farm Configuration
   NEXT_PUBLIC_FARM_ID=TUTELA-DEMO-001
   FARM_ID=TUTELA-DEMO-001
   ```

5. **Start Detection**
   - Navigate to `http://localhost:3000/pig-detection`
   - Set expected pig count
   - Start camera or upload video
   - Alerts will appear in real-time and be logged to Hedera

## 🔗 Verify on Blockchain

All alerts are logged to Hedera Hashgraph. View them on:
- **Hashscan**: `https://hashscan.io/testnet/topic/{HEDERA_TOPIC_ID}`
- Receipts include: timestamp, alert type, pig ID, severity, and action recommendations


## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI/ML**: YOLOv8 (object detection), ByteTrack (tracking)
- **Backend**: Python (FastAPI), PyTorch
- **Blockchain**: Hedera Hashgraph (HCS - Hashgraph Consensus Service)
- **Deployment**: Vercel (frontend), EC2 (backend)

### Hedera Hack Africa 2024

**Category**: Agriculture / Health Monitoring  
**Blockchain Integration**: Hedera Hashgraph Consensus Service (HCS)

#### 🔗 Links

- **Pitch Deck**: [View Pitch Deck](./assets/Tutela-DECK-Summer25.pdf)  
- **Certification/Learning**: [View Certificate](./assets/c0c6cb07-7411-4c5c-a8e1-72885502b6db.pdf)
- **🪶 Live Hedera HashScan Feed**: [Tutela Alert Topic — HashScan Testnet](https://hashscan.io/testnet/topic/0.0.7174333)

## 🤝 Contributing

We welcome contributions! Please open an issue or submit a pull request.

## 📧 Contact

- **Website**: [tutela-piggy.vercel.app](https://tutela-piggy.vercel.app)
- **GitHub**: [github.com/tutela-piggy](https://github.com/tutela-piggy)
- **Demo**: [View Demo](https://tutela-piggy.vercel.app/pig-detection)

---

**Built with ❤️ for African farmers**