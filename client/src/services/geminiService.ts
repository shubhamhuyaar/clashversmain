import { Problem, BattleResult } from '@/types/game';

// This is a mock service that simulates AI logic. 
// In a real app, this would call the Gemini API or a backend endpoint.

export const generateProblem = async (rating: number): Promise<Problem> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    id: 'p-' + Math.random().toString(36).substr(2, 9),
    title: 'BITWISE PARITY INVERSION',
    description: 'IMPLEMENT A FUNCTION THAT ACCEPTS AN ARRAY OF INTEGERS. FOR EACH ELEMENT, IF THE COUNT OF SET BITS IS EVEN, INVERT ALL BITS. RETURN THE MODIFIED ARRAY.',
    difficulty: 'medium',
    constraints: [
      'ARRAY SIZE <= 10^5',
      'INT RANGE [-2^31, 2^31 - 1]',
      'TIME LIMIT 1.0S'
    ],
    testCases: [
      { input: '[1, 2, 3]', expectedOutput: '[-2, -3, 3]', isHidden: false },
      { input: '[7, 15, 0]', expectedOutput: '[7, 15, -1]', isHidden: false },
      { input: '[8, 16, 32]', expectedOutput: '[-9, -17, -33]', isHidden: true }
    ],
    starterCode: {
      python: 'def solve(arr):\n    # YOUR LOGIC HERE\n    pass',
      javascript: 'function solve(arr) {\n    // YOUR LOGIC HERE\n}',
      cpp: 'vector<int> solve(vector<int> arr) {\n    // YOUR LOGIC HERE\n}',
      java: 'public int[] solve(int[] arr) {\n    // YOUR LOGIC HERE\n}',
      go: 'func solve(arr []int) []int {\n    // YOUR LOGIC HERE\n}'
    }
  };
};

export const mockExecuteCode = async (code: string, language: string, problem: Problem) => {
  // Simulate code execution
  await new Promise(resolve => setTimeout(resolve, 1000));
  const passed = Math.floor(Math.random() * (problem.testCases.length + 1));
  return {
    passed,
    total: problem.testCases.length,
    executionTime: Math.floor(Math.random() * 50) + 10
  };
};

export const getAIFeedback = async (problem: Problem, code: string, language: string) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    analysis: 'THE IMPLEMENTATION DEMONSTRATES AN EFFICIENT APPROACH TO BIT MANIPULATION. HOWEVER, THE CHOSEN LOOP STRUCTURE COULD BE OPTIMIZED BY CACHING THE BIT_COUNT RESULTS TO AVOID RE-CALCULATION FOR DUPLICATE VALUES IN THE INPUT VECTOR.',
    optimizationTips: [
      'USE A BITMAP CACHE FOR FREQUENTLY ENCOUNTERED INTEGERS.',
      'REPLACE NATIVE LOOPS WITH VECTORIZED OPERATIONS IF SCRIBING IN PYTHON.',
      'ENSURE 64-BIT INTEGER COMPATIBILITY TO PREVENT BUFFER OVERFLOW.'
    ],
    complexity: 'O(N)'
  };
};

export const getComplexityScore = (complexity: string): number => {
  const scores: Record<string, number> = {
    'O(1)': 1,
    'O(log n)': 2,
    'O(n)': 3,
    'O(n log n)': 4,
    'O(n^2)': 5
  };
  return scores[complexity.toLowerCase()] || 5;
};
