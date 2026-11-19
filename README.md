# CivicCycle - Frontend

React + Vite web application for **CivicCycle**, a doorstep dry-waste recycling platform with dedicated portals for Citizens, Collectors, and Municipal Administrators.

- **Live Website:** https://civiccycle-frontend.vercel.app
- **Backend Repository:** https://github.com/nishadbk951/civiccyle-backend

## Core Dashboards & User Flows

1. **Citizen Portal (`/user-dashboard`):**
   - Pin exact doorstep pickup coordinates using an interactive GPS map.
   - Capture live waste photos directly from a mobile camera with client-side image compression before upload.
   - View instant AI verification results (accepted dry waste category or rejection reason) and track live request status.
   - Receive a unique 4-digit handover PIN once a ward collector accepts the pickup.

2. **Collector Portal (`/collector-dashboard`):**
   - Filter ward-level pickup queues across `Available`, `My Active Pickups`, and `History` tabs.
   - Launch one-tap Google Maps navigation to the citizen's doorstep and use click-to-call contact links.
   - Complete pickups securely by verifying the citizen's 4-digit PIN at the doorstep.

3. **Admin Command Center (`/admin-dashboard`):**
   - Review collector KYC registrations and approve or revoke collector access.
   - Filter all pickup requests across districts, municipalities, wards, and statuses, with the ability to reopen stuck `IN_PROGRESS` tasks.
   - View waste category distribution and regional volume analytics via custom SVG pie charts.

## Engineering & UX Highlights

- **Client-Side Image Compression:** Mobile camera photos are resized and compressed in the browser before uploading to keep requests fast on mobile networks and stay well within backend memory limits.
- **Cold-Start & Auth Handling:** Configured Axios interceptors to attach JWT Bearer tokens automatically and handle initial Render free-tier cold-start delays smoothly with clear loading states.
- **Responsive Design:** Built with a mobile-first layout so citizens and field collectors can use the app comfortably on smartphones while admins get a full-screen analytics view on desktop.

## Demo Login Credentials (For Reviewers)

Test all three role-based portals directly on the [Live Website](https://civiccycle-frontend.vercel.app):

- **Citizen (User):** Phone: `[1122334455]` | Password: `[dilshad123]`
- **Collector:** Phone: `[1112223334]` | Password: `[sinan@123]`
- **Admin (Demo):** Phone: `[9999999990]` | Password: `[admin999]` *(Password updates locked on this shared account)*

## Tech Stack

- **Framework:** React, Vite, React Router DOM
- **Styling:** Tailwind CSS (`Fraunces` & `DM Sans` typography, custom SVG graphics)
- **API Client:** Axios (JWT Authentication)
- **Hosting:** Vercel

## Run Locally on Your Machine

If you want to run the frontend locally instead of using the hosted Vercel deployment:

1. **Clone the repository and install dependencies:**
   ```bash
   git clone [https://github.com/nishadbk951/civiccycle-frontend.git]
   cd civiccycle-frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

*(Optional)* By default, the app connects to the deployed backend API. To point it to a local Django server instead, create a `.env` file in the root folder with:
```env
VITE_API_URL=[http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
```
