# AWS Cost Optimizer 🚀

A SaaS-based cloud cost optimization tool that detects unused AWS resources and suggests cost-saving actions.

## Features
- Detect unused EC2, EBS, Snapshots
- Identify idle Load Balancers & NAT Gateway
- Cross-account AWS access using STS
- Secure External ID authentication
- Cost-saving recommendations

## Tech Stack
- AWS Lambda
- API Gateway
- DynamoDB
- React.js

## How it Works
1. User connects AWS account
2. App assumes IAM Role
3. Scans resources
4. Shows cost optimization suggestions

## Author
Dhruv Patel
