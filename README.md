# 🚀 Human Resource Management System (HRMS)

> **“Every workday, perfectly aligned.”**

A modern, full-stack **Human Resource Management System** designed to streamline HR operations — from employee onboarding to attendance, leave management, and payroll visibility — all in one unified platform.

---

## 📌 Problem Statement

Managing HR processes manually or across disconnected tools leads to inefficiency, lack of transparency, and poor employee experience.

This project solves that by providing a **centralized, role-based HR platform** that automates and simplifies core HR workflows.

---

## 🎯 Key Features

### 🔐 Authentication & Authorization

* Secure signup/login with JWT
* Role-based access control (Employee / Admin / HR)
* Protected routes & session handling

---

### 📊 Smart Dashboards

**👤 Employee Dashboard**

* Profile overview
* Attendance summary
* Leave status
* Quick actions

**🧑‍💼 Admin/HR Dashboard**

* Employee management
* Attendance tracking (all employees)
* Leave approvals
* Payroll overview

---

### 👤 Employee Profile Management

* View personal & job details
* Salary structure visibility
* Upload profile picture
* Edit limited fields (Employee)
* Full control (Admin)

---

### 🕒 Attendance System

* Check-in / Check-out functionality
* Daily & weekly tracking
* Status types:

  * Present
  * Absent
  * Half-day
  * Leave
* Admin view for all employees

---

### 📝 Leave Management

* Apply for leave (Paid / Sick / Unpaid)
* Calendar-based date selection
* Add remarks
* Real-time status updates:

  * Pending
  * Approved
  * Rejected
* Admin approval system with comments

---

### 💰 Payroll Module

* Employee: Read-only salary view
* Admin: Manage salary structure
* Basic components:

  * Base salary
  * Bonus
  * Deductions

---

## 🛠️ Tech Stack

**Frontend**

* React.js
* Tailwind CSS

**Backend**

* Node.js
* Express.js

**Database**

* MongoDB

**Authentication**

* JWT (JSON Web Tokens)

---

## 📂 Project Structure

```
HRMS/
├── frontend/       # React UI
├── backend/        # Express API
├── database/       # MongoDB models & schemas
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/hrms.git
cd hrms
```

### 2️⃣ Setup Backend

```bash
cd backend
npm install
npm start
```

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in the backend:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

---

## 🚀 Future Enhancements

* 📧 Email notifications for approvals
* 📊 Attendance analytics dashboard
* 📁 Document management system
* 📤 Export reports (CSV/PDF)
* 🌙 Dark mode UI

---

## 🧠 What Makes This Project Stand Out

* 🔥 Full-stack implementation with real-world HR workflows
* ⚡ Clean UI with role-based experience
* 🧩 Modular and scalable architecture
* 🎯 Built with hackathon efficiency in mind

---

## 👨‍💻 Team / Author

Built with passion during a hackathon 💻⚡
*Name: Debjeet Kundu*
*Name: Debangshu Dutta*
*Name: Tanaya Bhattacharya*
*Name: Indrani Biswas*

---

## 📜 License

This project is for educational and hackathon purposes.

---

## ⭐ Final Note

If you like this project, give it a ⭐ — and if you're a judge…
**we hope this system earns your approval 😉**
