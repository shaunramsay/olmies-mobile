const { Client } = require('pg');

const client = new Client({
  user: 'olmies_user',
  host: 'localhost',
  database: 'olmies',
  password: 'olmies_pass',
  port: 5432,
});

async function run() {
  await client.connect();

  console.log("Connected to Database. Injecting Mock Image URLs...");

  try {
    const res2 = await client.query(`
      UPDATE "Announcements" 
      SET "ImageUrl" = $1 
      WHERE "Title" LIKE $2
    `, ['https://images.unsplash.com/photo-1555507036-ab1d4075c6f5?auto=format&fit=crop&w=400&q=80', '%Jerk Chicken%']);

    console.log(`✅ Restored Jerk Chicken image URL. Rows affected: ${res2.rowCount}`);

  } catch (err) {
    console.error("❌ SQL Error:", err);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
