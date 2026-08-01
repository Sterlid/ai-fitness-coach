# AI Fitness Coach — Product Requirements Document

**Version:** 0.1  
**Status:** Discovery draft  
**Last updated:** 1 August 2026  
**Product surface:** Cross-platform mobile app

## 1. Product thesis

People are more consistent when logging is nearly effortless and each log immediately improves a practical recommendation for what to eat or do next.

AI Fitness Coach turns meal photos or descriptions and lightweight activity data into a useful daily plan. It estimates calories and macronutrients, lets users correct uncertain details, recommends meals that fit the remainder of the day, and adapts workout suggestions to goals, history, recovery, time, and available equipment.

The first release optimizes for trust and repeat use rather than clinical precision. Estimates expose uncertainty, recommendations explain their rationale, and users retain control over edits, goals, dietary preferences, physical limitations, and data sharing.

## 2. Problem

- Manual food logging is slow, particularly for mixed dishes and restaurant meals.
- Calorie trackers report numbers without helping users decide what to eat next.
- Workout plans are often static and ignore adherence, fatigue, recent training, and available time.
- Nutrition and exercise data live in separate experiences, so the daily plan does not adapt as behavior changes.

## 3. Target users

### Consistency seeker

Wants better everyday choices without obsessive tracking. Needs fast logging, forgiving workflows, and neutral guidance.

### Goal-driven improver

Wants to lose fat, maintain weight, gain muscle, or improve performance predictably. Needs targets, trends, and actionable adjustments.

### Busy exerciser

Wants an achievable answer to “What workout should I do today?” Needs plans that respect available time, equipment, recovery, and training history.

## 4. Goals and non-goals

### MVP goals

- Log a meal from a photo or natural-language description in under 30 seconds.
- Provide editable calorie and macronutrient estimates with confidence cues.
- Recommend meals based on remaining daily targets and user preferences.
- Generate a safe daily workout and adapt it using recent behavior and feedback.
- Present one clear daily view connecting food, movement, and progress.
- Learn from corrections, skips, ratings, and completed actions.

### Not in MVP

- Medical diagnosis or medical nutrition therapy.
- Guaranteed laboratory-grade nutrition accuracy.
- Grocery delivery, restaurant ordering, or payments.
- Live exercise-form analysis.
- Social feeds, competitions, coach accounts, or family plans.
- Automatic wearable integrations unless promoted into scope after discovery.

## 5. Product principles

1. **Fast before perfect.** A useful estimate followed by easy correction beats a long intake form.
2. **Confidence is visible.** Separate observed facts, inferred portions, and user-confirmed values.
3. **Recommendations explain themselves.** Show the main factors behind each suggestion.
4. **Adapt, do not punish.** Missed logs and workouts lead to a gentler next step, never shame.
5. **Safety and agency.** Users control their goals and constraints; the product avoids diagnosis and unsafe escalation.

## 6. MVP experience

### 6.1 Onboarding and profile

The app collects the minimum information required to personalize nutrition and training:

- Age range, height, weight, activity level, and preferred units.
- Primary goal and preferred pace.
- Dietary patterns, allergies, disliked foods, and preferred cuisines.
- Training experience, available equipment, usual workout duration, and physical limitations.

The app suggests calorie and macro targets, labels them as estimates, and requires confirmation. Optional fields can be skipped and all answers remain editable.

### 6.2 Meal capture and analysis

Users can submit a camera photo, library image, description, or photo plus description. The analysis returns:

- Likely foods and preparation methods.
- Estimated portions and itemized calories.
- Protein, carbohydrates, and fat.
- Assumptions and a confidence level.
- Up to two clarification questions when uncertainty materially affects the result.

Users can edit items, portions, ingredients, and totals before saving. Corrections become personalization signals. The app also supports recent meals, saved meals, copy-to-today, and deletion.

### 6.3 Meal recommendations

The app recommends three to five options based on remaining targets, dietary constraints, recent variety, preparation time, and learned preferences. Each option contains:

- Name and short rationale.
- Estimated calories and macros.
- Ingredients and simple preparation steps.
- Controls to save, dismiss, request an alternative, exclude an ingredient, or change the calorie range.

### 6.4 Daily workout coaching

The app generates one primary session, a lower-intensity alternative, and a recovery option. Planning considers goals, experience, recent muscle-group exposure, completed workouts, soreness or energy, available time, equipment, and limitations.

