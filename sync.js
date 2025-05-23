import fetch from "node-fetch";
import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const {
  HAB_USER,
  HAB_KEY,
  NOTION_TOKEN,
  NOTION_DATABASE_ID,  // now a database instead of a single page
} = process.env;

const notion = new Client({ auth: NOTION_TOKEN });

// helper to get today in YYYY-MM-DD format
function todayDate() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

async function getHabiticaLevel() {
  const res = await fetch("https://habitica.com/api/v3/user", {
    headers: {
      "x-api-user": HAB_USER,
      "x-api-key": HAB_KEY,
    },
  });
  const json = await res.json();
  return json.data.stats.lvl;
}

async function upsertDailyRecord(level) {
  const today = todayDate();

  // 1) query for a record whose Date == today
  const query = await notion.databases.query({
    database_id: NOTION_DATABASE_ID,
    filter: {
      property: "Date",
      date: { equals: today },
    },
  });

  if (query.results.length > 0) {
    // 2a) if it exists, update it
    const pageId = query.results[0].id;
    await notion.pages.update({
      page_id: pageId,
      properties: {
        HabiticaLevel: { number: level },
        // add any other props you want to edit
      },
    });
    console.log("Updated existing record for", today);
  } else {
    // 2b) otherwise create a new one
    await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        Date: {
          date: { start: today }
        },
        HabiticaLevel: { number: level },
        // initialize other props too if needed
      },
    });
    console.log("Created new record for", today);
  }
}

(async () => {
  try {
    const lvl = await getHabiticaLevel();
    await upsertDailyRecord(lvl);
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
})();
