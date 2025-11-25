// Scoring utility: normalized to 30/40/30 for tests/diagnosis/treatments

function toSet(arr) {
  return new Set(Array.isArray(arr) ? arr : []);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function computeGameplayScoreNormalized(caseData, {
  selectedTestIds,
  selectedDiagnosisId,
  selectedTreatmentIds,
}) {
  // 1) Extract ground truth from caseData
  const tests = caseData?.steps?.[1]?.data?.availableTests || [];
  const diags = caseData?.steps?.[2]?.data?.diagnosisOptions || [];
  const step4 = caseData?.steps?.[3]?.data || {};
  const treatmentGroups = step4?.treatmentOptions || {};
  const allTreatments = [
    ...(treatmentGroups.medications || []),
    ...(treatmentGroups.surgicalInterventional || []),
    ...(treatmentGroups.nonSurgical || []),
    ...(treatmentGroups.psychiatric || []),
  ];

  // For lab tests, treat isRelevant === true as the set of correct tests
  const correctTestIds = tests.filter(t => t.isCorrect === true || t.isRelevant === true).map(t => t.testId);
  const correctDiagnosisId = (diags.find(d => d.isCorrect === true) || {}).diagnosisId;
  const correctTreatmentIds = allTreatments.filter(t => t.isCorrect === true).map(t => t.treatmentId);

  // 2) Build sets
  const selTests = toSet(selectedTestIds);
  const selTreats = toSet(selectedTreatmentIds);
  const correctTests = toSet(correctTestIds);
  const correctTreats = toSet(correctTreatmentIds);

  const countIntersect = (a, b) => {
    let count = 0;
    for (const x of a) if (b.has(x)) count++;
    return count;
  };
  const countMinus = (a, b) => {
    let count = 0;
    for (const x of a) if (!b.has(x)) count++;
    return count;
  };

  // 3) Raw scores
  const testsCorrect = countIntersect(selTests, correctTests);
  const testsMissed = countMinus(correctTests, selTests);
  const testsUnnecessary = countMinus(selTests, correctTests);
 
  const rawLabScore = 3 * testsCorrect - 2 * testsMissed - 1 * testsUnnecessary;
  const rawDiagScore = selectedDiagnosisId && correctDiagnosisId && selectedDiagnosisId === correctDiagnosisId ? 10 : 0;
  const medsCorrect = countIntersect(selTreats, correctTreats);
  const medsMissed = countMinus(correctTreats, selTreats);
  const medsUnnecessary = countMinus(selTreats, correctTreats);
 
  const rawMedScore = 3 * medsCorrect - 2 * medsMissed - 1 * medsUnnecessary;

  // 4) Normalization to 30/40/30
  const maxPossibleLabScore = (correctTestIds.length || 0) * 3;
  const maxPossibleMedScore = (correctTreatmentIds.length || 0) * 3;

  const lab = maxPossibleLabScore > 0 ? (rawLabScore / maxPossibleLabScore) * 30 : 0;
  const diagnosis = (rawDiagScore / 10) * 40; // 10 is the max abs for diagnosis correct
  const meds = maxPossibleMedScore > 0 ? (rawMedScore / maxPossibleMedScore) * 30 : 0;

  // Optional clamping to avoid extreme negatives when unnecessary selections are many
//   const testsScore = clamp(lab, -30, 30);
//   const diagnosisScore = clamp(diagnosis, -40, 40);
//   const treatmentScore = clamp(meds, -30, 30);

  const total = (lab || 0) + (diagnosis || 0) + (meds || 0);

  return {
    total,
    tests: lab,
    diagnosis: diagnosis,
    treatment: meds,
  };
}


