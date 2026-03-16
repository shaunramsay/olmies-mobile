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
  // Unassign all from COMP3012
  await client.query(`UPDATE "SurveyVersions" SET "ModuleOfferingId" = NULL WHERE "ModuleOfferingId" = (SELECT "ModuleOfferingId" FROM "ModuleOfferings" WHERE "ModuleCode" = 'COMP3012')`);
  console.log("Unassigned all surveys from COMP3012");

  // Assign the good one
  const goodVersion = await client.query(`SELECT v."SurveyVersionId" FROM "SurveyVersions" v INNER JOIN "SurveySections" s ON v."SurveyVersionId" = s."SurveyVersionId" LIMIT 1`);
  if (goodVersion.rows.length > 0) {
     const id = goodVersion.rows[0].SurveyVersionId;
     await client.query(`UPDATE "SurveyVersions" SET "ModuleOfferingId" = (SELECT "ModuleOfferingId" FROM "ModuleOfferings" WHERE "ModuleCode" = 'COMP3012') WHERE "SurveyVersionId" = $1`, [id]);
     console.log("Assigned good survey to COMP3012, version ID:", id);
  } else {
     console.log("Could not find a survey version with sections");
  }

  await client.end();
}
run().catch(console.error);
