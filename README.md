# rose.ai

A quiet space to say the unpolished thing.

## Running it on your own computer

    npm install
    npm run dev

Then open http://localhost:5173

For Rose to reply you need a Groq key. Make a file called `.env.local`
in this folder containing one line:

    GROQ_API_KEY=your_key_here

Get a free key at https://console.groq.com (no card needed).

## Putting it online

This is built for Vercel's free Hobby plan.

1. Push this folder to a GitHub repository
2. Go to vercel.com, sign in with GitHub, click Add New Project
3. Pick the repository. Leave every setting as it is.
4. Before deploying, open Environment Variables and add:
   Name: GROQ_API_KEY   Value: your key
5. Click Deploy

## Checking it still works

    npm test

Covers crisis phrase detection, the off-topic filter, the support
resources, and the error paths.

## Where things live

    src/                 the pages people see
    api/grace/chat.ts    Rose's conversation
    api/grace/today.ts   the daily practice
    api/_lib/prompt.ts   Rose's personality and rules
    api/_lib/crisis.ts   phrases that trigger the support panel
    api/_lib/support-resources.ts   helplines by country

## Before students use it

`api/_lib/support-resources.ts` has a "Someone you trust" entry with no
phone number. If your school has a counsellor, put their name and number
there. Pakistani helplines are verified; other countries fall through to
findahelpline.com, which is maintained by people whose job it is.
