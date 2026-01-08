# Optimizer

## Location
All cutting optimization logic lives in `packages/core` and is exported via `generateCutPlan`.

## Inputs
- Stock lengths (`Job.stocks`)
- Required parts with quantities (`Job.parts`)
- Kerf per cut (`Job.kerf`)
- Tolerance per part (`Job.tolerance`)

## Minimum Length Rule
The minimum part length constant is defined once in `packages/shared` as `MIN_PART_LENGTH_INCHES` and imported by the optimizer and validators.

## Algorithm
The optimizer implements **Best-Fit Decreasing** (BFD) for 1D cutting stock:

1. Validate the job (stock availability, minimum length rule, and total length feasibility).
2. Expand part quantities into individual parts.
3. Compute each part's **effective length** as `part.length + tolerance + kerf`.
4. Sort parts descending by effective length (tie-breaker by deterministic ID).
5. Place each part on the stick that yields the smallest non-negative remaining length.
6. Emit ordered cut segments per stick.
7. Add an explicit remainder segment labeled:
   - `KEEP_REMNANT` if `>= MIN_PART_LENGTH_INCHES`
   - `WASTE` otherwise

## Output Rules
- All `PART` and `KEEP_REMNANT` segments are at least 18 inches.
- Any segment shorter than 18 inches is labeled `WASTE`.
- Errors are thrown when any part cannot fit or job constraints are violated.

## Determinism
The optimizer is deterministic because parts are sorted with a stable tie-breaker and stock selection uses a consistent order.
