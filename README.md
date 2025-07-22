# Divix

A expense-sharing app built with React Native, TypeScript, and Supabase.

## Features

- 🔐 User authentication with Supabase Auth
- 💰 Create and manage expenses
- 👥 Split expenses with friends
- 📱 Cross-platform (iOS, Android, Web)
- 💾 Real-time data sync with Supabase

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd divix
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Fill in your Supabase project URL and anonymous key in the `.env` file.

4. Set up Supabase (for local development):
```bash
npx supabase start
```

5. Generate TypeScript types from your Supabase schema:
```bash
npx supabase gen types typescript --linked --schema public > types/db.ts
```

6. Start the development server:
```bash
npx expo start
```

### Database Schema

The app expects the following Supabase tables:

- `users` - User profiles
- `groups` - Expense groups
- `group_members` - Group membership
- `expenses` - Individual expenses
- `payments` - Settlement payments

### Edge Functions

The app uses Supabase Edge Functions for complex calculations:

- `group-debts` - Calculate group debt summaries and balances

## Development

### Project Structure

```
├── components/         # Reusable UI components
├── hooks/             # Custom React hooks
├── lib/               # Utilities and singletons
├── navigation/        # Navigation configuration
├── screens/           # Screen components
├── services/          # API service layers
└── types/             # TypeScript type definitions
```

### Adding New Features

1. Create service functions in `services/` for data operations
2. Create screens in `screens/` for new UI flows
3. Add navigation routes in `navigation/AppNavigator.tsx`
4. Update types in `types/db.ts` as needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 