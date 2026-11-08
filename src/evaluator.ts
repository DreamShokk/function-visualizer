// Compiles a user-supplied f(x, y) expression into a callable function.
// The compiled function is cached per expression string so it is only
// built once per edit, not once per surface sample.

export type FunctionOfTwoVariables = (x: number, y: number) => number;

let cache: { expr: string; fn: FunctionOfTwoVariables } | null = null;

/**
 * Compile the expression and return a function of (x, y).
 * Returns NaN for any evaluation error instead of throwing.
 */
export function evaluateFunction(expr: string): FunctionOfTwoVariables {
  if (cache && cache.expr === expr) return cache.fn;

  let fn: FunctionOfTwoVariables;
  try {
    const compiled = new Function(
      'x',
      'y',
      `"use strict"; return (${expr.trim()});`,
    ) as unknown as FunctionOfTwoVariables;
    // Smoke-test so syntax errors surface immediately.
    fn = (x: number, y: number) => {
      try {
        const z = compiled(x, y);
        return typeof z === 'number' && isFinite(z) ? z : NaN;
      } catch {
        return NaN;
      }
    };
  } catch {
    fn = () => NaN;
  }

  cache = { expr, fn };
  return fn;
}
