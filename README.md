# ASOSTORE - College Prepaid Wallet System

A modern, secure prepaid wallet system designed specifically for college students. Students can check their balances, view transaction history, and administrators can manage accounts and transactions.

## Features

### For Students
- **Balance Checking**: Quick balance lookup using class code and admission number
- **Transaction History**: View complete purchase and credit history
- **Class-Based Access**: Secure access with class-specific codes (S1, S2, D1, D3)
- **Real-time Updates**: Live balance and transaction updates

### For Administrators
- **Student Management**: Add, edit, and delete student accounts
- **CSV Import**: Bulk import students with downloadable template
- **Transaction Management**: Add credits/debits with detailed reasons
- **Search & Filter**: Find students quickly by name, admission number, or class
- **Real-time Dashboard**: Monitor all transactions and balances

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ 
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd asostore
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
The database schema will be automatically created when you connect to Supabase. The migrations include:
- Students table with admission numbers, names, classes, and balances
- Transactions table with detailed transaction history
- Sample data for testing

5. Start the development server:
```bash
npm run dev
```

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

The project includes a `vercel.json` configuration for proper SPA routing.

## Database Schema

### Students Table
- `id`: UUID primary key
- `admission_number`: Unique student identifier
- `name`: Student's full name
- `class`: Student's class (Class 1-4)
- `balance`: Current wallet balance
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp

### Transactions Table
- `id`: UUID primary key
- `student_id`: Reference to student
- `amount`: Transaction amount (positive for credits, negative for debits)
- `type`: 'credit' or 'debit'
- `reason`: Description of the transaction
- `admin_id`: ID of admin who created the transaction
- `created_at`: Transaction timestamp

## Usage

### Student Access
1. Go to the homepage
2. Click "Check Your Balance"
3. Enter your admission number
4. View balance and transaction history

### Admin Access
1. Click "Admin Panel" button (bottom right on homepage)
2. Sign in with admin credentials
3. Manage students and transactions

### Sample Data
The system supports 4 classes with specific access codes:
- **S1** (Code: S1001): First year students
- **S2** (Code: S2002): Second year students  
- **D1** (Code: D1003): Diploma first year
- **D3** (Code: D3004): Diploma third year

### CSV Import Format
The CSV import feature accepts files with the following format:
```csv
name,admission_number,class,balance
John Doe,ADM001,S1,1000
Jane Smith,ADM002,S2,1500
Mike Johnson,ADM003,D1,2000
Sarah Wilson,ADM004,D3,500
```

## Security Features

- Row Level Security (RLS) enabled on all tables
- Secure authentication for admin functions
- Input validation and sanitization
- HTTPS enforcement in production
- XSS and CSRF protection headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For technical support or questions about the system, contact your system administrator.