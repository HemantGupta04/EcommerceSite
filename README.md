# E-commerce App

This is a simple e-commerce application built with React. It features basic routing, state management with Context API, and components for displaying products, handling user authentication, and managing a shopping cart.

## Features

*   **Component-Based Architecture:** The application is built using reusable React components.
*   **Routing:** It utilizes `react-router-dom` for navigating between different pages.
*   **State Management:** Global state, such as login status and header/footer visibility, is managed using React's Context API.
*   **Bootstrap Styling:** The UI is styled with `bootstrap` for a clean and responsive design.
*   **Conditional Rendering:** The Navbar and Footer are conditionally rendered based on the `isheaderfootershow` state.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have Node.js and npm (or yarn) installed on your machine.

*   [Node.js](https://nodejs.org/)
*   [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/)

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username_/Project-Name.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
    or
    ```sh
    yarn install
    ```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

## Folder Structure
## 📁 Project Directory Structure

```plaintext
/src
├── /Components
│   ├── navbar.js          # Navigation bar
│   ├── footer.js          # Footer section
│   ├── fruits.js          # Fruits listing component
│   ├── vegetables.js      # Vegetables listing component
│   ├── login.js           # Login form
│   └── signup.js          # Signup form
│
├── /Pages
│   ├── Home               # Landing page component
│   └── Cart               # Cart page component
│
├── App.css               # Main styling file
├── App.js                # Root component and routing
└── index.js              # React entry point
```

## Dependencies

*   [react](https://reactjs.org/): A JavaScript library for building user interfaces.
*   [react-dom](https://reactjs.org/docs/react-dom.html): Serves as the entry point to the DOM and server renderers for React.
*   [react-router-dom](https://reactrouter.com/): Declarative routing for React.js.
*   [bootstrap](https://getbootstrap.com/): A popular CSS framework for developing responsive and mobile-first websites.

## State Management

Global state is managed using `React.createContext`.

### `MyContext`

The `MyContext` provides the following values to all components wrapped within its provider:

*   `isheaderfootershow`: A boolean state to control the visibility of the `Navbar` and `Footer`.
*   `setisheaderfootershow`: The function to update the `isheaderfootershow` state.
*   `islogin`: A boolean state to track the user's login status.
*   `setislogin`: The function to update the `islogin` state.

## Routing

The application uses `react-router-dom` to handle navigation. Here are the defined routes:

*   `/`: The home page.
*   `/fruits`: Displays a list of fruits.
*   `/vegetables`: Displays a list of vegetables.
*   `/cart`: The shopping cart page.
*   `/login`: The user login page.
*   `/signup`: The user signup page.

### LOGIN
<img width="1396" height="672" alt="Screenshot 2025-07-31 at 10 46 16 PM" src="https://github.com/user-attachments/assets/a54b7a06-abc1-4bcf-9acc-1b35d0eb1521" />


### SIGNUP
<img width="1402" height="595" alt="Screenshot 2025-07-31 at 10 46 09 PM" src="https://github.com/user-attachments/assets/8c1d0595-63c2-4183-bcd9-2c8479884783" />

### NAVBAR
<img width="1440" height="115" alt="Screenshot 2025-07-31 at 10 45 11 PM" src="https://github.com/user-attachments/assets/cd4bdb89-d3cf-48c0-927d-87e1b38d6bfb" />

### HOME PAGE
<img width="1034" height="730" alt="Screenshot 2025-07-31 at 10 45 30 PM" src="https://github.com/user-attachments/assets/197d2115-c805-4d63-85f6-727a7b8f9fa4" />

### FOOTER
<img width="1363" height="760" alt="Screenshot 2025-07-31 at 10 45 44 PM" src="https://github.com/user-attachments/assets/91a4f2e0-ad5b-443a-9625-562a7ba73816" />

### LIST OF FRUITS AND VEGETABLE
<img width="1440" height="776" alt="Screenshot 2025-07-31 at 10 46 40 PM" src="https://github.com/user-attachments/assets/260a9114-6aff-407d-8458-92e13c0d9cf6" />

### CART
<img width="1440" height="573" alt="Screenshot 2025-07-31 at 10 47 07 PM" src="https://github.com/user-attachments/assets/11888843-d0f2-4732-8d39-27c703605dd8" />






