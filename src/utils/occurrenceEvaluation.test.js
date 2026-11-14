const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildSubmission,
  chooseOccurrence,
  evaluationList,
  initialSelections,
  interpretResponse,
  lecturerLine,
  missingMessage,
  skipTeachingType,
} = require('./occurrenceEvaluation');

// Synthetic form shaped like GET /api/v1/student/evaluations/{id}/form.
const form = {
  assignmentId: 'a1',
  moduleCode: 'SIM-OCC-201',
  allowSkipTeachingType: false,
  moduleSections: [{ sectionId: 'm', title: 'Module', questions: [{ questionId: 'qm', type: 'Likert' }] }],
  occurrenceSections: [{ sectionId: 'o', title: 'Session', questions: [{ questionId: 'qo', type: 'Likert' }] }],
  teachingTypes: [
    {
      activityCode: 'LEC', activityName: 'Lecture', preselectedOccurrenceCode: 'LEC_G1',
      occurrences: [
        { occurrenceCode: 'LEC_G1', association: 'registered', requiresConfirmation: false, lecturerNames: ['Synthetic Lecturer One'] },
        { occurrenceCode: 'LEC_G2', association: 'alternative', requiresConfirmation: true, lecturerNames: [] },
      ],
    },
    {
      activityCode: 'LAB', activityName: 'Laboratory', preselectedOccurrenceCode: null,
      occurrences: [
        { occurrenceCode: 'LAB_1', association: 'registeredGroupUnresolved', requiresConfirmation: false, lecturerNames: [] },
        { occurrenceCode: 'LAB_2', association: 'registeredGroupUnresolved', requiresConfirmation: false, lecturerNames: [] },
      ],
    },
  ],
};

test('the registered occurrence is preselected; an unresolved group preselects nothing', () => {
  assert.deepEqual(initialSelections(form), { LEC: { occurrenceCode: 'LEC_G1', confirmed: false } });
});

test("another group's session needs confirmation before it replaces the registered one", () => {
  const start = initialSelections(form);
  const asked = chooseOccurrence(form, start, 'LEC', 'LEC_G2');
  assert.equal(asked.needsConfirmation, true);
  assert.deepEqual(asked.selections, start);

  const confirmed = chooseOccurrence(form, start, 'LEC', 'LEC_G2', true);
  assert.equal(confirmed.needsConfirmation, false);
  assert.deepEqual(confirmed.selections.LEC, { occurrenceCode: 'LEC_G2', confirmed: true });
});

test('choosing within an unresolved registered group needs no confirmation', () => {
  const result = chooseOccurrence(form, {}, 'LAB', 'LAB_2');
  assert.equal(result.needsConfirmation, false);
  assert.deepEqual(result.selections.LAB, { occurrenceCode: 'LAB_2', confirmed: false });
});

test('an unknown occurrence changes nothing', () => {
  const start = initialSelections(form);
  assert.deepEqual(chooseOccurrence(form, start, 'LEC', 'NOPE').selections, start);
});

test('skipping a teaching type is possible only when the campaign allows it', () => {
  assert.deepEqual(skipTeachingType(form, {}, 'LAB'), {});
  assert.deepEqual(skipTeachingType({ ...form, allowSkipTeachingType: true }, {}, 'LAB'), { LAB: { skipped: true } });
});

test('an incomplete evaluation is not submitted, and the message names what is missing', () => {
  const selections = initialSelections(form);
  assert.equal(missingMessage(form, {}, selections, {}), 'Answer every module question.');
  assert.equal(missingMessage(form, { qm: '4' }, selections, {}), 'Answer every question about the Lecture session.');
  assert.equal(missingMessage(form, { qm: '4' }, selections, { LEC_G1: { qo: '5' } }), 'Choose the Laboratory session you attended.');
  assert.equal(missingMessage(form, { qm: ' ' }, selections, {}), 'Answer every module question.');
});

