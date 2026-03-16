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
  const res = await client.query(`SELECT v."SurveyVersionId", t."Name", m."ModuleCode" FROM "SurveyVersions" v JOIN "ModuleOfferings" m ON v."ModuleOfferingId" = m."ModuleOfferingId" JOIN "SurveyTemplates" t ON v."SurveyTemplateId" = t."SurveyTemplateId" WHERE v."ModuleOfferingId" IS NOT NULL`);
  console.log(JSON.stringify(res.rows, null, 2));

  // Also check if there are MULTIPLE published surveys for the same module
  const res2 = await client.query(`SELECT "SurveyVersionId", "Status", "ModuleOfferingId" FROM "SurveyVersions" WHERE "ModuleOfferingId" IS NOT NULL`);
  console.log("All bound surveys:", JSON.stringify(res2.rows, null, 2));

  await client.end();
}
run().catch(console.error);
