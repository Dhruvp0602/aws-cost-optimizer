# AWS Cost Optimizer

A real-time AWS infrastructure cost analysis and optimization SaaS dashboard built with React and the AWS SDK.

---

## 📁 Project Structure

```
aws-cost-optimizer/
│
├── public/                     # Static assets served by React
│   ├── index.html              # App shell (title, meta tags)
│   └── logo.png                # App logo
│
├── src/                        # React application source
│   │
│   ├── context/                # ─── Global State ───────────────────
│   │   └── AccountContext.js   # Shared AWS account ARN (cross-page sync)
│   │
│   ├── services/               # ─── AWS Integration Layer ──────────
│   │   └── awsClient.js        # EC2, EBS, NAT, STS, ELB scanners
│   │
│   ├── pages/                  # ─── Full-Page Views ────────────────
│   │   ├── Login.js / .css         # Auth entry screen
│   │   ├── Dashboard.js / .css     # Infrastructure Scanner (main)
│   │   ├── CostDashboard.js / .css # Real-time cost charts & KPIs
│   │   ├── AIRecommendations.js / .css  # Groq AI cost insights
│   │   ├── AutoCleanup.js / .css   # Idle resource suggestions
│   │   ├── Alerts.js / .css        # Cost alert rules
│   │   └── ConnectAWS.js / .css    # AWS connection helper
│   │
│   ├── App.js                  # Root router & sidebar navigation
│   ├── App.css                 # Global layout styles
│   ├── index.js                # React DOM entry point
│   └── index.css               # Base CSS reset
│
├── .env                        # 🔑 AWS credentials (gitignored)
├── package.json                # Dependencies & scripts
└── README.md                   # This file
```

---

## 🔑 Environment Variables (`.env`)

```env
REACT_APP_AWS_ACCESS_KEY_ID=your_iam_user_access_key
REACT_APP_AWS_SECRET_ACCESS_KEY=your_iam_user_secret_key
REACT_APP_AWS_REGION=ap-south-1
REACT_APP_AWS_ROLE_ARN=                         # Leave blank for own account
REACT_APP_GROQ_API_KEY=your_groq_api_key
```

> ⚠️ Use **IAM User** credentials, NOT root account credentials. Root accounts cannot assume roles.

---

## 🚀 Getting Started

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Infrastructure Scanner** | Live scan of EC2, EBS, NAT Gateways, EIPs, Snapshots, LBs |
| **Cross-Account Scanning** | Enter any Account ID + Role Name to scan a friend's account |
| **Real-Time Cost Center** | Live cost distribution charts based on actual resource counts |
| **AI Insights (Groq)** | Llama 3.1-powered cost-saving recommendations |
| **Auto Cleanup** | Identifies idle/orphaned resources worth removing |
| **Cost Alerts** | Configurable spend threshold alerts |
