function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const accumulatorState = {
  wiki: [
    {
      id: "binding",
      type: "concept",
      owner: "user",
      related: [],
    },
    {
      id: "iteration",
      type: "concept",
      owner: "user",
      related: ["binding"],
    },
    {
      id: "accumulator",
      type: "concept",
      owner: "user",
      related: ["iteration"],
    },
  ],

  skills: [
    {
      id: "read-values",
      name: "Read values",
      cost: 1,
      uses: ["binding"],
      needs: [],
      checked_by: [],
    },
    {
      id: "trace-loop",
      name: "Trace a loop",
      cost: 1,
      uses: ["iteration"],
      needs: ["read-values"],
      checked_by: ["trace-loop-basic"],
    },
    {
      id: "build-accumulator",
      name: "Build an accumulator",
      cost: 1,
      uses: ["accumulator"],
      needs: ["trace-loop"],
      checked_by: ["accumulator-basic"],
    },
  ],

  challenges: [
    {
      id: "trace-loop-basic",
      tests: "trace-loop",
      kind: "exact",
      expected: [
        { x: 1, before: 0, after: 1 },
        { x: 3, before: 1, after: 4 },
        { x: 4, before: 4, after: 8 },
        { x: 5, before: 8, after: 13 },
      ],
    },
    {
      id: "accumulator-basic",
      tests: "build-accumulator",
      kind: "exact",
      expected: {
        operations: ["Bind", "Iterate", "AddUpdate", "Observe"],
        result: 13,
      },
    },
  ],

  evidence: [],

  tree: {
    id: "python-accumulator",
    skills: ["read-values", "trace-loop", "build-accumulator"],
  },

  build: {
    id: "starter-build",
    tree: "python-accumulator",
    budget: 3,
    selected: ["read-values"],
  },
};

export function traceEvidence() {
  return {
    id: "trace-loop-run-1",
    challenge: "trace-loop-basic",
    observed: [
      { x: 1, before: 0, after: 1 },
      { x: 3, before: 1, after: 4 },
      { x: 4, before: 4, after: 8 },
      { x: 5, before: 8, after: 13 },
    ],
  };
}

export function accumulatorEvidence() {
  return {
    id: "accumulator-run-1",
    challenge: "accumulator-basic",
    observed: {
      operations: ["Bind", "Iterate", "AddUpdate", "Observe"],
      result: 13,
    },
  };
}

export function stateWith(...changes) {
  const state = clone(accumulatorState);
  for (const change of changes) change(state);
  return state;
}

export const addTraceEvidence = (state) => {
  state.evidence.push(traceEvidence());
};

export const selectTraceLoop = (state) => {
  state.build.selected.push("trace-loop");
};

export const addAccumulatorEvidence = (state) => {
  state.evidence.push(accumulatorEvidence());
};

export const selectAccumulator = (state) => {
  state.build.selected.push("build-accumulator");
};
