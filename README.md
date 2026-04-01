# AWS Cost Optimizer (Monorepo)

A professional AWS infrastructure cost analysis and optimization SaaS dashboard. This project is structured as a monorepo containing a React frontend and a Python AWS Lambda backend.

---

## 📁 Project Structure

```
aws-cost-optimizer/
│
├── frontend/                    # React Application
│   ├── public/                  # Static assets
│   ├── src/                     # Source code
│   ├── .env                     # 🔑 Configuration (AWS & Groq Keys)
│   ├── package.json             # React dependencies
│   └── node_modules/            # Installed packages
│
├── lambda/                      # AWS Lambda Backend
│   └── lambda_function.py       # Python scanning logic
│
├── README.md                    # This file (Root)
└── .gitignore                  # Global ignore rules
```

---

## 🚀 Getting Started

### 1. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Open [http://localhost:3000](http://localhost:3000)

### 2. Backend (Lambda)
The Python code inside the `lambda/` folder is designed to be deployed to AWS Lambda. You can zip the contents of that folder and upload it directly.

---

## ✨ Features

- **Infrastructure Scanner**: Live scan of EC2, EBS, NAT Gateways, EIPs, Snapshots, and Load Balancers.
- **Multi-Region Support**: Scans 13 major AWS regions simultaneously.
- **Cross-Account Scanning**: Scan resources from any account using STS AssumeRole.
- **Groq AI Analysis**: Llama 3.1-powered cost optimization insights.
- **Cost Dashboard**: Real-time spending distribution and savings KPIs.
