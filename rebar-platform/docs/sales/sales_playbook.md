# Sales Playbook

1. Warm intro referencing scrap or rework pain.
2. Quick qualify: workflow type, crew size, software stack.
3. Pitch: offline-first tablets, calibration-driven bending, optimization + scrap analytics.
4. Objection handling via KB.
5. Close: schedule pilot, confirm contacts, log disposition.

#### Pallet Planning & Forklift Safety

- The app groups bent pieces into pallet “recipes” with weight totals and layer-by-layer instructions.
- It prevents overloaded pallets that forklifts can’t lift.
- It reduces restacking and banding failures.
- See [Pallet Planning Spec](../product/pallet_planning.md) for the technical design.

#### Scrap-Free Results (In Practice)

- **Scrap-free results (in practice):** Runs are marked scrap-free when scrap is below a
  configurable threshold (e.g., ≤ 2%). The app tracks scrap-free run rates by operator and shop
  to prove waste reduction. See the [Cutter App Specification](../product/cutter_app_spec.md#scrap-free-metric)
  for the precise definition.
