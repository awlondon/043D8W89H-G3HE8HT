# Data Models

## Job
Represents a cutting request submitted by the tablet app.

```
Job {
  id: string
  stocks: Stock[]
  parts: PartRequirement[]
  kerf: number
  tolerance: number
}
```

## Stock
Represents a single available rebar stick.

```
Stock {
  id: string
  length: number
}
```

## PartRequirement
Represents a required part and quantity.

```
PartRequirement {
  id: string
  length: number
  quantity: number
}
```

## CutPlan
Optimizer output containing ordered cut segments for each stick.

```
CutPlan {
  jobId: string
  sticks: CutStickPlan[]
}
```

### CutStickPlan
```
CutStickPlan {
  stockId: string
  stockLength: number
  segments: CutSegment[]
  remainingLength: number
}
```

### CutSegment
```
CutSegment {
  label: 'PART' | 'KEEP_REMNANT' | 'WASTE'
  length: number
  partId?: string
}
```

## Constants
The global minimum part length is defined once as:

```
MIN_PART_LENGTH_INCHES = 18.0
```

The value is exported from `@rebar/shared` and imported by the core optimizer and validators.
