# Papa Veg Pizza 🍕

Welcome to the **Papa Veg Pizza** project repository. This is a comprehensive, multi-tenant MERN (MongoDB, Express, React, Node.js) stack application designed for an enterprise-level pizza franchise and food delivery system.

## 🚀 Tech Stack

### Frontend
- **Framework:** React.js (via Vite)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP Client:** Axios (Modular client system for Admin, User, Franchise, and Delivery roles)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (using Mongoose ODM)
- **Architecture:** Modular, domain-driven structure (Auth, Food, Admin, Franchise, Delivery, Uploads)

## 🏗 Project Architecture & Structure

The repository is divided into two primary directories:

### `/Frontend`
The client application is highly modularized to support distinct views for different user roles (Customers, Delivery Partners, Franchise Owners, and Superadmins).
- `src/modules/Food/pages/superadmin/franchiseManagement`: Superadmin dashboards to manage franchises, store approvals, and store managers.
- `src/services/api`: Centralized API service layer utilizing domain-specific Axios clients (`adminClient`, `userClient`, etc.).

### `/Backend`
A robust API handling complex business logic, geospatial data, role-based access, and transactional processing.
- `src/core`: Core configurations for Authentication, Payments, Notifications, and Roles.
- `src/modules/food/franchise`: API controllers, models, and routes for Franchise logic (Store models, Store Manager mapping, Franchise Approvals).
- `src/modules/food/admin`: Superadmin services to fetch analytics, metrics, region/zone configurations, and store management.

## 🔑 Key Features

1. **Multi-tier Organization Structure:**
   - Hierarchy maps from **Regions** → **Zones** → **Territories** → **Stores**.
   - Flexible mappings allow franchise owners to easily identify their geographical operational parameters.

2. **Enterprise Franchise Management (Superadmin):**
   - **Store Approvals:** Onboard and review new franchise store applications (e.g., verifying FSSAI documents).
   - **Store KPIs:** View real-time analytics, revenue, and order metrics on a per-store basis.
   - **Access Control:** Suspend, Activate, or permanently Close franchise stores with a click.

3. **Food Ordering & Fulfillment:**
   - Manage real-time orders, fulfillment modes (Delivery, Takeaway, Dine-in), and delivery partner assignment.

4. **Robust Role-Based Access Control (RBAC):**
   - Distinct logic and permissions for Superadmins, Franchise Owners, Store Managers, Delivery Drivers, and End Consumers.

## 💻 Running the Application Locally

1. **Install Dependencies:**
   ```bash
   # In /Backend
   npm install

   # In /Frontend
   npm install
   ```

2. **Start the Development Servers:**
   ```bash
   # Run the backend API (Defaults to http://localhost:5000)
   cd Backend
   npm run dev
   # or
   nodemon server.js

   # Run the frontend Client (Defaults to http://localhost:5173)
   cd Frontend
   npm run dev
   ```

## 🛠 Recent Contributions & Fixes
- Added robust fallback mapping between the Store Schema and Franchise Schema to seamlessly display operational Regions and Zones.
- Enriched the Superadmin UI to elegantly handle store suspensions, activations, and complex data rendering.
- Standardized the API layer ensuring optimal encapsulation across administrative, user, and delivery requests.
