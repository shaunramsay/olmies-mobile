const fetch = require('node-fetch');
const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  user: 'olmies_user',
  host: 'localhost',
  database: 'olmies',
  password: 'olmies_pass',
  port: 5432,
});

async function run() {
  const dbData = await fetch('http://localhost:5000/api/v1/auth/testing/debug-db').then(r => r.json());
  const activeVer = dbData.versions.find(v => v.moduleOfferingId);
  if(!activeVer) return console.log("NO active survey found!");
  
  const versionId = activeVer.surveyVersionId;
  const moduleId = activeVer.moduleOfferingId;
  
  await client.connect();
  const existing = await client.query('SELECT * FROM "ResponseHeaders" WHERE "HashedResponderId" = $1 AND "SurveyVersionId" = $2', ['1234567', versionId]);
  
  if (existing.rows.length === 0) {
     const windowReq = await client.query('SELECT "WindowId" FROM "SurveyWindows" WHERE "SurveyVersionId" = $1 LIMIT 1', [versionId]);
     const windowId = windowReq.rows[0]?.WindowId || crypto.randomUUID(); // Fallback if no window
     
     const responseId = crypto.randomUUID();
     
     if(!windowReq.rows[0]) {
         // Create dummy window if none exists 
         await client.query('INSERT INTO "SurveyWindows" ("WindowId", "SurveyVersionId", "OpenAt", "CloseAt") VALUES ($1, $2, NOW(), NOW() + interval \'7 days\')', [windowId, versionId]);
     }
     
     await client.query(`
        INSERT INTO "ResponseHeaders" 
        ("ResponseId", "SurveyWindowId", "SurveyVersionId", "SubmittedAt", "ResponderType", "AuthProvider", "HashedResponderId", "ModuleOfferingId")
        VALUES ($1, $2, $3, NOW(), 1, 1, $4, $5)
     `, [responseId, windowId, versionId, '1234567', moduleId]);
     
     console.log("Mock ResponseHeader inserted successfully.");
  } else {
     console.log("Response already exists!");
  }
  
  await client.end();
}
run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
