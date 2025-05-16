# Memoria: Idea Tracker & Family Diary

Welcome to Memoria, a personal application built with modern web technologies to help you track your ideas and keep a digital diary for your family.

## Tech Stack

This project is built using:

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI Library:** [React](https://reactjs.org/)
- **Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Firebase Realtime Database](https://firebase.google.com/docs/database)
- **AI Integration (scaffolded):** [Genkit](https://firebase.google.com/docs/genkit)

## Features

- **Idea Tracker:** Capture, categorize, and manage your ideas. Mark them as pending or done. Filter and sort ideas.
- **Family Diary:** Create profiles for family members (with avatars and custom names) and log notes, memories, or important conversations for each. Filter and sort notes.

## Getting Started

1.  **Firebase Setup:**
    *   Ensure you have a Firebase project created at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Add your Firebase project configuration to `src/lib/firebase.ts`. You can find this in your Firebase project settings (Project settings > General > Your apps > Firebase SDK snippet > Config).
    *   Create a Firebase Realtime Database instance in your project.
    *   Configure its security rules. For initial development without user authentication, you can set the rules (in Realtime Database > Rules) to:
        ```json
        {
          "rules": {
            ".read": "true",
            ".write": "true"
          }
        }
        ```
        **Warning:** These rules make your database publicly readable and writable. They are **insecure for production**. You MUST update these rules to be more restrictive (e.g., based on user authentication) before deploying your app or if it handles sensitive data.

2.  **Install Dependencies:**
    Open your terminal in the project directory and run:
    ```bash
    npm install
    ```
    (or `yarn install` or `pnpm install` depending on your preferred package manager).

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    (or `yarn dev` or `pnpm dev`).
    The application will typically be available at [http://localhost:9002](http://localhost:9002).

## Application Structure

-   **`src/app/`**: Contains the main pages and layouts for the Next.js App Router.
    -   `ideas/page.tsx`: The Idea Tracker page.
    -   `diary/page.tsx`: The Family Diary page.
    -   `layout.tsx`: The root layout for the application.
    -   `globals.css`: Global styles and Tailwind CSS theme configuration.
-   **`src/components/`**: Reusable UI components.
    -   `ui/`: ShadCN UI components.
    -   `layout/`: Components related to the overall app layout (sidebar, navigation).
-   **`src/hooks/`**: Custom React hooks.
    -   `useRtdbList.ts`: Hook for interacting with Firebase Realtime Database lists.
-   **`src/lib/`**: Utility functions and library configurations.
    -   `firebase.ts`: Firebase SDK initialization and configuration.
    -   `types.ts`: TypeScript type definitions for data structures.
-   **`src/ai/`**: (Scaffolded) For Genkit AI integration.

## Next Steps (Suggestions)

-   **User Authentication:** Implement Firebase Authentication to create user-specific data and secure database access.
-   **Secure Database Rules:** Update Firebase Realtime Database rules to be more granular based on authenticated users.
-   **Enhance Features:** Add more functionalities to the Idea Tracker or Family Diary.
-   **AI Features:** Explore using Genkit to add AI-powered capabilities.
