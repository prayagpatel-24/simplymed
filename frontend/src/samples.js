// Made-up examples only. Never put real patient information in this project.
// "age" fills in the age box when the example is picked (null leaves it empty).
export const SAMPLE_GROUPS = ['Prescription labels', 'Hospital and ER discharge', 'Complex cases']

export const SAMPLES = [
  // ---------- Prescription labels ----------
  {
    group: 'Prescription labels',
    label: 'Child’s antibiotic (amoxicillin liquid)',
    age: null,
    text: `Amoxicillin 400 mg/5 mL suspension. Give 5 mL by mouth every 12 hours for 10 days. Shake well before each use. Keep refrigerated. Use the dosing syringe, not a kitchen spoon. Discard any leftover medicine.`,
  },
  {
    group: 'Prescription labels',
    label: 'Blood pressure (lisinopril), age 72',
    age: 72,
    text: `Diagnosis: High blood pressure/hypertension
LISINOPRIL 10 MG TAB
Sig: 1 tab PO daily. Take at same time each day.
Qty: 30
RF: 2`,
  },
  {
    group: 'Prescription labels',
    label: 'Skin infection (cephalexin liquid), age 13',
    age: 13,
    text: `Diagnosis: Bacterial skin infection/cellulitis
CEPHALEXIN 250 MG/5ML SUSP
Sig: 10 mL PO TID x 7 days. Shake well. Measure doses with oral syringe.
Finish entire course.
Disp: 210 mL
RF: 0`,
  },
  {
    group: 'Prescription labels',
    label: 'Asthma inhalers (albuterol, fluticasone), age 12',
    age: 12,
    text: `Diagnosis: Asthma
ALBUTEROL HFA 90 MCG/ACTUATION
Sig: 2 puffs INH q4–6h PRN wheeze/SOB. Shake well.
FLUTICASONE HFA 44 MCG/ACTUATION
Sig: 2 puffs INH BID. Use routinely as prescribed. Rinse mouth after administration.
Use spacer if instructed. Review inhaler technique with PCP.`,
  },
  {
    group: 'Prescription labels',
    label: 'Seasonal allergies (cetirizine, nasal spray), age 16',
    age: 16,
    text: `Diagnosis: Seasonal allergies
CETIRIZINE 10 MG TAB
Sig: 1 tab PO daily PRN allergy symptoms.
FLUTICASONE 50 MCG/ACT NASAL SPRAY
Sig: 1 spray each nostril daily.
May cause drowsiness. Use medications only as directed.`,
  },
  {
    group: 'Prescription labels',
    label: 'Ear infection (amoxicillin-clavulanate liquid), age 4',
    age: 4,
    text: `Document Type: Prescription label
Diagnosis: Acute Otitis Media (Ear Infection)
Medications & Instructions:
Amoxicillin-Clavulanate Potassium 200-28.5 mg/5 mL suspension: Give 4 mL by mouth every 12 hours for 10 days. Shake vigorously before measuring. Keep refrigerated. Discard after 14 days. Use the provided oral syringe.`,
  },
  {
    group: 'Prescription labels',
    label: 'Strep throat (azithromycin), age 32, shorthand',
    age: 32,
    text: `Pt: 32yo F - Dx: Streptococcal pharyngitis. Meds:
Azithromycin 250mg: 2 tabs day 1, then 1 tab qd days 2-5. Complete full course.`,
  },
  {
    group: 'Prescription labels',
    label: 'Pink eye (erythromycin ointment), age 3, full wording',
    age: 3,
    text: `Document Type: Prescription eye drop label
Diagnosis: Bacterial Conjunctivitis (Pink Eye)
Medications & Instructions:
Erythromycin 0.5% Ophthalmic Ointment: Apply a 1-inch ribbon of ointment inside the lower eyelid of the affected eye(s) 4 times daily for 5 days. Wash hands before and after application. Avoid touching the tube tip to the eye.`,
  },
  {
    group: 'Prescription labels',
    label: 'Pink eye (erythromycin ointment), age 3, shorthand',
    age: 3,
    text: `Pt: 3yo M - Dx: Bacterial conjunctivitis. Meds:
Erythromycin 0.5% ophtho oint: 1-inch ribbon inside lower lid QID x 5d. Hand hygiene before/after. Avoid tip-to-eye contact.`,
  },
  {
    group: 'Prescription labels',
    label: 'Eczema flare (hydrocortisone ointment), age 18 months',
    age: 1,
    text: `Pt: 18mo M - Dx: Atopic dermatitis exacerbation. Meds:
Hydrocortisone 2.5% oint: Thin layer to affected areas BID x 7d. Avoid broken skin/occlusion unless directed.`,
  },

  // ---------- Hospital and ER discharge ----------
  {
    group: 'Hospital and ER discharge',
    label: 'Pneumonia discharge (3 medicines)',
    age: null,
    text: `DISCHARGE INSTRUCTIONS
Patient: Jane Sample   DOB: 03/14/1951   MRN: 00482913
Dx: Community-acquired pneumonia.
1. Amoxicillin-clavulanate 875 mg PO BID x 10 days. Take with food. Complete full course even if symptoms improve.
2. Acetaminophen 500 mg 1-2 tabs PO q6h PRN fever or pain. Do not exceed 3,000 mg in 24 hrs.
3. Albuterol HFA 90 mcg 2 puffs inhaled q4-6h PRN SOB/wheezing.
Increase PO fluid intake. Rest. Avoid EtOH while on abx.
F/u with PCP in 5-7 days. Repeat CXR in 6 wks.
Return to ED or call 911 for SOB at rest, CP, confusion, lips turning blue, or fever >102.5°F that does not respond to meds.`,
  },
  {
    group: 'Hospital and ER discharge',
    label: 'ER visit: sprained ankle',
    age: null,
    text: `Dx: R ankle sprain. RICE x 48-72 hrs. Ibuprofen 400 mg PO q8h PRN pain w/ food, max 5 days. Crutches, NWB x 48 hrs. F/u ortho in 1 wk if not improving. Return to ED for numbness, cold or blue toes, or severe uncontrolled pain.`,
  },
  {
    group: 'Hospital and ER discharge',
    label: 'ER visit: minor head injury, age 17',
    age: 17,
    text: `Dx: Minor head injury. Neuro exam WNL. No acute findings requiring admission.
Rest. No contact sports or strenuous activity until cleared by provider. Avoid activities with risk of repeat head injury.
Acetaminophen 500 mg: 1 tab PO q6h PRN pain.
Parent/guardian to monitor patient at home. Return to ED for worsening symptoms, repeated vomiting, severe headache, confusion, unusual behavior, weakness, or other concerning changes. PCP follow-up as directed.`,
  },
  {
    group: 'Hospital and ER discharge',
    label: 'Appendix surgery (3 pain medicines), age 34',
    age: 34,
    text: `Diagnosis: Acute appendicitis, s/p laparoscopic appendectomy
DISCHARGE INSTRUCTIONS:
S/p uncomplicated lap appendectomy. Incisions closed with Dermabond. Keep sites clean/dry per surgical instructions. No heavy lifting/strenuous activity until cleared by surgeon.
Acetaminophen 500 mg: 1–2 tabs PO q6h PRN pain.
Ibuprofen 200 mg: 2 tabs PO q6h PRN pain. Take with food.
Oxycodone 5 mg: 1 tab PO q6h PRN severe breakthrough pain. May cause drowsiness. Use only as prescribed.
Follow up with surgery clinic as scheduled. Contact surgical team for concerning incision changes, fever, worsening abdominal pain, persistent vomiting, or other acute concerns.`,
  },
  {
    group: 'Hospital and ER discharge',
    label: 'Appendix surgery (oxycodone-APAP), age 54, shorthand',
    age: 54,
    text: `Pt: 54yo M - Dx: Post-lap appendectomy. Meds:
Oxycodone-APAP 5-325mg: 1-2 tabs PO q4-6h prn moderate-severe pain. No other APAP products.
Docusate Sodium 100mg: 1 cap PO BID prn constipation.
Ibuprofen 600mg: 1 tab PO q6h alternating w/ oxycodone prn mild pain.`,
  },
  {
    group: 'Hospital and ER discharge',
    label: 'Urinary tract infection, age 81',
    age: 81,
    text: `Discharge Dx: Acute UTI.
Nitrofurantoin monohydrate/macrocrystals 100 mg: 1 cap PO BID x 5 days. Take with food. Swallow whole.
Phenazopyridine 200 mg: 1 tab PO TID after meals PRN dysuria.
Increase PO fluids as tolerated. Complete antibiotic course. PCP follow-up as instructed. Return for fever, flank pain, vomiting, worsening symptoms, or inability to tolerate PO intake.`,
  },
  {
    group: 'Hospital and ER discharge',
    label: 'Type 2 diabetes (metformin, insulin), age 56',
    age: 56,
    text: `DISCHARGE DX: T2DM with hyperglycemia. BG improved prior to discharge.
METFORMIN 500 MG TAB: Take 1 tab PO with evening meal daily. Follow titration instructions provided by PCP. Do not increase dose independently.
INSULIN GLARGINE 100 UNIT/ML: Inject 10 units SC every evening at approximately the same time. Use insulin administration technique reviewed during admission.
Check BG per home monitoring schedule. Record readings and bring log to follow-up appointment. Follow diabetic diet/education provided during admission.
Follow-up: PCP/endocrinology as scheduled.
Seek medical attention for severe or persistent symptoms, inability to keep fluids down, or other acute concerns.`,
  },
  {
    group: 'Hospital and ER discharge',
    label: 'After a heart attack (4 medicines), age 78, shorthand',
    age: 78,
    text: `Hospital Discharge Instructions
Pt: 78yo M - Dx: Post-MI. Meds:
Aspirin 81mg: 1 tab PO qd w/ food.
Atorvastatin 80mg: 1 tab PO qhs. Avoid grapefruit juice.
Metoprolol Succinate 50mg: 1 tab PO qd AM w/ breakfast. Do not stop abruptly.
Nitroglycerin 0.4mg SL: 1 tab SL prn chest pain. Q5min x 3 max. Call 911 if no relief post-dose 1.`,
  },
  {
    group: 'Hospital and ER discharge',
    label: 'Tonsil surgery (liquid pain medicines), age 7',
    age: 7,
    text: `Pt: 7yo F - Dx: Post-T&A. Meds:
Acetaminophen liq 160mg/5ml: 15ml PO q4-6h prn pain.
Ibuprofen liq 100mg/5ml: 10ml PO q6h prn pain, staggered w/ APAP.
Cool liquids/soft foods. Avoid red fluids.`,
  },

  // ---------- Complex cases ----------
  {
    group: 'Complex cases',
    label: 'Liver transplant (5 medicines), age 29, full wording',
    age: 29,
    text: `Document Type: Transplant Center Post-Operative Instructions
Diagnosis: Status Post Orthotopic Liver Transplant
Medications & Instructions:
Tacrolimus 1 mg capsules: Take 3 capsules (3 mg total) by mouth every 12 hours (at exactly 8:00 AM and 8:00 PM). Do not eat grapefruit or drink grapefruit juice, as it dangerously alters blood levels of this drug. Blood levels will be checked weekly.
Mycophenolate Mofetil 500 mg: Take 2 tablets (1000 mg total) by mouth twice daily exactly 12 hours apart, taken with food to reduce stomach upset. Wear gloves when handling broken or crushed tablets.
Prednisone 10 mg: Take 2 tablets (20 mg total) by mouth once daily in the morning with a heavy meal to prevent severe gastric irritation. Tapering schedule will be provided at the next clinic visit.
Valganciclovir 450 mg: Take 1 tablet by mouth once daily with food for antiviral prophylaxis. Take exactly as prescribed and do not miss doses.
Sulfamethoxazole-Trimethoprim DS (800-160 mg): Take 1 tablet by mouth Monday, Wednesday, and Friday only to prevent opportunistic infections. Drink a full glass of water with each dose.`,
  },
  {
    group: 'Complex cases',
    label: 'Liver transplant (5 medicines), age 29, shorthand',
    age: 29,
    text: `Pt: 29yo M - Status post orthotopic liver transplant (OLT). Meds:
Tacrolimus 1mg caps: Take 3 caps PO q12h (0800/2000). NO grapefruit/juice. Trough levels weekly.
Mycophenolate mofetil 500mg: 2 tabs PO q12h w/ food. Use gloves if crushing.
Prednisone 10mg: 2 tabs PO qd AM w/ heavy meal. Taper per clinic sched.
Valganciclovir 450mg: 1 tab PO qd w/ food.
Bactrim DS (800-160mg): 1 tab PO MWF.`,
  },
  {
    group: 'Complex cases',
    label: 'After a stroke, with heart failure and diabetes, age 81, full wording',
    age: 81,
    text: `Document Type: Rehabilitation Facility Discharge Summary
Diagnosis: Acute Ischemic Stroke Recovery, Atrial Fibrillation, Type 2 Diabetes, and Congestive Heart Failure
Medications & Instructions:
Apixaban 5 mg: Take 1 tablet by mouth twice daily (approximately 12 hours apart) with or without food. Do not miss doses, as this prevents dangerous blood clots.
Carvedilol 6.25 mg: Take 1 tablet by mouth twice daily with meals to slow heart rate and lower blood pressure. Monitor pulse daily before taking; hold medication and call the physician if resting heart rate is below 50 beats per minute.
Empagliflozin 10 mg: Take 1 tablet by mouth once daily in the morning. Stay well-hydrated and monitor for signs of urinary tract infections.
Furosemide 40 mg: Take 1 tablet by mouth once daily in the morning. Weigh yourself daily at the same time; call the doctor immediately if weight increases by more than 3 pounds in 2 days, which can indicate fluid retention.
Insulin Glargine 100 units/mL: Inject 18 units subcutaneously once daily at bedtime. Rotate injection sites between the abdomen and thighs. Check fasting blood glucose every morning.`,
  },
  {
    group: 'Complex cases',
    label: 'After a stroke, with heart failure and diabetes, age 81, shorthand',
    age: 81,
    text: `Pt: 81yo M - Dx: CVA, AFib, T2DM, CHF. Meds:
Apixaban 5mg PO BID w/ or w/o food.
Carvedilol 6.25mg PO BID w/ meals. Hold if HR < 50.
Empagliflozin 10mg PO qd AM.
Furosemide 40mg PO qd AM. Daily weights; notify MD if wt gain > 3lbs in 48h.
Insulin Glargine 100u/ml: 18 units SubQ qhs. Rotate sites. Monitor fasting BG.`,
  },
  {
    group: 'Complex cases',
    label: 'Child leukemia maintenance (weekly methotrexate), age 6, full wording',
    age: 6,
    text: `Document Type: Pediatric Oncology Outpatient Protocol
Diagnosis: Acute Lymphoblastic Leukemia (Maintenance Phase)
Medications & Instructions:
Mercaptopurine (6-MP) 50 mg: Give 1.5 tablets (75 mg) by mouth once daily at bedtime on an empty stomach (1 hour before or 2 hours after food or milk). Wear disposable gloves when splitting tablets.
Methotrexate 2.5 mg: Take 4 tablets (10 mg total) by mouth once weekly on Tuesdays only. Double-check the calendar; taking this daily can result in fatal toxicity.
Bactrim (Sulfamethoxazole-Trimethoprim) Suspension: Give 5 mL by mouth twice daily on consecutive days (Saturday and Sunday only) for infection prevention.
Ondansetron 4 mg/5 mL Liquid: Give 4 mL by mouth every 8 hours as needed for nausea, starting 30 minutes before high-risk chemotherapy clinic days.`,
  },
  {
    group: 'Complex cases',
    label: 'Child leukemia maintenance (weekly methotrexate), age 6, shorthand',
    age: 6,
    text: `Pt: 6yo F - Dx: ALL (Maintenance phase). Meds:
Mercaptopurine (6-MP) 50mg: 1.5 tabs PO qhs fasting (1h ac / 2h pc). Wear gloves for splitting.
Methotrexate 2.5mg: 4 tabs PO QWEEKLY ON TUESDAYS ONLY. Do not dose daily (fatal toxicity risk).
Bactrim susp: 5ml PO BID Sat/Sun only.
Ondansetron 4mg/5ml liq: 4ml PO q8h prn N/V, start 30m prior to chemo clinic.`,
  },
]
