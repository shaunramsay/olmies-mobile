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

  // Assign the Spring 2026 one explicitly! 
  const goodVersion = await client.query(`
    SELECT v."SurveyVersionId" 
    FROM "SurveyVersions" v 
    INNER JOIN "SurveyTemplates" t ON v."SurveyTemplateId" = t."SurveyTemplateId" 
    WHERE t."Name" = 'Student Experience Survey - Spring 2026' LIMIT 1
  `);
  
  if (goodVersion.rows.length > 0) {
     const id = goodVersion.rows[0].SurveyVersionId;
     await client.query(`UPDATE "SurveyVersions" SET "ModuleOfferingId" = (SELECT "ModuleOfferingId" FROM "ModuleOfferings" WHERE "ModuleCode" = 'COMP3012') WHERE "SurveyVersionId" = $1`, [id]);
     console.log("SUCCESSFULLY ASSIGNED The Spring 2026 survey to COMP3012! Version ID:", id);
  } else {
     console.log("Could not find Student Experience Survey - Spring 2026!");
  }

  await client.end();
}
run().catch(console.error);
