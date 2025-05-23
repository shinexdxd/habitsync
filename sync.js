// sync.js
import fetch from "node-fetch";
import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const {
  HAB_USER,      // your Habitica user UUID
  HAB_KEY,       // your Habitica API key
  NOTION_TOKEN,  // your Notion integration token
  NOTION_PAGE_ID // the Notion page or database row ID
} = process.env;

const notion = new Client({ auth: NOTION_TOKEN });

async function getHabiticaLevel() {
  const res = await fetch("https://habitica.com/api/v3/user", {
    headers: {
      "x-api-user": HAB_USER,
      "x-api-key": HAB_KEY,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message);
  return json.data.stats.lvl;
}

async function updateNotion(level) {
  await notion.pages.update({
    page_id: NOTION_PAGE_ID,
    properties: {
      HabiticaLevel: { number: level },
    },
  });
  console.log("Notion updated to level", level);
}

(async () => {
  try {
    const lvl = await getHabiticaLevel();
    await updateNotion(lvl);
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
})();
