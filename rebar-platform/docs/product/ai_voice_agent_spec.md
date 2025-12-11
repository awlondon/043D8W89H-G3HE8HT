# AI Voice Agent Spec

State machine-driven outbound caller targeting bending/fab shops.

## States
- PRE_CALL_CONTEXT: hydrate lead data and prior history.
- CALL_START: greeting and quick relevance.
- GATEKEEPER: request transfer or permission.
- INTRO_DECISION_MAKER: brief intro + why now.
- QUICK_QUALIFY: capture workflow type, crew size, scrap pain level.
- VALUE_PITCH: tailor benefits (scrap reduction, offline tablet, automation).
- QUESTIONS_OBJECTIONS: use KB snippets for objections.
- CONTACT_CAPTURE: confirm best phone/email and next step.
- WRAP_UP: set disposition and promise summary.
- POST_CALL_SUMMARY: produce structured notes for CRM and commissions logic.

## Outputs
- Call summaries, objections, and slot values synced to `services/core-api` for Lead/Deal updates and commission routing.
