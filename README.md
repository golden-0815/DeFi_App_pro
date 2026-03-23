# DeFi Dashboard

A modern, responsive DeFi portfolio tracking and analytics platform built with React, TypeScript, and Node.js. Monitor your cryptocurrency investments, analyze performance metrics, and track transactions with real-time Web3 integration.

## ✨ Features

### Portfolio Overview
- Real-time portfolio value tracking with Web3 wallet integration
- Interactive asset allocation charts using Recharts
- Dark/light mode support
- Responsive design using Tailwind CSS
- Smooth animations with Framer Motion

### Performance Analytics
- Historical performance tracking with customizable date ranges
- Interactive charts with zoom and pan capabilities
- Key performance metrics (ROI, Alpha, Sharpe Ratio)
- Benchmark comparison tools

### Transaction History
- Comprehensive transaction logging
- Advanced filtering and sorting
- Status tracking for each transaction
- Pagination and search functionality

### Web3 Integration
- Multiple wallet support (MetaMask, WalletConnect)
- Real-time price feeds
- Secure authentication
- Rate-limited API requests

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Web3 Integration:
  - @web3-react/core
  - @web3-react/injected-connector
  - @web3-react/walletconnect-connector
- UI/UX:
  - Tailwind CSS
  - Framer Motion
  - Headless UI
  - Hero Icons
  - Lucide React
- Data Visualization:
  - Recharts
- State Management & Data Handling:
  - RxJS
  - Axios with rate limiting
  - date-fns

### Backend
- Node.js & Express with TypeScript
- Database & Caching:
  - MongoDB with Mongoose
  - Node-Cache
- Authentication & Security:
  - JWT
  - bcryptjs
  - Express Rate Limit
- Development Tools:
  - Morgan for logging
  - Cross-env for environment management
  - Nodemon for development

## 🚀 Getting Started

### Prerequisites
- Node.js (>=16.0.0)
- MongoDB
- Web3 Provider (MetaMask, WalletConnect)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/defi-dashboard.git
cd defi-dashboard
```

2. Backend Setup
```bash
cd backend
npm install
cp .env.development .env
```

3. Frontend Setup
```bash
cd frontend
npm install
cp .env.development .env
```

### Environment Configuration

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env)
```env
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_WEB3_PROVIDER=your_web3_provider_url
```

### Development

Start Backend:
```bash
cd backend
npm run dev
```

Start Frontend:
```bash
cd frontend
npm start
```

### Production Build

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
```

## 🔧 Available Scripts

### Backend
- `npm run dev`: Start development server with hot-reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run type-check`: Check TypeScript types
- `npm run lint`: Run ESLint
- `npm run clean`: Clean build directory

### Frontend
- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Web3-React](https://github.com/NoahZinsmeister/web3-react)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [Framer Motion](https://www.framer.com/motion/)

---