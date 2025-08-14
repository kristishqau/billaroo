# Billaroo

**Freelancer-Style SaaS Client Portal**  
Stack: **React + TypeScript** (client), **.NET Core API** (server), **PostgreSQL**.

## What is Billaroo?
Billaroo helps freelancers manage **clients, invoices, files, payments (Stripe mock), and real-time messaging** with role-based access.

### Current status (Aug 2025)
- ✅ Auth: registration, login, forgot/reset password
- ✅ Roles: freelancer vs client
- 🚧 Invoices, SMTP email, S3/Firebase uploads, Stripe mock, SignalR messaging

## Monorepo Layout
/client - React + TS frontend
/server - .NET Core API
/docs - (optional) architecture & ADRs

## Quick Start

### Requirements
- Node 18+ and PNPM/Yarn/NPM
- .NET 8 SDK
- PostgreSQL 14+

### 1) Environment
Create the following environment files:
**`client/.env`**
```bash
VITE_API_URL=http://localhost:5000
```
**server/appsettings.Development.json**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=billaroo;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Issuer": "Billaroo",
    "Audience": "Billaroo",
    "Key": "CHANGE_ME_DEV_ONLY"
  },
  "Smtp": {
    "Host": "smtp.example.com",
    "Port": 587,
    "User": "user",
    "Pass": "pass",
    "From": "no-reply@billaroo.app"
  }
}
```

### 2) Run client
```bash
cd client
npm install
npm run dev
```

### 3) Run server
```bash
cd server
dotnet restore
dotnet ef database update
dotnet run
```

### 4) URLs
- Client: http://localhost:5173 (Vite default)
- API: http://localhost:5000 (Kestrel example)

### License
- Apache License 2.0
