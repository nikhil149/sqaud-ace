# Squad Ace

Squad Ace is an exciting web-based cricket card battle game. Players assemble their squad of cricketers, challenge opponents (currently AI, with multiplayer planned for the future), and engage in strategic card battles. The goal is to outsmart your rival by choosing the best stat on your player cards and ultimately collecting all of their cards to win the match!

## Features

*   **Dynamic Card Gameplay:** Receive a hand of unique cricket player cards, each with distinct stats.
*   **Strategic Battles:** Select a card and a stat to challenge your opponent. Higher stats win the opponent's card.
*   **Play vs. AI:** Challenge an AI opponent and test your strategic skills.
*   **Toss Simulation:** A fair toss simulation determines the first player.
*   **Invite System (Upcoming):** Generate unique codes to invite friends to play (currently supports joining games with an ID, full multiplayer squad invites planned).
*   **Clear Win Condition:** The game continues until one player collects all the cards.
*   **Engaging User Interface:** Built with Next.js, Tailwind CSS, and Radix UI for a modern and responsive experience.
*   **AI Powered by Genkit:** Utilizes Genkit for the AI opponent logic.

## How to Play

1.  **Get Your Cards:** You'll start with a hand of cricket player cards, each displaying different stats (e.g., runs, wickets).
2.  **Choose & Battle:**
    *   If it's your turn, select one of your cards and choose a stat to challenge your opponent with.
    *   Your opponent will also select a card and a stat.
    *   The player whose selected card has the higher value for the chosen stat wins the round and takes the opponent's card.
3.  **Conquer All:** The game continues with players taking turns. The ultimate goal is to win all the cards from your opponent. The first player to do so is crowned the Squad Ace!

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (with Turbopack)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/) (implied by component structure and `components.json`)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **AI:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
*   **Forms:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) (for validation)
*   **Deployment/Backend (Likely):** [Firebase](https://firebase.google.com/) (inferred from dependencies and initial README placeholder)

## Getting Started

Follow these instructions to set up and run Squad Ace on your local machine.

### Prerequisites

*   **Node.js:** Make sure you have Node.js installed (which includes npm). You can download it from [nodejs.org](https://nodejs.org/).
*   **npm** (or **yarn**): This project uses npm for package management.

### Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    Open your terminal in the project root directory and run:
    ```bash
    npm install
    ```

### Running the Application

Squad Ace consists of two main parts that need to be run separately: the Next.js frontend and the Genkit AI service.

1.  **Run the Next.js Development Server (Frontend):**
    ```bash
    npm run dev
    ```
    This will typically start the application on [http://localhost:9002](http://localhost:9002).

2.  **Run the Genkit AI Service (AI Opponent):**
    In a separate terminal window/tab, run:
    ```bash
    npm run genkit:dev
    ```
    This will start the Genkit development server, which handles the AI logic. Refer to the Genkit CLI output for the specific port it's running on (usually [http://localhost:3400](http://localhost:3400) for the Genkit Inspector).

Once both services are running, you can open your browser and navigate to the Next.js application URL (e.g., `http://localhost:9002`) to start playing.

## Project Structure

Here's a brief overview of the key directories in the Squad Ace project:

*   `src/app/`: Contains the Next.js pages and route handlers.
    *   `src/app/page.tsx`: The main landing page of the application.
    *   `src/app/play/[squadId]/`: The game board and logic for playing a match.
*   `src/components/`: Reusable UI components used throughout the application.
    *   `src/components/game/`: Components specifically related to the game interface (e.g., `CricketCard.tsx`, `GameBoard.tsx`).
    *   `src/components/ui/`: General-purpose UI elements, many from Shadcn UI/Radix.
*   `src/lib/`: Utility functions, game data, and core game logic (e.g., `game-data.ts`, `utils.ts`).
*   `src/ai/`: Contains the Genkit AI implementation.
    *   `src/ai/genkit.ts`: Defines the Genkit flows and models.
    *   `src/ai/dev.ts`: Script for running Genkit in development.
*   `src/hooks/`: Custom React hooks.
*   `src/types/`: TypeScript type definitions, especially for game-related objects.
*   `docs/`: Project documentation, like the `blueprint.md`.
*   `public/`: Static assets (though Next.js often uses `src/app/favicon.ico` etc.).
*   `package.json`: Lists project dependencies and scripts.
*   `next.config.ts`: Configuration for the Next.js framework.
*   `tailwind.config.ts`: Configuration for Tailwind CSS.

## Contributing

Contributions to Squad Ace are welcome! If you have ideas for improvements, new features, or bug fixes, please feel free to:

1.  Open an issue on the project's GitHub repository to discuss the change.
2.  Fork the repository and create a pull request with your changes.

Please ensure your code follows the existing style and that any new features are well-tested.

## License

This project is currently not under a specific license. It is recommended to add an open-source license (e.g., MIT License) if this project is intended to be shared or collaborated on.

For now, all rights are reserved by the project creators.
