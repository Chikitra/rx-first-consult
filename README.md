# Quick Prescribe

I am building Chikitra, a clinical software product for doctors in India.



I want you to modify/build the doctor consultation experience based on the product principle below.



Core Product Principle



1. Rx-first, record-optional



The consultation screen must open directly on the prescription/medication workflow.



The doctor should be able to start prescribing immediately without first entering:



- Chief complaints

- History

- Examination findings

- Diagnosis

- Any other clinical documentation



These clinical-record elements are optional, not prerequisites.



The central interaction should therefore be:



Open consultation → Medicines → Generate prescription



rather than:



Open consultation → Create clinical record → Complaints → Findings → Diagnosis → Medicines



This is a deliberate product decision.



IMPORTANT



This overrules the record-first flows described in R1, R2 and R8.



Do not preserve or recreate a workflow where the doctor is forced to complete clinical documentation before reaching the prescription.



The prescription is the primary output of the consultation.



---



UI / UX REQUIREMENTS



A. Consultation opens on Medicines



When a doctor starts a consultation, the first and most visually prominent section should be:



Prescription / Medicines



The doctor should immediately see an interface to:



- Search/add a medicine

- Select dosage

- Select frequency

- Select duration

- Add instructions

- Add multiple medicines

- Edit/remove medicines

- Generate/finalize the prescription



The doctor should be able to complete a basic consultation entirely from this screen.



Do not make the doctor click through multiple clinical-record steps before reaching medicines.



---



B. Clinical information is optional



Complaints, findings and diagnosis should exist as secondary, lightweight inputs around the prescription, rather than as mandatory workflow stages.



Think of them as optional contextual chips/sections.



For example:



Medicines



"+ Add medicine"



---



Clinical context (optional)



"+ Complaint" "+ Finding" "+ Diagnosis"



These should be easy to add if the doctor wants to document them, but they should never block prescription creation.



The doctor should be able to:



1. Add only medicines

2. Add medicines + diagnosis

3. Add medicines + complaints

4. Add medicines + complaints + diagnosis + findings

5. Complete the entire prescription without entering any of these



All of these should be valid workflows.



---



C. Do NOT create a clinical-documentation wizard



Avoid designs such as:



1. Complaints

2. History

3. Examination

4. Diagnosis

5. Prescription



with a "Next" button between each step.



That is explicitly NOT the desired interaction model.



Instead, the prescription should remain the persistent primary workspace, while clinical information can be added opportunistically.



---



D. Preserve speed for General Practitioners



Design this for a busy Indian General Practitioner who may see a large number of patients in a day.



Optimize for:



- Minimum clicks

- Minimum typing

- Fast medicine entry

- Keyboard-friendly interaction

- Search-first medicine selection

- Easy modification of medicines

- Clear dosage/frequency/duration controls

- Very low cognitive overhead

- Ability to finish a consultation quickly



Do not add unnecessary fields simply because they are medically possible.



Every interaction should justify its existence in terms of helping the doctor prescribe or document the encounter.



---



E. Visual hierarchy



The hierarchy should communicate:



PRIMARY



Prescription / Medicines



SECONDARY



Complaints

Findings

Diagnosis

Other clinical notes



The medicine workflow should occupy the majority of the consultation workspace.



Clinical documentation should visually support the prescription rather than compete with it.



---



F. Doctor dashboard reference



I have uploaded a screen recording showing the current Chikitra doctor dashboard.



Use this video to understand:



- Existing visual language

- Navigation

- Layout

- Spacing

- Components

- Doctor workflow

- Existing dashboard structure



Do NOT blindly reproduce the existing workflow.



The video is primarily a reference for the current product/UI, while the Rx-first principle above is the new product requirement.



Where the existing design conflicts with the Rx-first principle, the Rx-first principle wins.



---



G. Patient context



The doctor should still have access to important patient context without forcing the doctor through documentation.



For example, the consultation interface can show lightweight patient information such as:



- Patient name

- Age/sex

- Relevant existing information

- Previous prescriptions/visits where appropriate



But patient context should not push the prescription below the fold unnecessarily.



The doctor should immediately understand:



Who is this patient? → What am I prescribing?



---



H. Prescription generation



The end goal of the consultation screen is a professional prescription.



The primary action should therefore be something like:



Generate Prescription



or



Save & Generate Prescription



Do not make "Complete clinical record" the primary CTA.



If clinical documentation is incomplete, that should not prevent prescription generation.



---



I. Interaction model



Think of the consultation screen as a prescription canvas, not a medical-record form.



Conceptually:



┌─────────────────────────────────────────────┐

│ Patient context                             │

├─────────────────────────────────────────────┤

│                                             │

│ PRESCRIPTION                                │

│                                             │

│ + Add Medicine                              │

│                                             │

│ Medicine 1                                  │

│ Dose | Frequency | Duration | Instructions  │

│                                             │

│ Medicine 2                                  │

│ Dose | Frequency | Duration | Instructions  │

│                                             │

├─────────────────────────────────────────────┤

│ Clinical context (optional)                 │

│                                             │

│ + Complaint   + Finding   + Diagnosis       │

│                                             │

├─────────────────────────────────────────────┤

│                         Generate Prescription│

└─────────────────────────────────────────────┘



This is only a conceptual representation. Use your own UX judgment to make the actual interface polished and production-quality.



---



J. Empty state



When there are no medicines yet, the screen should make the next action extremely obvious.



For example:



Start prescription



Search for a medicine or add one manually.



The doctor should not encounter an intimidating blank clinical-record form.



---



K. Avoid overengineering



Do not add:



- Mandatory clinical documentation

- Multi-step forms

- Unnecessary questionnaires

- Excessive sections

- Large empty cards

- Complex clinical workflows

- Fields that are not necessary for prescribing



The product should feel fast, modern and doctor-centric.



---



SUCCESS CRITERIA



Consider the implementation successful if a GP can:



1. Open a patient's consultation

2. Immediately see the prescription workspace

3. Search and add a medicine

4. Specify dose/frequency/duration

5. Add additional medicines

6. Generate the prescription



without ever entering a complaint, finding or diagnosis.



At the same time, if the GP wants to document those things, they should be available immediately as optional contextual inputs.



The fundamental UX principle is:



«Prescription first. Documentation when useful. Never documentation as a gate to prescribing.»



Build the UI accordingly, using the uploaded doctor-dashboard recording as the visual/product-context reference.



Before implementing, inspect the existing application structure and reuse existing components/design patterns where appropriate. Do not unnecessarily rebuild unrelated parts of the dashboard.



Focus this task specifically on establishing the Rx-first consultation experience.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rx-first-consult.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c72538a5-0eb6-4ecb-9e66-bc1b1873e5e2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
