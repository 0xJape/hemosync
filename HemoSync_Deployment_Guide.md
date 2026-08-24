# HemoSync Deployment Guide

## Development
ESP32 -> Local Backend -> PostgreSQL

## Public Access
Cloudflare Tunnel
HTTPS
Protected routes

## Environment Variables
DATABASE_URL
GROQ_API_KEY
MAKE_WEBHOOK_URL
CLOUDFLARE_TUNNEL_TOKEN

## Production Checklist
- HTTPS
- Authentication
- Database backups
- Audit logging
- Secrets management
- Monitoring

## Suggested Stack
Frontend: Next.js + Tailwind
Backend: Node.js
Database: PostgreSQL
AI: Groq
Automation: Make.com
