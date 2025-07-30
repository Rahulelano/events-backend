# Coimbatore Events - Event Management System

A comprehensive event management website for Coimbatore-based events with both user interface and admin panel, built with React, Node.js, Express, and MySQL.

## 🚀 Features

### Frontend (User Website)
- **Homepage**: Featured, trending, and upcoming events
- **Event Listings**: Category filtering, search, and modern card design
- **Event Detail Pages**: Full information with booking system
- **Booking System**: Real-time ticket booking with availability tracking
- **Booking Status**: Check booking details with reference number
- **Responsive Design**: Optimized for all devices

### Admin Panel
- **Secure Login**: JWT-based authentication
- **Dashboard**: Statistics and analytics
- **Event Management**: Create, edit, delete events with priority and flags
- **Category Management**: Manage event categories
- **Booking Management**: View and manage all bookings
- **Real-time Updates**: Live ticket availability tracking

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, JWT Authentication
- **Database**: MySQL with connection pooling
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Yup validation

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd coimbatore-events
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
1. Create MySQL database:
```sql
CREATE DATABASE booking;
```

2. Import the database schema:
```bash
mysql -u root -p booking < server/database.sql
```

### 4. Environment Configuration
Update the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=r1a2h
DB_NAME=booking
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key_here_change_in_production
ADMIN_EMAIL=admin@coimbatoreevents.com
ADMIN_PASSWORD=admin123
```

### 5. Start the Application

#### Development Mode (Recommended)
```bash
# Start both frontend and backend
npm run dev:full
```

#### Separate Processes
```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend development server
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Admin Panel**: http://localhost:5173/admin

## 🔑 Default Admin Credentials

- **Email**: admin@coimbatoreevents.com
- **Password**: admin123

**⚠️ Important**: Change these credentials in production!

## 📊 Database Schema

### Tables
- **events**: Event information with categorization and flags
- **categories**: Event categories with colors
- **bookings**: User bookings with ticket tracking
- **admin_users**: Admin authentication

### Key Features
- Row Level Security (RLS) where applicable
- Foreign key constraints for data integrity
- Indexes for optimized queries
- Default sample data included

## 🎨 Design Features

- **Modern UI**: Clean, professional design with subtle animations
- **Responsive**: Mobile-first design with proper breakpoints
- **Color System**: Comprehensive color palette with proper contrast
- **Micro-interactions**: Hover effects and smooth transitions
- **Accessibility**: Proper ARIA labels and semantic HTML

## 📡 API Endpoints

### Public Endpoints
- `GET /api/events` - Get all events with filtering
- `GET /api/events/:id` - Get single event
- `GET /api/categories` - Get all categories
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/reference/:ref` - Get booking by reference

### Admin Endpoints (Requires Authentication)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/bookings` - Get all bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking

## 🚀 Production Deployment

### 1. Build Frontend
```bash
npm run build
```

### 2. Environment Variables
Update production environment variables:
- Use strong JWT secret
- Configure production database
- Set proper CORS origins

### 3. Database Security
- Create dedicated database user with limited privileges
- Enable SSL connections
- Regular backups

### 4. Server Configuration
- Use process manager (PM2)
- Configure reverse proxy (Nginx)
- Enable HTTPS
- Set up monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email info@coimbatoreevents.com or create an issue in the repository.

## 🙏 Acknowledgments

- Sample images from Pexels
- Icons from Lucide React
- Built with React and Node.js ecosystem
- Designed for the Coimbatore community

---

**Made with ❤️ for Coimbatore Events**

### Why you see "Cannot GET"
- The `/api/admin/login` endpoint is defined as a **POST** route in your backend:
  ```js
  router.post('/login', async (req, res) => { ... });
  ```
- If you visit `http://localhost:3001/api/admin/login` in your browser, your browser sends a **GET** request, but only POST is supported, so Express returns "Cannot GET /api/admin/login".

### This is **not** an error if:
- You are seeing this only when visiting the URL directly in your browser.
- Your frontend is making a POST request to `/api/admin/login` for login.

### What to do:
- **Do not** visit `/api/admin/login` directly in your browser.
- Use your frontend login form to POST credentials to this endpoint.

---

### If you are still getting 401 on login:
- Please provide the backend logs from the terminal after a login attempt (with the debug lines we added).
- Double-check your admin user in the database matches the credentials you are entering.

---

**Summary:**  
"Cannot GET" is normal if you visit a POST-only API route in your browser.  
Focus on the login flow from your frontend and backend logs for further debugging.

If you still have issues logging in, please provide the backend log output after a login attempt!