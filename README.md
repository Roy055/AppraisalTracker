# Employee Performance Appraisal Tracker

A comprehensive web application for managing employee performance appraisals, goals, and training recommendations. This system streamlines the performance review process for organizations, supporting different roles and workflows.

## 📋 Features

### User Management & Authentication

- Secure JWT authentication
- Role-based access control (Admin, HR, Project Manager, Developer)
- User profiles with information management

### Appraisal Management

- Complete appraisal lifecycle management
- Multi-stage review workflow (self-review → PM review → HR review → Final score)
- Performance ratings and feedback collection
- History tracking for all appraisals

### Goals Tracking

- Create and assign goals to employees
- Track goal progress and completion status
- Separate goals management independent from appraisals

### Training Management

- Assign training recommendations based on appraisal outcomes
- Track training status (pending, approved, completed, rejected)
- Training progress monitoring

### Department Management

- Organize employees by departments
- Assign department managers
- Track department-specific metrics

### Dashboard & Analytics

- Role-specific dashboards with relevant metrics
- Visual representation of key performance indicators
- Quick access to important information

## 🛠️ Tech Stack

### Frontend

- **React** with Vite for fast development and building
- **Material UI** components for modern interface
- **React Router** for client-side routing
- **Axios** for API communication

### Backend

- **Node.js** runtime environment
- **Express.js** for API development
- **MongoDB** with Mongoose for database operations
- **JWT** for secure authentication
- **Bcrypt** for password hashing

## 🏗️ Architecture

### Client Structure

- **Components**: Reusable UI elements
- **Pages**: Main application views
- **Context**: State management with React Context API
- **Assets**: Static resources

### Server Structure

- **Controllers**: Business logic handlers
- **Models**: Database schemas
- **Routes**: API endpoint definitions
- **Middleware**: Request processing functions
- **Scripts**: Utility scripts for administration

## 📂 Key Models

- **User**: Core user information and authentication
- **Appraisal**: Main appraisal cycle information
- **Review**: Detailed performance review data
- **Feedback**: Qualitative feedback for employees
- **Goal**: Employee goals and objectives
- **TrainingRecommendation**: Recommended training for employees
- **Department**: Organizational structure management

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/appraisal-tracker.git
   cd appraisal-tracker
   ```

2. **Set up the backend**:

   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the server directory with:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/appraisal-tracker
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   ```

4. **Set up the frontend**:
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the backend server**:

   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend development server**:

   ```bash
   cd client
   npm run dev
   ```

3. **Access the application** at `http://localhost:5173`

### Creating an Admin Account

To create the initial admin account:

```bash
cd server
npm run create-admin
```

This script will create an admin user with the credentials specified in your environment.

## 📱 Application Workflow

1. **Authentication**: Users log in with their credentials based on their role
2. **Dashboard**: Users are presented with a role-specific dashboard
3. **Appraisal Cycle**:

   - HR or Admin initiates a new appraisal cycle
   - Employees complete self-reviews
   - Managers provide feedback and ratings
   - HR finalizes the appraisal and suggests training

4. **Goals Management**:

   - HR or Managers create goals for employees
   - Employees update progress on their goals
   - Managers monitor goal completion

5. **Training Management**:
   - HR assigns training based on appraisal outcomes
   - Employees mark trainings as completed
   - Managers monitor training progress

## 🔒 Role-Based Access Control

### Admin

- Complete system access
- User and department management
- System configuration

### HR

- Appraisal cycle management
- Training recommendations
- Performance review finalization
- User management (except Admin)

### Project Manager

- Team performance monitoring
- Providing feedback and reviews
- Goal assignment and tracking
- Training monitoring

### Developer (Employee)

- Self-review submission
- Goal progress updates
- Training completion
- Personal performance history

## 🛣️ Roadmap

- **Reporting Module**: Advanced reporting capabilities
- **Skill Matrix**: Track employee skills and competencies
- **Objective Key Results (OKR)**: Implement OKR framework
- **360° Feedback**: Enable peer review functionality
- **Mobile Application**: Develop companion mobile app

## 🔧 Troubleshooting

### Common Issues

1. **Connection to MongoDB fails**:

   - Verify MongoDB is running
   - Check your connection string in `.env`

2. **JWT Token issues**:

   - Clear browser storage and try logging in again
   - Verify JWT_SECRET is consistent

3. **API requests failing**:
   - Check backend console for specific errors
   - Verify API routes and request formats

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, please open an issue in the repository or contact the development team.
