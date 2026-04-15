import * as math from 'mathjs';

/**
 * Parses a string like "y = x^2" or "f(x) = sin(x)" or just "x^2"
 * Returns the expression part.
 */
export function parseEquation(latex: string): string {
  let clean = latex.trim();
  if (clean.includes('=')) {
    const parts = clean.split('=');
    // If it's y = ..., return the right side
    // If it's f(x) = ..., return the right side
    // If it's x^2 + y^2 = 1, this is an implicit equation (more complex to plot)
    // For now, let's assume simple y = ... or f(x) = ...
    return parts[1].trim();
  }
  return clean;
}

/**
 * Detects variables in an expression that are not 'x', 'y', 't', 'theta'
 */
export function detectVariables(expression: string): string[] {
  try {
    const node = math.parse(expression);
    const variables = new Set<string>();
    node.traverse((n) => {
      if (n.type === 'SymbolNode') {
        const symbolNode = n as math.SymbolNode;
        if (!['x', 'y', 't', 'theta', 'phi'].includes(symbolNode.name)) {
          // Check if it's a known math constant or function
          if (!(symbolNode.name in math)) {
            variables.add(symbolNode.name);
          }
        }
      }
    });
    return Array.from(variables);
  } catch (e) {
    return [];
  }
}

/**
 * Evaluates an expression at a given point with variables
 */
export function evaluateAt(expression: string, scope: Record<string, number>): number | null {
  try {
    const result = math.evaluate(expression, scope);
    if (typeof result === 'number' && isFinite(result)) {
      return result;
    }
    if (result && typeof result === 'object' && 're' in result) {
      // Handle complex numbers - only return real part if imaginary is near zero
      if (Math.abs(result.im) < 1e-10) return result.re;
    }
    return null;
  } catch (e) {
    return null;
  }
}