Each workout includes a warm-up, exercises, sets/repetitions or time, rest, cooldown, estimated duration, and intensity cue. Users can replace an exercise, shorten the session, change equipment, mark completion, rate difficulty, report pain, or skip with a reason.

The app never encourages training through pain. Severe or persistent symptoms produce a stop-and-seek-professional-care message.

### 6.5 Today and progress

The Today screen shows:

- Calorie and macro progress.
- Logged meals and the next meal suggestions.
- Planned or completed workout.
- One prioritized next action.

The weekly view shows logging consistency, nutrition ranges, workout completion, training balance, and weight trend when supplied. Insights focus on rolling patterns rather than single-day judgment.

## 7. Critical user flows

### Meal photo to logged entry

1. User photographs a meal and optionally adds context.
2. The system identifies likely components and portions and flags meaningful uncertainty.
3. The user confirms or adjusts the estimate.
4. The meal is added to the day; totals and recommendations refresh.

### Daily workout to completion

1. User opens Today and sees the recommended session and rationale.
2. User confirms time and equipment and can report energy or soreness.
3. The system adapts the session.
4. User logs completion and perceived difficulty.
5. Future plans update using adherence, training balance, and feedback.

## 8. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Create and edit a profile, goals, food constraints, and training constraints. | P0 |
| FR-02 | Analyze a meal image and/or description into editable itemized estimates. | P0 |
| FR-03 | Store meal logs and immediately update daily calorie and macro totals. | P0 |
| FR-04 | Generate personalized meal recommendations with rationale and alternatives. | P0 |
| FR-05 | Generate a daily workout with safe adaptations and completion logging. | P0 |
| FR-06 | Show Today and weekly progress views. | P0 |
| FR-07 | Capture edits, ratings, skips, difficulty, soreness, and pain feedback. | P0 |
| FR-08 | Export and delete account data. | P0 |
| FR-09 | Support opt-in reminders with granular controls. | P1 |
| FR-10 | Import activity and workouts from Apple Health or Health Connect. | P1 |

## 9. Recommendation behavior

### Meal ranking

Allergies, dietary exclusions, and explicit dislikes are hard filters. Ranking considers remaining calorie and protein targets, meal timing, recent variety, saved preferences, preparation time, available ingredients when known, and previous responses.

The system must not respond to an over-target day with extreme restriction or compensatory exercise.

### Workout planning

Injuries, limitations, pain reports, available equipment, and experience-appropriate movement selection are hard constraints. Planning and progression consider the user’s goal, time, recent sessions, muscle-group recovery, adherence, perceived difficulty, soreness, voluntary energy or sleep input, and progression history.

Changes to load or volume must be conservative and reversible.

### AI output contract

- AI responses use validated structured output.
- The app retains the inputs, model/version metadata, and assumptions used for an estimate or recommendation.
- User-visible results expose uncertainty or rationale.
- Low-confidence or failed analysis falls back to safe manual entry or a generic recommendation.
- User corrections never silently rewrite historical records.

## 10. Data model

The initial schema contains:

- Profiles, goals, food preferences, and training constraints.
- Daily calorie and macro targets.
- Meals, itemized meal components, images, estimates, confidence, and corrections.
- Meal recommendations, rationale, ingredients, instructions, status, and model metadata.
- Workouts, exercises, adaptations, status, difficulty, soreness, and pain signals.
- Body measurements and feedback events.

Meal images are private, encrypted in transit and at rest, scoped to their owner, and removable by the user.

## 11. Technical direction

- **Client:** Expo SDK 57, React Native, and TypeScript.
- **Backend:** Supabase Authentication, Postgres, Row Level Security, and private Storage.
- **Server logic:** Supabase Edge Functions for AI-provider requests and privileged operations.
- **Security boundary:** Only the Supabase publishable key is shipped in the client. Service-role credentials, database passwords, and AI-provider secrets remain server-side.
- **Delivery:** Migration-driven database changes, generated database types, and automated type checking.

## 12. Trust, safety, privacy, and accessibility

- Require adult eligibility for MVP or create an age-appropriate experience before supporting minors.
- Present estimates as ranges or uncertain values when appropriate.
- Avoid punitive language, aggressive deficits, compensatory exercise, and recommendations associated with disordered eating.
- Limit guidance and recommend qualified support for pregnancy, eating-disorder history, complex medical conditions, or significant injury.
- Provide consent, access, export, deletion, notification, analytics, and model-improvement controls.
- Target WCAG 2.2 AA: screen-reader labels, dynamic type, sufficient contrast, non-color status cues, and accessible camera alternatives.
- Red-team malicious image uploads, prompt injection, allergen failures, unsafe workouts, and misleading health claims before launch.

