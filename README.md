# Holidaze – Frontend Exam Project

## 📖 About the Project
This project was developed as my **final exam in Frontend Development at Noroff**.  
The goal was to demonstrate skills learned over the past two years and deliver a production-ready application that reflects both **technical** and **visual** capabilities.

**Brief:**  
Holidaze, a new accommodation booking site, required a modern front-end for their API. The feature requirements were defined, but all design and UX decisions were up to me.

## 🔗 Project Links

- **GitHub Repository:**  
  [https://github.com/hvemily/holidaze](https://github.com/hvemily/holidaze)

- **Kanban Board:**  
  [https://github.com/users/hvemily/projects/6](https://github.com/users/hvemily/projects/6)

- **Roadmap:**  
  [https://github.com/users/hvemily/projects/6/views/4](https://github.com/users/hvemily/projects/6/views/4)

- **Live Website (Netlify):**  
  [https://greatholidaze.netlify.app](https://greatholidaze.netlify.app)

- **Figma Prototype:**  
  [Figma Link](https://www.figma.com/proto/sOftI9B3EAqHZQiczlKg0f/Holidaze?node-id=0-1&t=tL0cZpJlk7STO99-1)


---

## 👥 Terminology
- **Visitor:** A user who has not registered or logged in.  
- **Customer:** A registered user logged in as a customer.  
- **Venue Manager:** A registered user logged in as a Venue Manager.  

---

## 📌 User Stories

### All Users
- View a list of venues.
- Search for a specific venue.
- View a venue page by ID.
- Register as a Customer or Venue Manager (with a `@stud.noroff.no` email).
- View a calendar with available and booked dates.

### Customers
- Log in and log out.
- Create a booking.
- View upcoming bookings.
- Update avatar/profile picture.

### Venue Managers
- Log in and log out.
- Create, edit, and delete a venue.
- View upcoming bookings for the venues they manage.
- Update avatar/profile picture.

---

## 🛠️ Built With
- **React + TypeScript**
- **Vite** (bundler & dev server)
- **Tailwind CSS** (utility-first styling)
- **React Router** (client-side routing)
- **React Hook Form / custom hooks** for form handling
- **Netlify** for deployment
- **Noroff API v2** as backend

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/holidaze.git

# Navigate to folder
cd holidaze

# Install dependencies
npm install
```
App will be served at http://localhost:5173

### Build for production
```bash
npm run build
```
### Features Highlight
- Fully responsive design (mobile-first)
- Dynamic search and sorting
- Calender integration for booking availability
- Separate customer vs. manager dashboards
- Toast notifications and modals for user feedback
- Protected routes (only logged in users can manage content)
- Modern UI with Tailwind + custom components

### License
This project was made under the license of Noroff school of Technology and Digital Media