test('a complete evaluation builds the server request, with session answers only for chosen sessions', () => {
  let selections = chooseOccurrence(form, initialSelections(form), 'LEC', 'LEC_G2', true).selections;
  selections = chooseOccurrence(form, selections, 'LAB', 'LAB_1').selections;
  const occurrenceAnswers = { LEC_G2: { qo: '5' }, LAB_1: { qo: '2' }, LEC_G1: { qo: '1' } };
  assert.equal(missingMessage(form, { qm: '4' }, selections, occurrenceAnswers), null);

  const body = buildSubmission(form, { qm: '4' }, selections, occurrenceAnswers);

  assert.deepEqual(body, {
    moduleAnswers: { qm: '4' },
    selections: [
      { activityCode: 'LEC', occurrenceCode: 'LEC_G2', confirmedAlternative: true },
      { activityCode: 'LAB', occurrenceCode: 'LAB_1', confirmedAlternative: false },
    ],
    occurrenceAnswers: [
      { occurrenceCode: 'LEC_G2', questionId: 'qo', value: '5' },
      { occurrenceCode: 'LAB_1', questionId: 'qo', value: '2' },
    ],
  });
  assert.doesNotMatch(JSON.stringify(body), /student/i);
});

test('a skipped teaching type sends no selection and needs no answers', () => {
  const skippable = { ...form, allowSkipTeachingType: true };
  const selections = skipTeachingType(skippable, initialSelections(skippable), 'LAB');
  assert.equal(missingMessage(skippable, { qm: '3' }, selections, { LEC_G1: { qo: '4' } }), null);
  assert.deepEqual(buildSubmission(skippable, { qm: '3' }, selections, { LEC_G1: { qo: '4' } }).selections,
    [{ activityCode: 'LEC', occurrenceCode: 'LEC_G1', confirmedAlternative: false }]);
});

test('server outcomes: submitted, already submitted, outage keeps the draft, ineligible blocks', () => {
  assert.deepEqual(interpretResponse(200, { status: 'Submitted' }), { kind: 'ok' });
  assert.equal(interpretResponse(409, { code: 'AlreadySubmitted' }).kind, 'blocked');
  assert.equal(interpretResponse(409, {}).message, 'This evaluation was already submitted.');
  assert.equal(interpretResponse(404, {}).kind, 'blocked');
  assert.equal(interpretResponse(503, { code: 'Unavailable', error: 'x' }).kind, 'retry');
  assert.equal(interpretResponse(503, { error: 'academic_record_unavailable' }).kind, 'retry');
  assert.equal(interpretResponse(403, { error: 'student_not_eligible' }).kind, 'blocked');
  assert.deepEqual(interpretResponse(400, { code: 'Invalid', error: 'Answer every question about the Lecture session.' }),
    { kind: 'retry', message: 'Answer every question about the Lecture session.' });
  assert.equal(interpretResponse(500, {}).kind, 'retry');
});

test('the evaluations list shows status labels and only to-do evaluations can be started', () => {
  const list = evaluationList({
    evaluations: [
      { assignmentId: 'a1', moduleCode: 'SIM-OCC-201', status: 'ToDo' },
      { assignmentId: 'a2', moduleCode: 'SIM-OCC-202', status: 'Completed' },
    ],
    unavailableCampaigns: [{ campaignId: 'c', message: 'Your academic record could not be read right now.' }],
  });
  assert.deepEqual(list.evaluations.map((e) => [e.statusLabel, e.canStart]), [['To do', true], ['Completed', false]]);
  assert.equal(list.unavailable.length, 1);
  assert.deepEqual(evaluationList(null), { evaluations: [], unavailable: [] });
});

test('missing lecturer information is shown, never blocking', () => {
  assert.equal(lecturerLine(form.teachingTypes[0].occurrences[0]), 'Synthetic Lecturer One');
  assert.equal(lecturerLine(form.teachingTypes[0].occurrences[1]), 'Lecturer not recorded');
});