## 13. Non-functional requirements

| Area | MVP target |
|---|---|
| Performance | First analysis response within 8 seconds at p75 and full result within 15 seconds at p90 under normal conditions. |
| Availability | 99.5% monthly availability for core logging and Today APIs. |
| Reliability | Draft capture survives transient failure and retries do not create duplicates. |
| Security | Encryption, least privilege, secret management, Row Level Security, auditability, and dependency scanning. |
| Observability | Trace model version, recommendation version, latency, failure mode, correction, and safety intervention. |
| Localization | Architecture supports locale, units, food vocabularies, and time zones. |

## 14. Success metrics

**North-star behavior: Weekly Guided Days** — days per week when an active user logs at least one meal and views, adapts, or completes a recommended meal or workout action.

Initial hypotheses:

- At least 60% of new users finish onboarding and log a meal within 24 hours.
- At least 70% of analyzed meals are saved.
- Median meal-log completion time is under 30 seconds.
- Fewer than 35% of saved meals need a material calorie correction after four weeks.
- At least 25% of weekly users save, select, or positively rate a meal recommendation.
- At least 35% of weekly users complete two recommended workouts.
- Every severe allergen, injury, or unsafe-advice report is investigated; the goal is zero preventable severe incidents.

## 15. Analytics

Instrument onboarding completion, meal capture, analysis results and failures, clarification, edits, saved meals, recommendation responses, workout generation and adaptation, completion, skips, pain reports, and account-data controls.

Relevant events include model/version, confidence band, latency, and privacy-preserving decision context. Experiments must pair engagement with correction rate, opt-outs, safety signals, and self-reported usefulness.

## 16. Release plan

| Phase | Exit criteria |
|---|---|
| Prototype | End-to-end clickable experience; 8–12 moderated tests validate comprehension and correction flows. |
| Internal alpha | Core flows work; structured outputs are validated; critical security and safety tests pass. |
| Closed beta | At least 200 consented testers; quality dashboards and incident processes are operational. |
| MVP | All P0 requirements complete; privacy/store reviews pass; rollback and model-version controls are ready. |

## 17. MVP acceptance criteria

- A user can onboard, log and edit a meal, see updated targets, receive meal options, generate and adapt a workout, complete it, and view weekly progress.
- Every AI estimate or recommendation contains a confidence or rationale signal and can be corrected or dismissed.
- Allergy and physical-limitation constraints are enforced by automated tests and logged for audit.
- The app remains usable through text/manual entry when image analysis fails.
- A user can export and delete their account data.

## 18. Major risks and mitigations

| Risk | Mitigation |
|---|---|
| Incorrect portions or ingredients | Show assumptions and ranges, ask targeted questions, and prioritize easy edits. |
| Unsafe or overconfident guidance | Conservative rules, expert review, safety checks, escalation language, and audit logs. |
| Disordered or compulsive use patterns | Neutral language, configurable visibility, risk detection, and restricted advice. |
| Cold-start recommendations | Short onboarding, safe defaults, and rapid learning from explicit feedback. |
| Privacy concerns | Data minimization, clear retention, user controls, encryption, and no hidden reuse. |
| Recommendation fatigue | One prioritized next action, bounded reminders, diversity, and dismissal learning. |

## 19. Open decisions

- Primary launch segment: general wellness, fat loss, or strength and muscle gain.
- Launch market and language.
- Nutrition database and image-model architecture.
- Whether calorie visibility can be replaced by non-calorie habit goals.
- Authentication options beyond email and password.
- Subscription model, free limits, and trial design.
- Health-data integrations required for MVP versus post-launch.
- Default meal-image retention and separate model-improvement consent.
- Dietitian and certified-trainer review and launch sign-off process.

## 20. Recommended next work

1. Interview 8–12 people across the three target segments.
2. Prototype meal capture/results, Today, and adaptive workout screens.
3. Build an expert-reviewed meal benchmark for estimation and clarification testing.
4. Define the safety policy with dietitian and certified-trainer input.
5. Select the initial segment and convert this PRD into a prioritized backlog and technical architecture.
