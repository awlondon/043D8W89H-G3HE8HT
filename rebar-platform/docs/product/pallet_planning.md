# Pallet Planning / Stacking Optimization

See also: [MVP Workflow Spec](./mvp_spec.md)
Related: [Cut Optimization Spec](./optimization.md)

## Purpose & user story

After bending rebar, shop crews stack pieces on pallets and band them for forklift moves. The platform should suggest which pieces go on which pallets and layers so the crew avoids overloaded lifts, dangerous overhangs, and rework from unstable stacks.

## Inputs

- Shape dimensions and max leg length
- Bar sizes and final lengths in inches
- Quantity per shape
- Shop pallet configuration (max pallet weight, deck size, allowed overhang)
- Optional override for max pallet weight per planning run

## Algorithm (v1)

A heuristic that prioritizes heavy and long bars on the bottom and groups similar lengths on the same layer:

1. Compute weight per piece using ASTM bar weight per foot.
2. Sort items by descending weight per piece, then by max length.
3. Build pallets sequentially, creating a new pallet when the next piece would exceed the max pallet weight.
4. Use a layer limit of roughly 40% of the pallet limit; start a new layer if the next piece crosses the layer threshold or if its length is less than ~60% of the longest piece already on that layer.
5. Track overhang warnings when a bar length exceeds pallet length + allowed overhang.
6. Persist pallets, layers, and piece allocations with statuses (`planned`, `stacking`, `stacked`, `loaded`).

## Outputs

- Pallet list with total weight and max allowed weight
- Layer breakdown with weight totals and piece groupings
- Overhang warnings on pallets or layers where bars exceed pallet length + tolerance
- Status updates for stacking/loaded events

## Future v2 ideas

- 3D packing and banding tension checks
- Forklift route optimization and truck loading order
- AR overlays that project the layer layout directly onto the pallet surface
