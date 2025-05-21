 # MVP Loja Mae - Setup Instructions

This document provides instructions on how to set up and run the MVP Loja Mae project locally.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   **Node.js**: (Version 18.x or later recommended)
-   **npm** (Node Package Manager), **yarn**, or **pnpm**: This project uses `npm` in the examples, but you can adapt the commands for `yarn` or `pnpm`.
-   **PostgreSQL**: A running instance of PostgreSQL is required for the database.

## 1. Extract Project Files

Extract the contents of the `mvp-loja-mae_middleware_fixed.zip` file to a directory of your choice on your local machine.

## 2. Navigate to Project Directory

Open your terminal or command prompt and navigate to the root directory of the extracted project. This is the directory that contains the `package.json` file (likely `mvp-loja-mae`).

```bash
cd path/to/your/mvp-loja-mae
```

And then into the main application folder:

```bash
cd mvp-loja-mae
```

*(Ensure you are in the directory that contains `package.json`, `next.config.mjs`, `prisma` folder etc.)*

## 3. Install Dependencies

Install the project dependencies using your preferred package manager. The commands below show `npm`, but `pnpm` or `yarn` work as well:

```bash
npm install
# or
pnpm install
# or
yarn install
```

This will download and install all the packages defined in `package.json`. `npm install` uses `package-lock.json`, while `pnpm install` relies on `pnpm-lock.yaml`.

## 4. Set Up Environment Variables

Create a `.env` file in the root of the project (the same directory as `package.json`). This file will store your environment-specific configurations.

Copy the contents of `.env.example` (if one exists) or create a new `.env` file with the following content, replacing the placeholder values with your actual database connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public"

# Example for Gmail (ensure you have an App Password if 2FA is enabled)
# EMAIL_SERVER_HOST="smtp.gmail.com"
# EMAIL_SERVER_PORT=587
# EMAIL_SERVER_USER="your-email@gmail.com"
# EMAIL_SERVER_PASSWORD="your-gmail-app-password"
# EMAIL_FROM="'Your App Name' <your-email@gmail.com>"

# For NextAuth.js (generate a secret using: openssl rand -base64 32)
# NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"
# NEXTAUTH_URL="http://localhost:3000" # Or the port your app runs on
# OPENAI_API_KEY="your-openai-api-key"
```

**Important Notes on `DATABASE_URL`**:

*   Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE_NAME` with your PostgreSQL credentials and database details.
*   Ensure the PostgreSQL server is running and accessible.

## 5. Apply Database Migrations

This project uses Prisma as an ORM. To create the database schema based on the `prisma/schema.prisma` file, run the following command:

```bash
npx prisma db push
```

Alternatively, for a more robust migration workflow (recommended for ongoing development):

```bash
npx prisma migrate dev --name init
```

This will apply any pending migrations and create the necessary tables in your database.

## 6. Set Up shadcn/ui Components

This project uses shadcn/ui. The basic setup should be present, but you'll need to add the specific components for which placeholders were created.

First, ensure Tailwind CSS is configured. The `tailwind.config.ts` and `postcss.config.js` files should be present. Your `globals.css` (likely in `src/app/globals.css` or `src/styles/globals.css`) should include:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

If `shadcn-ui` has not been initialized yet (check for a `components.json` file in the project root), run:

```bash
npx shadcn-ui@latest init
```

Follow the prompts. It will ask about TypeScript, style, base color, CSS variables, etc. Choose options that align with the project's current setup (likely TypeScript, New York style, Slate color, CSS Variables: Yes).

Then, add the individual components that have placeholder files in `src/components/ui/`. Run these commands one by one:

```bash
npx shadcn-ui@latest add table
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert # (or alert-dialog if that's what you need)
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add progress
```

This will populate the placeholder files with the actual component code from shadcn/ui.

## 7. Run the Development Server

Once all dependencies are installed and environment variables are set, you can start the Next.js development server:

```bash
npm run dev
```

This will typically start the application on `http://localhost:3000` (or another port if 3000 is busy, as you saw it use 3001 previously).

Open your web browser and navigate to the address shown in the terminal.

## Troubleshooting

-   **Module Not Found Errors**: Double-check your `npm install` was successful and that all paths in your import statements are correct.
-   **Database Connection Errors**: Verify your `DATABASE_URL` in the `.env` file is correct and that your PostgreSQL server is running and accessible.
-   **Tailwind CSS / shadcn/ui Styling Issues**: Ensure Tailwind CSS is correctly configured and that you've run `npx shadcn-ui@latest init` and added the components as described.

-   **"next: not found" Error**: This indicates dependencies are missing. Run `npm install` before `npm run dev`.

That's it! You should now have the MVP Loja Mae application running locally.

## Deprecated packages
See [DEPRECATED_PACKAGES.md](DEPRECATED_PACKAGES.md) for a list of known deprecated dependencies extracted from the lock files.

