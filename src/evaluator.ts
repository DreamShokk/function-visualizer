// Compiles a user-supplied f(x, y) expression into a callable function.
// The compiled function is cached per expression string so it is only
// built once per edit, not once per surface sample.

export type FunctionOfTwoVariables = (x: number, y: number) => number;

/** Math members made available bare in user expressions (sin(x), PI, ...). */
export const MATH_MEMBERS = [
  'abs', 'acos', 'asin', 'atan', 'cbrt', 'ceil', 'cos', 'exp', 'floor',
  'log', 'log2', 'log10', 'max', 'min', 'pow', 'round', 'sign', 'sin',
  'sqrt', 'tan', 'trunc',
] as const;

let cache: { expr: string; fn: FunctionOfTwoVariables } | null = null;

/**
 * Compile the expression and return a function of (x, y).
 * Returns NaN for any evaluation error instead of throwing.
 */
export function evaluateFunction(expr: string): FunctionOfTwoVariables {
  if (cache && cache.expr === expr) return cache.fn;

  let fn: FunctionOfTwoVariables = () => NaN;

  try {
    const compiled = new Function(
      'x',
      'y',
      `"use strict";\n` +
        `const { ${MATH_MEMBERS.join(', ')} } = Math;\n` +
        `const PI = Math.PI, E = Math.E;\n` +
        `return (${expr.trim()});`,
    ) as unknown as FunctionOfTwoVariables;

    // Smoke-test so syntax errors surface immediately.
    compiled(1, 2);

    fn = (x: number, y: number) => {
      try {
        const z = compiled(x, y);
        return typeof z === 'number' && isFinite(z) ? z : NaN;
      } catch {
        return NaN;
      }
    };
  } catch {
    // Invalid expression: everything evaluates to NaN.
  }

  cache = { expr, fn };
  return fn;
}
