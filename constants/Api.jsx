//const API_BASE =  "https://gtd.thebilling.in";
 const API_BASE =  "http://172.20.10.6:3004";

 const CASES_ARRAY = [
  {
    "caseId": "ACS001",
    "caseTitle": "58-Year-Old with Crushing Chest Pain",
    "caseCategory": "Cardiology",
    "steps": [
      {
        "stepNumber": 1,
        "stepTitle": "Initial Patient Presentation",
        "data": {
          "basicInfo": { "name": "John Smith", "age": 58, "gender": "Male", "occupation": "Construction Worker" },
          "chiefComplaint": "'Crushing' chest pain for 1 hour. Pain is 9/10, substernal, radiates to the left arm. Associated with sweating and shortness of breath.",
          "vitals": { "bloodPressure": "160/95 mmHg", "heartRate": "110 bpm", "respiratoryRate": "22 breaths/min", "temperature": "98.6°F (37°C)", "oxygenSaturation": "94% on room air" },
          "history": [
            { "category": "History of Present Illness", "detail": "Constant, severe substernal pressure for 1 hour. Associated with nausea and diaphoresis. Not relieved by rest." },
            { "category": "Past Medical History", "detail": "Hypertension (poorly controlled), Hyperlipidemia." },
            { "category": "Medications", "detail": "Lisinopril 10mg daily (intermittent compliance)." },
            { "category": "Allergies", "detail": "NKDA (No Known Drug Allergies)." },
            { "category": "Social History", "detail": "Smoker (30-pack-years). Occasional alcohol use." },
            { "category": "Family History", "detail": "Father died from myocardial infarction at age 62." }
          ],
          "physicalExamination": [
            { "system": "General", "findings": "Anxious, pale, diaphoretic male in moderate distress." },
            { "system": "Cardiovascular", "findings": "Tachycardic, regular rhythm. Clear S1/S2. No murmurs, rubs, or JVD (Jugular Venous Distention)." },
            { "system": "Respiratory", "findings": "Lungs clear to auscultation bilaterally." },
            { "system": "Abdominal", "findings": "Abdomen is soft, non-tender. Normal bowel sounds." },
            { "system": "Extremities", "findings": "Warm with 2+ distal pulses. No edema." }
          ]
        }
      },
      {
        "stepNumber": 2,
        "stepTitle": "Order Diagnostic Tests",
        "data": {
          "availableTests": [
            { "testId": "lab001", "testName": "Troponin I", "category": "Laboratory", "isRelevant": true, "result": "2.5 ng/mL (Ref: <0.04 ng/mL)", "impression": "Elevated." },
            { "testId": "lab002", "testName": "Complete Blood Count (CBC)", "category": "Laboratory", "isRelevant": true, "result": "WBC: 12.5 x 10^9/L (Ref: 4.5-11.0), Hgb: 15.2 g/dL (Ref: 13.5-17.5), Plt: 250,000/μL (Ref: 150-450,000)", "impression": "WBC is high. Hgb and Plt are within normal limits." },
            { "testId": "lab003", "testName": "D-Dimer", "category": "Laboratory", "isRelevant": false, "result": "0.30 mcg/mL (Ref: <0.50 mcg/mL)", "impression": "Within normal limits." },
            { "testId": "lab004", "testName": "Liver Function Tests (LFTs)", "category": "Laboratory", "isRelevant": false, "result": "AST: 25 U/L (Ref: 10-40), ALT: 30 U/L (Ref: 7-56), Alk Phos: 80 U/L (Ref: 44-147)", "impression": "All parameters are within normal limits." },
            { "testId": "img001", "testName": "12-Lead ECG", "category": "Imaging/Cardiac", "isRelevant": true, "result": "Rhythm: Sinus Tachycardia. Findings: ST-segment elevation of 3mm in anterior leads (V1-V4).", "impression": "ST-segment elevation noted in anterior leads." },
            { "testId": "img002", "testName": "Portable Chest X-Ray (CXR)", "category": "Imaging/Cardiac", "isRelevant": true, "result": "Normal cardiomediastinal silhouette. Lungs are clear.", "impression": "No acute findings." },
            { "testId": "img003", "testName": "CT Angiogram of Chest", "category": "Imaging/Cardiac", "isRelevant": false, "result": "No filling defects in pulmonary arteries. Aorta is of normal caliber.", "impression": "Negative for pulmonary embolism and aortic dissection." }
          ]
        }
      },
      {
        "stepNumber": 3,
        "stepTitle": "Select Diagnosis",
        "data": {
          "diagnosisOptions": [
            { "diagnosisId": "diag01", "diagnosisName": "Acute ST-Elevation Myocardial Infarction (STEMI)", "isCorrect": true },
            { "diagnosisId": "diag02", "diagnosisName": "Pulmonary Embolism", "isCorrect": false },
            { "diagnosisId": "diag03", "diagnosisName": "Aortic Dissection", "isCorrect": false },
            { "diagnosisId": "diag04", "diagnosisName": "Unstable Angina", "isCorrect": false },
            { "diagnosisId": "diag05", "diagnosisName": "Pericarditis", "isCorrect": false }
          ]
        }
      },
      {
        "stepNumber": 4,
        "stepTitle": "Provide Treatment",
        "data": {
          "treatmentOptions": {
            "medications": [
              { "treatmentId": "med01", "treatmentName": "Aspirin 325mg", "isCorrect": true },
              { "treatmentId": "med02", "treatmentName": "Sublingual Nitroglycerin", "isCorrect": true },
              { "treatmentId": "med03", "treatmentName": "IV Morphine for pain", "isCorrect": true },
              { "treatmentId": "med04", "treatmentName": "Initiate Beta-Blocker (e.g., Metoprolol)", "isCorrect": true },
              { "treatmentId": "med05", "treatmentName": "Ibuprofen 600mg", "isCorrect": false }
            ],
            "surgicalInterventional": [
              { "treatmentId": "surg01", "treatmentName": "Emergent Cardiac Catheterization with PCI", "isCorrect": true },
              { "treatmentId": "surg02", "treatmentName": "Immediate Thoracotomy", "isCorrect": false }
            ],
            "nonSurgical": [
              { "treatmentId": "nonsurg01", "treatmentName": "Oxygen via nasal cannula to maintain SpO2 >94%", "isCorrect": true },
              { "treatmentId": "nonsurg02", "treatmentName": "Observation and serial ECGs", "isCorrect": false }
            ],
            "psychiatric": []
          }
        }
      },
      {
        "stepNumber": 5,
        "stepTitle": "Case Review",
        "data": {
          "howWeLandedOnTheDiagnosis": [
            "**High Clinical Suspicion from History:** The patient's story—crushing chest pain, radiation to the arm, sweating, and multiple cardiac risk factors—strongly pointed towards an Acute Coronary Syndrome.",
            "**Definitive ECG Evidence:** The 12-Lead ECG provided the first piece of conclusive evidence, showing ST-segment elevation in the anterior leads (V1-V4).",
            "**Biomarker Confirmation of Injury:** The significantly elevated Troponin I level confirmed that acute myocardial injury was actively occurring.",
            "**Final Diagnosis Synthesis:** The combination of the classic presentation, hallmark ECG changes, and positive cardiac biomarkers solidifies the diagnosis of an Acute ST-Elevation Myocardial Infarction (STEMI)."
          ],
          "rationaleBehindTestSelection": [
            "**12-Lead ECG (Highest Priority):** This is the most critical first step to identify a STEMI. It is fast, non-invasive, and the findings dictate the need for immediate reperfusion therapy.",
            "**Troponin I (High Priority):** This biomarker confirms myocardial cell death. While the ECG identifies the emergency, the troponin confirms the diagnosis of myocardial infarction.",
            "**Portable Chest X-Ray (Essential):** Crucial for ruling out other life-threatening causes of chest pain like aortic dissection (widened mediastinum) or pneumothorax, which can present similarly.",
            "**CBC (Supportive):** Ordered to establish a baseline and check for anemia which could exacerbate ischemia. The mild leukocytosis seen is a common non-specific finding in stress or inflammation.",
            "**D-Dimer (Low Priority in this Case):** A D-dimer is used to help rule out clotting events like a PE. Given the classic STEMI presentation, it was not an essential first-line test here."
          ],
          "treatmentPriorityAndSequencing": [
            "**1. Immediate Medical Therapy:** Aspirin (325mg, chewed) should be given instantly to inhibit platelet aggregation. Oxygen should be administered only if the patient is hypoxic (SpO2 < 94%). Nitroglycerin can be given for pain, provided the patient is not hypotensive.",
            "**2. Urgent Reperfusion (Top Priority):** The single most important goal is to restore blood flow to the heart. This means activating the cardiac catheterization lab for an emergent Percutaneous Coronary Intervention (PCI) as quickly as possible.",
            "**3. Adjunctive Medications:** An additional antiplatelet agent (like clopidogrel or ticagrelor) and an anticoagulant (like heparin) are started to prevent further clot formation, typically in the ER or Cath Lab.",
            "**4. Pain Control:** If chest pain persists despite nitroglycerin, IV morphine can be used cautiously for its analgesic and anxiolytic effects."
          ],
          "whyOtherDiagnosesDidntFit": [
              {
                  "diagnosisName": "Pulmonary Embolism",
                  "reasoning": "While the patient was tachycardic and had chest pain, the pain was not pleuritic (worse with breathing) and the D-Dimer test was negative, making a large PE highly unlikely."
              },
              {
                  "diagnosisName": "Aortic Dissection",
                  "reasoning": "This was a key concern due to the severe pain and hypertension. However, the pain was not described as 'tearing' or 'ripping', there were no pulse deficits, and the Chest X-Ray showed a normal mediastinal width."
              },
              {
                  "diagnosisName": "Unstable Angina",
                  "reasoning": "This is essentially chest pain from ischemia without myocardial cell death. The significantly elevated Troponin level proves that infarction (cell death) occurred, ruling out simple unstable angina."
              },
              {
                  "diagnosisName": "Pericarditis",
                  "reasoning": "The ECG in pericarditis typically shows diffuse ST-elevation across most leads, not localized changes like those seen here. Additionally, the pain is often sharp, pleuritic, and relieved by sitting forward, which was not described."
              }
          ],
          "coreClinicalInsight": {
            "correctDiagnosis": "Acute ST-Elevation Myocardial Infarction (STEMI).",
            "keyClues": "Crushing substernal chest pain with radiation to the arm, diaphoresis, and significant cardiac risk factors (smoking, hypertension, family history).",
            "essentialTests": "A 12-Lead ECG showing ST-elevation and an elevated Troponin level are the cornerstone tests for confirming a STEMI.",
            "trapsToAvoid": [
                "Failing to get an ECG within 10 minutes of patient arrival.",
                "Mistaking classic cardiac pain for GERD or musculoskeletal issues.",
                "Forgetting to order a Chest X-ray to evaluate for mimics like Aortic Dissection.",
                "Delaying the activation of the cardiac catheterization lab once the diagnosis is made."
            ]
          }
        }
      }
    ]
  },
  {
    "caseId": "SLE001",
    "caseTitle": "28-Year-Old with Fatigue, Joint Pain, and Rash",
    "caseCategory": "Rheumatology",
    "steps": [
      {
        "stepNumber": 1,
        "stepTitle": "Initial Patient Presentation",
        "data": {
          "basicInfo": { "name": "Jane Doe", "age": 28, "gender": "Female", "occupation": "Graphic Designer" },
          "chiefComplaint": "Presents with a 3-month history of worsening fatigue, migratory joint pain, and a persistent facial rash.",
          "vitals": { "bloodPressure": "128/78 mmHg", "heartRate": "92 bpm", "respiratoryRate": "16 breaths/min", "temperature": "99.9°F (37.7°C)", "oxygenSaturation": "99% on room air" },
          "history": [
            { "category": "History of Present Illness", "detail": "Fatigue is debilitating, not improving with sleep. Joint pain affects hands, wrists, and knees; it is worse in the morning and moves between different joints. Facial rash appeared 2 months ago and worsens after sun exposure." },
            { "category": "Past Medical History", "detail": "No significant chronic illnesses. Reports occasional episodes of mouth sores." },
            { "category": "Medications", "detail": "Occasional ibuprofen for joint pain." },
            { "category": "Allergies", "detail": "NKDA (No Known Drug Allergies)." },
            { "category": "Social History", "detail": "Denies smoking. Drinks wine socially on weekends. Reports high stress at work." },
            { "category": "Family History", "detail": "Mother has an unspecified 'thyroid condition'." }
          ],
          "physicalExamination": [
            { "system": "General", "findings": "Appears tired but is alert and oriented. No acute distress." },
            { "system": "Skin", "findings": "Erythematous, maculopapular rash across the nasal bridge and cheeks, sparing the nasolabial folds (malar rash). Small, painless ulcer noted on the hard palate." },
            { "system": "Musculoskeletal", "findings": "Tenderness and mild swelling noted in the metacarpophalangeal (MCP) and proximal interphalangeal (PIP) joints of both hands. Full range of motion." },
            { "system": "Cardiovascular", "findings": "Regular rate and rhythm. No murmurs, rubs, or gallops." },
            { "system": "Respiratory", "findings": "Lungs are clear to auscultation bilaterally." },
            { "system": "Lymphatics", "findings": "Mild, non-tender cervical lymphadenopathy present." }
          ]
        }
      },
      {
        "stepNumber": 2,
        "stepTitle": "Order Diagnostic Tests",
        "data": {
          "availableTests": [
            { "testId": "lab005", "testName": "Antinuclear Antibody (ANA)", "category": "Laboratory", "isRelevant": true, "result": "Positive, Titer 1:640, speckled pattern", "impression": "High positive titer." },
            { "testId": "lab006", "testName": "Anti-dsDNA Antibody", "category": "Laboratory", "isRelevant": true, "result": "150 IU/mL (Ref: <30 IU/mL)", "impression": "Elevated." },
            { "testId": "lab007", "testName": "Anti-Smith (Anti-Sm) Antibody", "category": "Laboratory", "isRelevant": true, "result": "Positive", "impression": "Positive." },
            { "testId": "lab008", "testName": "Urinalysis with Microscopy", "category": "Laboratory", "isRelevant": true, "result": "Protein: 2+, Blood: 2+, RBCs: 10-20/hpf, RBC Casts: Present", "impression": "Proteinuria, hematuria, and RBC casts noted." },
            { "testId": "lab009", "testName": "Complete Blood Count (CBC)", "category": "Laboratory", "isRelevant": true, "result": "WBC: 3.8 x 10^9/L (Ref: 4.5-11.0), Hgb: 11.2 g/dL (Ref: 12.0-16.0), Plt: 140,000/μL (Ref: 150-450,000)", "impression": "Leukopenia, mild anemia, and mild thrombocytopenia noted." },
            { "testId": "lab010", "testName": "ESR and CRP", "category": "Laboratory", "isRelevant": true, "result": "ESR: 60 mm/hr (Ref: <20 mm/hr), CRP: 15 mg/L (Ref: <5 mg/L)", "impression": "Elevated." },
            { "testId": "lab011", "testName": "Rheumatoid Factor (RF)", "category": "Laboratory", "isRelevant": false, "result": "Negative", "impression": "Within normal limits." }
          ]
        }
      },
      {
        "stepNumber": 3,
        "stepTitle": "Select Diagnosis",
        "data": {
          "diagnosisOptions": [
            { "diagnosisId": "diag06", "diagnosisName": "Systemic Lupus Erythematosus (SLE)", "isCorrect": true },
            { "diagnosisId": "diag07", "diagnosisName": "Rheumatoid Arthritis", "isCorrect": false },
            { "diagnosisId": "diag08", "diagnosisName": "Rosacea", "isCorrect": false },
            { "diagnosisId": "diag09", "diagnosisName": "Fibromyalgia", "isCorrect": false },
            { "diagnosisId": "diag10", "diagnosisName": "Undifferentiated Connective Tissue Disease", "isCorrect": false }
          ]
        }
      },
      {
        "stepNumber": 4,
        "stepTitle": "Provide Treatment",
        "data": {
          "treatmentOptions": {
            "medications": [
              { "treatmentId": "med06", "treatmentName": "Start Hydroxychloroquine", "isCorrect": true },
              { "treatmentId": "med07", "treatmentName": "Start low-dose Prednisone taper", "isCorrect": true },
              { "treatmentId": "med08", "treatmentName": "Prescribe Naproxen for joint pain as needed", "isCorrect": true },
              { "treatmentId": "med09", "treatmentName": "Prescribe Doxycycline for the rash", "isCorrect": false }
            ],
            "surgicalInterventional": [],
            "nonSurgical": [
              { "treatmentId": "nonsurg03", "treatmentName": "Counsel on strict sun protection and avoidance", "isCorrect": true },
              { "treatmentId": "nonsurg04", "treatmentName": "Referral to Rheumatology", "isCorrect": true },
              { "treatmentId": "nonsurg05", "treatmentName": "Referral to Nephrology", "isCorrect": true }
            ],
            "psychiatric": []
          }
        }
      },
      {
        "stepNumber": 5,
        "stepTitle": "Case Review",
        "data": {
          "howWeLandedOnTheDiagnosis": [
            "**Constitutional and Systemic Symptoms:** The case began with a classic triad of fatigue, polyarthritis, and a skin rash in a young female, raising high suspicion for a systemic autoimmune disease.",
            "**Characteristic Physical Findings:** The presence of a photosensitive malar ('butterfly') rash, oral ulcers, and inflammatory arthritis are all key clinical criteria for SLE.",
            "**Conclusive Serological Markers:** A high-titer positive ANA confirmed autoimmunity. The presence of highly specific antibodies—Anti-dsDNA and Anti-Smith—clinched the diagnosis of SLE.",
            "**Evidence of Organ Involvement:** The diagnosis was further solidified by laboratory findings showing systemic impact: hematologic (anemia, leukopenia, thrombocytopenia) and renal (proteinuria and active sediment on urinalysis, indicating lupus nephritis)."
          ],
          "rationaleBehindTestSelection": [
            "**ANA (Screening Test):** This is the best initial test when suspecting a systemic autoimmune disease due to its high sensitivity for SLE. A negative ANA makes lupus very unlikely.",
            "**Anti-dsDNA and Anti-Sm (Confirmatory Tests):** These tests were ordered after the positive ANA because they are highly specific for SLE and help confirm the diagnosis.",
            "**Urinalysis (Organ Screening):** Essential in any new lupus diagnosis to screen for kidney involvement (lupus nephritis), which is common and can be silent but serious.",
            "**CBC (Organ Screening):** Ordered to check for cytopenias (low blood counts), which are part of the diagnostic criteria and indicate systemic inflammation.",
            "**Rheumatoid Factor (Rule-Out Test):** Ordered to help differentiate from Rheumatoid Arthritis, another common cause of inflammatory arthritis."
          ],
          "treatmentPriorityAndSequencing": [
            "**1. Control Inflammation:** Start a low-dose oral steroid like Prednisone to quickly manage the debilitating arthritis and skin manifestations and to begin treating the nephritis.",
            "**2. Start Foundational Therapy:** Initiate Hydroxychloroquine immediately. It is the cornerstone of long-term SLE management, proven to reduce flares, prevent organ damage, and improve survival.",
            "**3. Establish Specialty Care:** Urgent referrals to Rheumatology (for primary disease management) and Nephrology (to manage the lupus nephritis) are critical.",
            "**4. Patient Education:** Counsel the patient on strict sun protection, as UV light is a major trigger for both skin and systemic flares."
          ],
          "whyOtherDiagnosesDidntFit": [
              {
                  "diagnosisName": "Rheumatoid Arthritis",
                  "reasoning": "While there is inflammatory arthritis, RA typically does not cause a malar rash, oral ulcers, significant cytopenias, or nephritis. Furthermore, the RF was negative and SLE-specific antibodies (dsDNA, Sm) were positive."
              },
              {
                  "diagnosisName": "Rosacea",
                  "reasoning": "Rosacea can mimic the malar rash but is a skin-only condition. It does not explain the arthritis, fatigue, oral ulcers, or any of the abnormal lab findings."
              },
              {
                  "diagnosisName": "Fibromyalgia",
                  "reasoning": "Fibromyalgia causes chronic fatigue and pain but is a non-inflammatory condition. It would not result in an objective rash, arthritis with swelling, or the host of positive labs (autoantibodies, nephritis, cytopenias)."
              },
              {
                  "diagnosisName": "Undifferentiated Connective Tissue Disease",
                  "reasoning": "This diagnosis is used when a patient has features of an autoimmune disease but does not meet the full criteria for a specific one. This patient met multiple, clear criteria for SLE, including the highly specific antibodies, making the diagnosis definitive."
              }
          ],
          "coreClinicalInsight": {
            "correctDiagnosis": "Systemic Lupus Erythematosus (SLE) with active nephritis.",
            "keyClues": "A young female with a constellation of symptoms: constitutional (fatigue), mucocutaneous (malar rash, oral ulcers), and musculoskeletal (inflammatory arthritis).",
            "essentialTests": "ANA as a screening test, followed by specific confirmatory antibodies (Anti-dsDNA, Anti-Smith), and a urinalysis to screen for kidney involvement.",
            "trapsToAvoid": [
                "Dismissing the fatigue and joint pain as 'just stress' in a young woman.",
                "Confusing the malar rash with simple sunburn or a cosmetic issue like rosacea.",
                "Forgetting to perform a urinalysis, thereby missing silent but serious lupus nephritis.",
                "Failing to initiate foundational therapy like Hydroxychloroquine early in the disease course."
            ]
          }
        }
      }
    ]
  },
  {
    "caseId": "RA001",
    "caseTitle": "45-Year-Old with Painful, Swollen Hands",
    "caseCategory": "Rheumatology",
    "steps": [
      {
        "stepNumber": 1,
        "stepTitle": "Initial Patient Presentation",
        "data": {
          "basicInfo": { "name": "Susan Miller", "age": 45, "gender": "Female", "occupation": "Teacher" },
          "chiefComplaint": "Presents with a 6-month history of progressive pain and swelling in her hands and wrists, with significant morning stiffness.",
          "vitals": { "bloodPressure": "122/76 mmHg", "heartRate": "84 bpm", "respiratoryRate": "16 breaths/min", "temperature": "99.1°F (37.3°C)", "oxygenSaturation": "98% on room air" },
          "history": [
            { "category": "History of Present Illness", "detail": "Pain is symmetrical, affecting both hands, wrists, and feet. Morning stiffness is profound, lasting about 2 hours, making it difficult to write on the board. Symptoms improve with activity during the day. Also reports significant fatigue and a feeling of general malaise." },
            { "category": "Past Medical History", "detail": "Hypothyroidism, well-controlled on levothyroxine." },
            { "category": "Medications", "detail": "Levothyroxine 75 mcg daily, Ibuprofen 400-600mg as needed for pain." },
            { "category": "Allergies", "detail": "Penicillin (causes a rash)." },
            { "category": "Social History", "detail": "Non-smoker, drinks one glass of wine per week." },
            { "category": "Family History", "detail": "Maternal aunt was diagnosed with Rheumatoid Arthritis." }
          ],
          "physicalExamination": [
            { "system": "General", "findings": "Appears fatigued but is in no acute distress." },
            { "system": "Musculoskeletal", "findings": "Symmetrical, soft, 'boggy' swelling and tenderness noted over the metacarpophalangeal (MCP) and proximal interphalangeal (PIP) joints of both hands. Wrists are also swollen and tender. Distal interphalangeal (DIP) joints are spared. Grip strength is reduced bilaterally." },
            { "system": "Skin", "findings": "No rashes or psoriasis. A single, firm, non-tender subcutaneous nodule is noted over the extensor surface of the left elbow." },
            { "system": "Cardiovascular", "findings": "Regular rate and rhythm. Clear S1/S2." },
            { "system": "Respiratory", "findings": "Lungs clear to auscultation." }
          ]
        }
      },
      {
        "stepNumber": 2,
        "stepTitle": "Order Diagnostic Tests",
        "data": {
          "availableTests": [
            { "testId": "lab012", "testName": "Rheumatoid Factor (RF)", "category": "Laboratory", "isRelevant": true, "result": "Positive, Titer 1:128 (Ref: <1:20)", "impression": "High positive titer." },
            { "testId": "lab013", "testName": "Anti-CCP Antibody", "category": "Laboratory", "isRelevant": true, "result": "250 U/mL (Ref: <20 U/mL)", "impression": "Significantly elevated." },
            { "testId": "lab014", "testName": "ESR and CRP", "category": "Laboratory", "isRelevant": true, "result": "ESR: 75 mm/hr (Ref: <20 mm/hr), CRP: 45 mg/L (Ref: <5 mg/L)", "impression": "Significantly elevated." },
            { "testId": "lab015", "testName": "Complete Blood Count (CBC)", "category": "Laboratory", "isRelevant": true, "result": "WBC: 8.5 x 10^9/L (Ref: 4.5-11.0), Hgb: 10.8 g/dL (Ref: 12.0-16.0), Plt: 480,000/μL (Ref: 150-450,000)", "impression": "Mild normocytic anemia and thrombocytosis noted." },
            { "testId": "img004", "testName": "X-Ray of Hands and Wrists", "category": "Imaging", "isRelevant": true, "result": "Soft tissue swelling around MCP and wrist joints. Subtle juxta-articular erosions are noted in the MCP joints.", "impression": "Findings consistent with early inflammatory arthritis." },
            { "testId": "lab016", "testName": "Antinuclear Antibody (ANA)", "category": "Laboratory", "isRelevant": false, "result": "Negative", "impression": "Within normal limits." },
            { "testId": "lab017", "testName": "Uric Acid", "category": "Laboratory", "isRelevant": false, "result": "4.5 mg/dL (Ref: 2.4-6.0 mg/dL)", "impression": "Within normal limits." }
          ]
        }
      },
      {
        "stepNumber": 3,
        "stepTitle": "Select Diagnosis",
        "data": {
          "diagnosisOptions": [
            { "diagnosisId": "diag11", "diagnosisName": "Rheumatoid Arthritis (RA)", "isCorrect": true },
            { "diagnosisId": "diag12", "diagnosisName": "Osteoarthritis", "isCorrect": false },
            { "diagnosisId": "diag13", "diagnosisName": "Systemic Lupus Erythematosus (SLE)", "isCorrect": false },
            { "diagnosisId": "diag14", "diagnosisName": "Gout", "isCorrect": false },
            { "diagnosisId": "diag15", "diagnosisName": "Psoriatic Arthritis", "isCorrect": false }
          ]
        }
      },
      {
        "stepNumber": 4,
        "stepTitle": "Provide Treatment",
        "data": {
          "treatmentOptions": {
            "medications": [
              { "treatmentId": "med10", "treatmentName": "Start Methotrexate", "isCorrect": true },
              { "treatmentId": "med11", "treatmentName": "Start a short course 'bridge' of low-dose Prednisone", "isCorrect": true },
              { "treatmentId": "med12", "treatmentName": "Continue scheduled NSAID for symptom control", "isCorrect": true },
              { "treatmentId": "med13", "treatmentName": "Start Allopurinol", "isCorrect": false }
            ],
            "surgicalInterventional": [],
            "nonSurgical": [
              { "treatmentId": "nonsurg06", "treatmentName": "Referral to Rheumatology", "isCorrect": true },
              { "treatmentId": "nonsurg07", "treatmentName": "Referral to Physical and Occupational Therapy", "isCorrect": true }
            ],
            "psychiatric": []
          }
        }
      },
      {
        "stepNumber": 5,
        "stepTitle": "Case Review",
        "data": {
          "howWeLandedOnTheDiagnosis": [
            "**Clinical Presentation:** The diagnosis was strongly suggested by the patient's history of a symmetrical, inflammatory polyarthritis affecting small joints (hands, wrists) and characterized by prolonged morning stiffness (>1 hour).",
            "**Key Physical Exam Findings:** Examination confirmed inflammation with 'boggy' swelling of the MCP and PIP joints, sparing of the DIP joints, and the presence of a rheumatoid nodule—all classic signs of RA.",
            "**Specific Serological Confirmation:** High levels of inflammatory markers (ESR/CRP) confirmed an active inflammatory process. The diagnosis was sealed by positive serology for both Rheumatoid Factor and, more importantly, the highly specific Anti-CCP antibody.",
            "**Radiographic Evidence:** X-rays provided objective evidence of joint damage (erosions), confirming the destructive potential of the disease process."
          ],
          "rationaleBehindTestSelection": [
            "**Anti-CCP Antibody (Most Specific Test):** This is the most specific blood test for RA. A high positive result is nearly diagnostic in the right clinical context.",
            "**Rheumatoid Factor (Supportive Test):** While less specific than Anti-CCP, a high RF titer strongly supports the diagnosis.",
            "**ESR/CRP (Inflammation Markers):** These tests are crucial to confirm the inflammatory nature of the arthritis and are useful for monitoring disease activity over time.",
            "**Hand X-Rays (Damage Assessment):** Essential for establishing a baseline of joint damage and for identifying erosions, which are a hallmark of RA.",
            "**ANA (Rule-Out Test):** A negative ANA helps differentiate RA from other autoimmune conditions like SLE, which can also present with arthritis."
          ],
          "treatmentPriorityAndSequencing": [
            "**1. Start a DMARD (Highest Priority):** Initiating Methotrexate promptly is the most critical step to slow disease progression and prevent irreversible joint destruction.",
            "**2. Bridge with Steroids:** A short course of low-dose Prednisone is used to rapidly control inflammation and relieve symptoms while waiting for the Methotrexate (which takes several weeks) to become fully effective.",
            "**3. Symptom Management:** NSAIDs can be used as needed for pain and stiffness that is not fully controlled by the DMARD and steroid bridge.",
            "**4. Establish Multidisciplinary Care:** An immediate referral to a Rheumatologist is mandatory for long-term management. Referrals to physical and occupational therapy are vital to preserve joint function and teach joint protection strategies."
          ],
          "whyOtherDiagnosesDidntFit": [
              {
                  "diagnosisName": "Osteoarthritis",
                  "reasoning": "OA is a degenerative, not inflammatory, disease. It typically affects DIP and weight-bearing joints, has minimal morning stiffness (<30 mins), and would not have elevated ESR/CRP or positive autoantibodies."
              },
              {
                  "diagnosisName": "Systemic Lupus Erythematosus (SLE)",
                  "reasoning": "While SLE can cause arthritis, it is typically non-erosive. This patient lacked other SLE features (malar rash, nephritis, photosensitivity) and had a negative ANA, but a strongly positive Anti-CCP, which is specific to RA."
              },
              {
                  "diagnosisName": "Gout",
                  "reasoning": "Gout typically presents as a very acute, painful, monoarticular arthritis (often in the big toe), not a chronic, symmetrical polyarthritis. Uric acid levels were also normal."
              },
              {
                  "diagnosisName": "Psoriatic Arthritis",
                  "reasoning": "This can cause a symmetrical polyarthritis but often involves the DIP joints ('sausage digits') and is associated with psoriasis of the skin or nails, none of which were present here."
              }
          ],
          "coreClinicalInsight": {
            "correctDiagnosis": "Seropositive Rheumatoid Arthritis.",
            "keyClues": "A chronic, symmetrical, inflammatory polyarthritis of the small joints of the hands and feet, with morning stiffness lasting over an hour.",
            "essentialTests": "Anti-CCP antibody (most specific), Rheumatoid Factor, and inflammatory markers (ESR/CRP).",
            "trapsToAvoid": [
                "Dismissing early symptoms as 'aches and pains' of aging.",
                "Confusing RA with Osteoarthritis, leading to a critical delay in treatment.",
                "Relying solely on Rheumatoid Factor, which can be negative in some RA patients and positive in other conditions.",
                "Delaying the start of a DMARD like Methotrexate, which can lead to permanent joint deformity and disability."
            ]
          }
        }
      }
    ]
  },
  {
    "caseId": "LYME001",
    "caseTitle": "34-Year-Old Hiker with Fever, Aches, and a Rash",
    "caseCategory": "Infectious Disease",
    "steps": [
      {
        "stepNumber": 1,
        "stepTitle": "Initial Patient Presentation",
        "data": {
          "basicInfo": { "name": "Mark Robinson", "age": 34, "gender": "Male", "occupation": "Software Engineer" },
          "chiefComplaint": "Presents with one week of fatigue, muscle aches, headache, and a large, expanding rash on his back.",
          "vitals": { "bloodPressure": "118/72 mmHg", "heartRate": "88 bpm", "respiratoryRate": "14 breaths/min", "temperature": "100.8°F (38.2°C)", "oxygenSaturation": "99% on room air" },
          "history": [
            { "category": "History of Present Illness", "detail": "Felt well until about a week ago. Symptoms began with overwhelming fatigue and diffuse muscle/joint aches. Developed a headache and low-grade fevers. Two days ago, his wife noticed a large, non-painful, non-itchy rash on his back that has been slowly getting bigger." },
            { "category": "Past Medical History", "detail": "None." },
            { "category": "Medications", "detail": "None." },
            { "category": "Allergies", "detail": "NKDA (No Known Drug Allergies)." },
            { "category": "Social History", "detail": "Non-smoker, social drinker. Avid hiker. Went on a week-long camping trip in rural Connecticut three weeks ago. Does not recall a specific tick bite but often finds ticks on his clothes after hiking." },
            { "category": "Family History", "detail": "Non-contributory." }
          ],
          "physicalExamination": [
            { "system": "General", "findings": "Appears fatigued and mildly ill but is non-toxic." },
            { "system": "Skin", "findings": "On the left upper back, there is a 15 cm annular, erythematous patch with distinct borders and prominent central clearing. The area is flat, not tender, and warm to the touch." },
            { "system": "Neurologic", "findings": "Alert and oriented x3. Mild nuchal rigidity noted on neck flexion. No focal deficits." },
            { "system": "Lymphatics", "findings": "Mild, tender posterior cervical and axillary lymphadenopathy." },
            { "system": "Musculoskeletal", "findings": "No joint swelling or effusion. Diffuse tenderness to palpation of thigh and shoulder muscles." }
          ]
        }
      },
      {
        "stepNumber": 2,
        "stepTitle": "Order Diagnostic Tests",
        "data": {
          "availableTests": [
            { "testId": "lab018", "testName": "Lyme Disease Antibodies, EIA", "category": "Laboratory", "isRelevant": true, "result": "Positive", "impression": "Positive." },
            { "testId": "lab019", "testName": "Lyme Disease Western Blot", "category": "Laboratory", "isRelevant": true, "result": "IgM: Positive (3 bands), IgG: Negative", "impression": "Confirmatory for acute infection." },
            { "testId": "lab020", "testName": "Complete Blood Count (CBC)", "category": "Laboratory", "isRelevant": true, "result": "WBC: 9.8 x 10^9/L, Hgb: 14.5 g/dL, Plt: 145,000/μL", "impression": "Mild thrombocytopenia noted. Otherwise normal." },
            { "testId": "lab021", "testName": "Monospot Test", "category": "Laboratory", "isRelevant": false, "result": "Negative", "impression": "Negative." },
            { "testId": "lab022", "testName": "Blood Culture", "category": "Laboratory", "isRelevant": false, "result": "No growth after 48 hours", "impression": "Negative." }
          ]
        }
      },
      {
        "stepNumber": 3,
        "stepTitle": "Select Diagnosis",
        "data": {
          "diagnosisOptions": [
            { "diagnosisId": "diag16", "diagnosisName": "Lyme Disease (Early Localized)", "isCorrect": true },
            { "diagnosisId": "diag17", "diagnosisName": "Cellulitis", "isCorrect": false },
            { "diagnosisId": "diag18", "diagnosisName": "Infectious Mononucleosis", "isCorrect": false },
            { "diagnosisId": "diag19", "diagnosisName": "Tinea Corporis (Ringworm)", "isCorrect": false },
            { "diagnosisId": "diag20", "diagnosisName": "Viral Exanthem", "isCorrect": false }
          ]
        }
      },
      {
        "stepNumber": 4,
        "stepTitle": "Provide Treatment",
        "data": {
          "treatmentOptions": {
            "medications": [
              { "treatmentId": "med14", "treatmentName": "Start Doxycycline 100mg twice daily for 14 days", "isCorrect": true },
              { "treatmentId": "med15", "treatmentName": "Prescribe Acetaminophen for fever and myalgias", "isCorrect": true },
              { "treatmentId": "med16", "treatmentName": "Prescribe a topical antifungal cream for the rash", "isCorrect": false },
              { "treatmentId": "med17", "treatmentName": "Start Cephalexin for presumed skin infection", "isCorrect": false }
            ],
            "surgicalInterventional": [],
            "nonSurgical": [
              { "treatmentId": "nonsurg08", "treatmentName": "Counsel on tick bite prevention (insect repellent, clothing)", "isCorrect": true }
            ],
            "psychiatric": []
          }
        }
      },
      {
        "stepNumber": 5,
        "stepTitle": "Case Review",
        "data": {
          "howWeLandedOnTheDiagnosis": [
            "**Epidemiological Link:** The most important initial clue was the patient's history of hiking in an endemic area (Connecticut) within the typical incubation period (3 weeks prior).",
            "**Pathognomonic Rash:** The physical exam revealed a classic Erythema Migrans or 'bull's-eye' rash. This finding is virtually diagnostic for Lyme disease and is the single most important clinical sign.",
            "**Associated Symptoms:** The constitutional symptoms of fever, fatigue, myalgias, and headache are all classic for early disseminated Lyme infection.",
            "**Serological Confirmation:** While treatment can be started based on the rash alone, the two-tiered antibody testing (positive EIA confirmed by a positive IgM Western Blot) definitively confirmed an acute infection with *Borrelia burgdorferi*."
          ],
          "rationaleBehindTestSelection": [
            "**Lyme Serology (Two-Tiered):** This is the standard diagnostic algorithm. The EIA is a sensitive screening test, and the Western Blot is a specific confirmatory test to prevent false positives.",
            "**CBC (Supportive):** Checked to assess for hematologic abnormalities. The mild thrombocytopenia is a non-specific but common finding in tick-borne illnesses.",
            "**Monospot Test (Rule-Out):** Infectious mononucleosis can cause fever, fatigue, and lymphadenopathy, making it an important mimic to rule out in a young adult with these symptoms.",
            "**Blood Culture (Rule-Out):** Performed to rule out bacteremia as a cause for the fever, although this was low suspicion given the subacute onset and rash."
          ],
          "treatmentPriorityAndSequencing": [
            "**1. Immediate Antibiotic Therapy:** The highest priority is starting Doxycycline without delay. Early treatment is highly effective and is the key to preventing the progression to late-stage complications like carditis, arthritis, and neurological Lyme disease.",
            "**2. Symptomatic Care:** Antipyretics like Acetaminophen can be used to manage the fever and myalgias, improving patient comfort.",
            "**3. Patient Education:** Counseling on tick bite prevention is a crucial secondary step to prevent future infections."
          ],
          "whyOtherDiagnosesDidntFit": [
              {
                  "diagnosisName": "Cellulitis",
                  "reasoning": "Cellulitis is a bacterial skin infection that presents as a diffuse, tender, hot, erythematous area without the central clearing or organized annular shape seen in Erythema Migrans."
              },
              {
                  "diagnosisName": "Infectious Mononucleosis",
                  "reasoning": "While mono causes similar constitutional symptoms (fever, fatigue), it does not cause an Erythema Migrans rash, and the Monospot test was negative."
              },
              {
                  "diagnosisName": "Tinea Corporis (Ringworm)",
                  "reasoning": "Ringworm is a fungal infection that can cause an annular rash, but it is typically smaller, scaly, and itchy—features that were absent in this patient's rash."
              },
              {
                  "diagnosisName": "Viral Exanthem",
                  "reasoning": "A non-specific viral rash is possible, but it is unlikely to form a single, large, organized lesion with central clearing like the one observed. It would not explain the positive Lyme serology."
              }
          ],
          "coreClinicalInsight": {
            "correctDiagnosis": "Early Localized Lyme Disease.",
            "keyClues": "A history of potential exposure in an endemic area combined with the pathognomonic Erythema Migrans ('bull's-eye') rash.",
            "essentialTests": "The two-tiered serological testing (EIA followed by Western Blot) is the standard for laboratory confirmation.",
            "trapsToAvoid": [
                "Dismissing the rash as a 'spider bite' or 'ringworm'.",
                "Relying on the patient's memory of a tick bite (less than 50% of patients recall one).",
                "Waiting for serology results before treating if a classic Erythema Migrans rash is present.",
                "Ordering only a Western Blot without a preceding EIA screen, which is an improper use of the test."
            ]
          }
        }
      }
    ]
  },
  {
    "caseId": "CKD001",
    "caseTitle": "65-Year-Old with Worsening Fatigue and Swollen Legs",
    "caseCategory": "Nephrology",
    "steps": [
      {
        "stepNumber": 1,
        "stepTitle": "Initial Patient Presentation",
        "data": {
          "basicInfo": { "name": "Robert Davis", "age": 65, "gender": "Male", "occupation": "Retired Accountant" },
          "chiefComplaint": "Presents with a 6-month history of progressive fatigue, decreased exercise tolerance, and worsening bilateral leg swelling.",
          "vitals": { "bloodPressure": "158/92 mmHg", "heartRate": "80 bpm", "respiratoryRate": "18 breaths/min", "temperature": "98.6°F (37.0°C)", "oxygenSaturation": "96% on room air" },
          "history": [
            { "category": "History of Present Illness", "detail": "Fatigue has become constant, no longer feels rested after sleep. Leg swelling is pitting, starting in the ankles and now up to the mid-shins by the end of the day. Has had to reduce his daily walks due to shortness of breath on exertion. Reports occasional 'foamy' urine." },
            { "category": "Past Medical History", "detail": "Type 2 Diabetes Mellitus for 15 years (last A1c was 8.2%), Hypertension for 20 years. Benign Prostatic Hyperplasia (BPH)." },
            { "category": "Medications", "detail": "Metformin 1000mg BID, Glipizide 5mg daily, Amlodipine 10mg daily, Tamsulosin 0.4mg daily. Takes over-the-counter naproxen for knee arthritis frequently." },
            { "category": "Allergies", "detail": "NKDA (No Known Drug Allergies)." },
            { "category": "Social History", "detail": "Former smoker, quit 10 years ago (20-pack-year history). Occasional alcohol." },
            { "category": "Family History", "detail": "Father had a stroke at age 70. Mother had diabetes." }
          ],
          "physicalExamination": [
            { "system": "General", "findings": "Appears tired, pale conjunctiva noted. No acute distress." },
            { "system": "Cardiovascular", "findings": "Regular rate and rhythm. A soft S4 gallop is audible. Jugular venous pressure is normal." },
            { "system": "Respiratory", "findings": "Lungs have faint bibasilar crackles that do not clear with coughing." },
            { "system": "Abdominal", "findings": "Soft, non-tender, no organomegaly." },
            { "system": "Extremities", "findings": "2+ bilateral pitting edema up to the mid-shins. Pulses are 2+ and symmetric." }
          ]
        }
      },
      {
        "stepNumber": 2,
        "stepTitle": "Order Diagnostic Tests",
        "data": {
          "availableTests": [
            { "testId": "lab023", "testName": "Comprehensive Metabolic Panel (CMP)", "category": "Laboratory", "isRelevant": true, "result": "Na: 138, K: 5.2, Cl: 105, CO2: 18, BUN: 45 mg/dL, Creatinine: 2.5 mg/dL, Glucose: 180 mg/dL", "impression": "Elevated BUN and Creatinine. Hyperkalemia and low CO2 (metabolic acidosis) noted." },
            { "testId": "lab024", "testName": "Estimated GFR (eGFR)", "category": "Laboratory", "isRelevant": true, "result": "28 mL/min/1.73m²", "impression": "Severely decreased, consistent with CKD Stage 4." },
            { "testId": "lab025", "testName": "Urinalysis with Microscopy", "category": "Laboratory", "isRelevant": true, "result": "Specific Gravity: 1.010, Protein: 3+, Blood: Negative, Casts: Broad, waxy casts noted.", "impression": "Significant proteinuria. Broad waxy casts suggest advanced kidney disease." },
            { "testId": "lab026", "testName": "Urine Albumin-to-Creatinine Ratio (UACR)", "category": "Laboratory", "isRelevant": true, "result": "800 mg/g (Ref: <30 mg/g)", "impression": "Severely increased albuminuria (A3 category)." },
            { "testId": "lab027", "testName": "Complete Blood Count (CBC)", "category": "Laboratory", "isRelevant": true, "result": "WBC: 7.0 x 10^9/L, Hgb: 9.8 g/dL, Hct: 29%, MCV: 88 fL, Plt: 210,000/μL", "impression": "Normocytic, normochromic anemia." },
            { "testId": "img005", "testName": "Renal Ultrasound", "category": "Imaging", "isRelevant": true, "result": "Kidneys are symmetric but small (8.5 cm bilaterally). Increased cortical echogenicity with cortical thinning. No evidence of hydronephrosis.", "impression": "Findings are consistent with chronic, irreversible kidney disease." },
            { "testId": "lab028", "testName": "BNP (B-type Natriuretic Peptide)", "category": "Laboratory", "isRelevant": false, "result": "250 pg/mL (Ref: <100 pg/mL)", "impression": "Mildly elevated (Note: BNP can be elevated due to CKD itself)." }
          ]
        }
      },
      {
        "stepNumber": 3,
        "stepTitle": "Select Diagnosis",
        "data": {
          "diagnosisOptions": [
            { "diagnosisId": "diag21", "diagnosisName": "Chronic Kidney Disease (CKD), Stage 4", "isCorrect": true },
            { "diagnosisId": "diag22", "diagnosisName": "Acute Kidney Injury (AKI)", "isCorrect": false },
            { "diagnosisId": "diag23", "diagnosisName": "Congestive Heart Failure (CHF)", "isCorrect": false },
            { "diagnosisId": "diag24", "diagnosisName": "Nephrotic Syndrome", "isCorrect": false },
            { "diagnosisId": "diag25", "diagnosisName": "Anemia of Unknown Origin", "isCorrect": false }
          ]
        }
      },
      {
        "stepNumber": 4,
        "stepTitle": "Provide Treatment",
        "data": {
          "treatmentOptions": {
            "medications": [
              { "treatmentId": "med18", "treatmentName": "Start an ACE inhibitor (e.g., Lisinopril)", "isCorrect": true },
              { "treatmentId": "med19", "treatmentName": "Start an SGLT2 inhibitor (e.g., Dapagliflozin)", "isCorrect": true },
              { "treatmentId": "med20", "treatmentName": "Discontinue Naproxen immediately", "isCorrect": true },
              { "treatmentId": "med21", "treatmentName": "Start a loop diuretic (e.g., Furosemide) for edema", "isCorrect": true },
              { "treatmentId": "med22", "treatmentName": "Prescribe high-dose IV Iron", "isCorrect": false }
            ],
            "surgicalInterventional": [],
            "nonSurgical": [
              { "treatmentId": "nonsurg09", "treatmentName": "Referral to Nephrology", "isCorrect": true },
              { "treatmentId": "nonsurg10", "treatmentName": "Referral to a Dietitian for a low-sodium, low-potassium diet", "isCorrect": true },
              { "treatmentId": "nonsurg11", "treatmentName": "Counsel on strict blood pressure and glucose control goals", "isCorrect": true }
            ],
            "psychiatric": []
          }
        }
      },
      {
        "stepNumber": 5,
        "stepTitle": "Case Review",
        "data": {
          "howWeLandedOnTheDiagnosis": [
            "**Insidious Onset with Risk Factors:** The diagnosis was suspected based on a gradual decline in a patient with major risk factors: long-standing diabetes and hypertension.",
            "**Key Laboratory Abnormalities:** The severely reduced eGFR (<30) and high creatinine, stable over time (implied chronicity), were the primary indicators. The presence of severe albuminuria (UACR >300) confirmed significant kidney damage.",
            "**Evidence of End-Organ Impact:** The diagnosis was supported by complications of CKD, including normocytic anemia (from reduced erythropoietin production) and metabolic acidosis (from impaired acid excretion).",
            "**Confirmatory Imaging:** The renal ultrasound showing small, echogenic kidneys is the definitive sign of a chronic, irreversible process, effectively ruling out an acute kidney injury."
          ],
          "rationaleBehindTestSelection": [
            "**CMP / eGFR (Cornerstone of Diagnosis):** These tests directly measure kidney function (filtration). A persistently low eGFR for >3 months is the definition of CKD.",
            "**UACR (Damage Marker):** Quantifying albuminuria is essential for staging CKD and guiding therapy. It is a powerful predictor of disease progression.",
            "**Renal Ultrasound (Chronicity Marker):** This is the best tool to distinguish chronic from acute kidney disease. Small, scarred kidneys confirm a long-standing process.",
            "**CBC (Complication Screening):** Anemia is one of the most common and earliest systemic complications of CKD, and its presence supports the diagnosis.",
            "**BNP (Rule-Out Test):** While the patient has signs of fluid overload, it's important to assess if it's primarily from heart failure. In this case, the severe kidney markers make CKD the primary driver, though some degree of heart failure may coexist."
          ],
          "treatmentPriorityAndSequencing": [
            "**1. Remove Offending Agents:** The absolute first step is to stop all nephrotoxic medications, especially the patient's daily NSAID (Naproxen).",
            "**2. Manage Complications & Slow Progression:** Start an ACE inhibitor or ARB to control blood pressure and reduce proteinuria. Start an SGLT2 inhibitor, which is now a foundational therapy for diabetic kidney disease. Manage volume overload with a loop diuretic.",
            "**3. Establish Specialty Care:** An immediate referral to Nephrology is required for Stage 4 CKD to manage complications and begin planning for future renal replacement therapy (dialysis/transplant).",
            "**4. Dietary and Lifestyle Modification:** A dietitian referral for a renal-specific diet and counseling on strict BP/glucose control are critical long-term interventions."
          ],
          "whyOtherDiagnosesDidntFit": [
              {
                  "diagnosisName": "Acute Kidney Injury (AKI)",
                  "reasoning": "The 6-month timeline of symptoms and the ultrasound findings of small, scarred kidneys are inconsistent with an acute process."
              },
              {
                  "diagnosisName": "Congestive Heart Failure (CHF)",
                  "reasoning": "While the patient has edema, CHF alone does not cause severe albuminuria, waxy casts, or the characteristic ultrasound findings of chronic parenchymal damage. The primary problem is renal."
              },
              {
                  "diagnosisName": "Nephrotic Syndrome",
                  "reasoning": "Nephrotic syndrome is a specific condition defined by very heavy proteinuria (>3.5g/day), hypoalbuminemia, and edema. While this patient has significant proteinuria, CKD is the broader, more encompassing diagnosis describing the long-term loss of kidney function from diabetes and hypertension."
              },
              {
                  "diagnosisName": "Anemia of Unknown Origin",
                  "reasoning": "The anemia is not of 'unknown' origin. It is a predictable complication of severe CKD, caused by the kidneys' inability to produce enough erythropoietin. It is a symptom of the disease, not the primary diagnosis."
              }
          ],
          "coreClinicalInsight": {
            "correctDiagnosis": "Chronic Kidney Disease (Stage 4, A3) secondary to Diabetic and Hypertensive Nephropathy.",
            "keyClues": "A patient with long-standing diabetes/hypertension presenting with insidious fatigue, edema, and anemia.",
            "essentialTests": "eGFR to measure function, UACR to measure damage, and a Renal Ultrasound to assess for chronicity.",
            "trapsToAvoid": [
                "Attributing fatigue and edema solely to 'old age' or heart failure without checking kidney function.",
                "Forgetting to check a UACR in all patients with diabetes, as it's an early sign of kidney damage.",
                "Overlooking a patient's over-the-counter NSAID use, which is a major contributor to CKD progression.",
                "Failing to refer to nephrology in a timely manner (generally when eGFR < 30)."
            ]
          }
        }
      }
    ]
  }
]


export { API_BASE, CASES_ARRAY };
