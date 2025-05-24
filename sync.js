// sync.js
require("dotenv").config();
const { Client } = require("@notionhq/client");

// Node 18+ has global fetch

const {
  HAB_USER,
  HAB_KEY,
  NOTION_TOKEN,
  NOTION_DATABASE_ID,
} = process.env;

const notion = new Client({ auth: NOTION_TOKEN });

function todayDate() {
  return new Date().toISOString().split("T")[0];
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
  const roll  = Math.floor(Math.random() * 20) + 1;  // d20 roll 1–20

  // 1) query for a record where 🗓 Date == today
  const query = await notion.databases.query({
    database_id: NOTION_DATABASE_ID,
    filter: {
      property: "🗓 Date",
      date: { equals: today },
    },
  });

  if (query.results.length) {
    // 2a) update existing page
    await notion.pages.update({
      page_id: query.results[0].id,
      properties: {
       "Name": titleProp,
        HabiticaLevel: { number: level },
        DailyRoll:     { number: roll },
      },
    });
    console.log(`Updated existing record for ${today}, rolled ${roll}`);
  } else {
    // 2b) create a new one
    await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        "🗓 Date":     { date: { start: today } },
        "Name": titleProp,
        HabiticaLevel: { number: level },
        DailyRoll:     { number: roll },
      },
    });
    console.log(`Created new record for ${today}, rolled ${roll}`);
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
