# Kurl - Personal Fitness Tracker

A polished, elegant web-based fitness tracking application designed for personal use. Track workouts, monitor progress, set goals, and maintain wellness metrics all in one comprehensive dashboard.

## 🎯 Features

### Core Fitness Tracking
- **Workout Planning**: Create custom routines with 200+ exercises categorized by muscle group and equipment
- **Workout Logging**: Real-time session tracking with sets, reps, weight, and duration
- **Progress Dashboard**: Visual analytics with charts for strength gains, volume trends, and personal records
- **Goal Management**: Set and track fitness objectives with progress indicators
- **Wellness Tracking**: Log sleep quality, water intake, daily energy, and mood

### Analytics & Insights
- **Strength Progression Charts**: Track max lifts over time
- **Volume Trend Analysis**: Monitor total reps × weight progression
- **Personal Records (PRs)**: Automatic tracking of your best lifts
- **Body Metrics**: Track weight and measurements over time
- **Exercise Distribution**: Visualize muscle group focus breakdown

### Gamification
- **Achievement Badges**: Unlock badges for fitness milestones
- **Streak Tracking**: Monitor workout consistency with daily streaks
- **Milestone Indicators**: Visual progress toward fitness goals

### User Experience
- **Responsive Dashboard**: Elegant sidebar navigation optimized for personal use
- **Dark/Light Theme Support**: Choose your preferred interface theme
- **Real-time Data**: Live session tracking with instant updates
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express.js + tRPC 11
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: OAuth
- **Charts**: Recharts for data visualization
- **Styling**: Tailwind CSS with custom design tokens

## 📋 Database Schema

The application uses 14 tables to manage all fitness data:

- `users` - User authentication and profiles
- `userProfiles` - Age, weight, height, fitness goals
- `exercises` - Exercise library (200+ exercises)
- `workoutRoutines` - Custom workout routines
- `workoutSessions` - Logged workout sessions
- `sessionExercises` - Exercises within each session
- `fitnessGoals` - User fitness objectives
- `bodyMetrics` - Weight and measurement tracking
- `wellnessLogs` - Sleep, water, mood, energy logs
- `achievements` - Badge definitions
- `userAchievements` - Earned badges
- `streaks` - Workout consistency tracking
- `scheduledWorkouts` - Planned workouts
- `notifications` - Notification logs

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- pnpm package manager
- MySQL/TiDB database

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
# Create a .env file with your database connection and OAuth credentials

# Run database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Development

```bash
# Run in development mode with hot reload
pnpm dev

# Type checking
pnpm check

# Run tests
pnpm test

# Format code
pnpm format
```

## 📱 Pages & Features

### Dashboard
Main landing page with key metrics:
- Workouts this week
- Active goals count
- Current streak
- Achievements earned
- Volume trend chart
- Strength progress chart

### Workout Logger
Real-time workout session tracking:
- Session name and focus area
- Mood and energy level logging
- Exercise addition and tracking
- Rest timer between sets
- Workout notes

### Workout Planner
Create and schedule routines:
- Custom routine creation
- Exercise selection from library
- Schedule workouts on calendar
- View upcoming workouts

### Progress Analytics
Detailed fitness insights:
- Weight trend visualization
- Volume progression charts
- Exercise distribution breakdown
- Personal records display
- Time period comparisons

### Goals Management
Set and track fitness objectives:
- Create goals (weight loss, muscle gain, strength, etc.)
- Set targets and timelines
- Track progress with visual indicators
- View completed goals

### Wellness Tracking
Monitor overall health:
- Sleep duration and quality
- Water intake logging
- Daily energy levels (1-10)
- Mood tracking
- Recent wellness logs

### Achievements
Gamification and milestones:
- Achievement badges
- Streak tracking
- Progress percentage
- Unlocked badges display

## 🔐 Authentication

The application uses OAuth for secure authentication. Users can:
- Sign in with their account
- Maintain session across devices
- Access role-based features (user/admin)
- Logout securely

## 📊 API Endpoints

All backend operations use tRPC procedures:

```
/api/trpc/auth.* - Authentication
/api/trpc/profile.* - User profile management
/api/trpc/exercises.* - Exercise library
/api/trpc/routines.* - Workout routines
/api/trpc/sessions.* - Workout sessions
/api/trpc/goals.* - Fitness goals
/api/trpc/bodyMetrics.* - Body metrics
/api/trpc/wellness.* - Wellness logs
/api/trpc/achievements.* - Achievements
/api/trpc/streaks.* - Streak tracking
```

## 🎨 Design

The application features:
- **Color Scheme**: Professional green accent (OKLCH 0.623 0.214 142.5)
- **Typography**: Clean, modern sans-serif fonts
- **Spacing**: Consistent 4px grid system
- **Components**: Reusable UI components
- **Animations**: Smooth transitions and micro-interactions

## 📈 Performance

- Optimized bundle size with code-splitting
- Lazy-loaded components
- Efficient database queries
- Caching strategies
- Mobile-first responsive design

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/auth.logout.test.ts

# Watch mode
pnpm test --watch
```

## 🤝 Contributing

This is a personal fitness tracker application. For improvements or bug reports, please open an issue or submit a pull request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Tailwind CSS
- Data visualization powered by Recharts
- UI components from community libraries
- Database ORM by Drizzle
- Authentication via OAuth

## 📞 Support

For issues, questions, or suggestions, please visit the [GitHub Issues](https://github.com/sat-yam09/Kurl/issues) page.

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Status**: Active Development
