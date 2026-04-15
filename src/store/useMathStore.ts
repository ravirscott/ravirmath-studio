import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EquationType = 'function' | 'parametric' | 'polar' | 'table';

export interface Equation {
  id: string;
  latex: string;
  color: string;
  visible: boolean;
  type: EquationType;
  points?: { x: number; y: number }[]; // For table type
}

export interface Variable {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export interface GeometryObject {
  id: string;
  type: 'point' | 'line' | 'circle' | 'polygon';
  points: { x: number; y: number }[];
  color: string;
  label?: string;
}

interface MathStudioState {
  equations: Equation[];
  variables: Record<string, Variable>;
  geometryObjects: GeometryObject[];
  mode: '2d' | '3d' | 'geometry';
  viewport: {
    center: [number, number];
    zoom: number;
  };
  
  // Actions
  addEquation: (type?: EquationType) => void;
  updateEquation: (id: string, updates: Partial<Equation>) => void;
  removeEquation: (id: string) => void;
  setMode: (mode: '2d' | '3d' | 'geometry') => void;
  setViewport: (viewport: Partial<MathStudioState['viewport']>) => void;
  setVariable: (name: string, value: number) => void;
  addVariable: (name: string) => void;
  updateVariableConfig: (name: string, updates: Partial<Variable>) => void;
  
  // Geometry Actions
  addGeometryObject: (obj: Omit<GeometryObject, 'id'>) => void;
  updateGeometryObject: (id: string, updates: Partial<GeometryObject>) => void;
  removeGeometryObject: (id: string) => void;
  loadState: (data: Partial<MathStudioState>) => void;
}

const COLORS = [
  '#2563eb', // blue-600
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#9333ea', // purple-600
  '#ea580c', // orange-600
  '#0891b2', // cyan-600
  '#be185d', // pink-600
];

export const useMathStore = create<MathStudioState>()(
  persist(
    (set) => ({
      equations: [
        { id: '1', latex: 'y = x^2', color: COLORS[0], visible: true, type: 'function' },
      ],
      variables: {},
      geometryObjects: [],
      mode: '2d',
      viewport: {
        center: [0, 0],
        zoom: 1,
      },

      addEquation: (type = 'function') => set((state) => {
        const id = Math.random().toString(36).substr(2, 9);
        const color = COLORS[state.equations.length % COLORS.length];
        return {
          equations: [...state.equations, { id, latex: '', color, visible: true, type }]
        };
      }),

      updateEquation: (id, updates) => set((state) => ({
        equations: state.equations.map((eq) => eq.id === id ? { ...eq, ...updates } : eq)
      })),

      removeEquation: (id) => set((state) => ({
        equations: state.equations.filter((eq) => eq.id !== id)
      })),

      setMode: (mode) => set({ mode }),

      setViewport: (viewport) => set((state) => ({
        viewport: { ...state.viewport, ...viewport }
      })),

      setVariable: (name, value) => set((state) => ({
        variables: {
          ...state.variables,
          [name]: { ...state.variables[name], value }
        }
      })),

      addVariable: (name) => set((state) => {
        if (state.variables[name]) return state;
        return {
          variables: {
            ...state.variables,
            [name]: { name, value: 1, min: -10, max: 10, step: 0.1 }
          }
        };
      }),

      updateVariableConfig: (name, updates) => set((state) => ({
        variables: {
          ...state.variables,
          [name]: { ...state.variables[name], ...updates }
        }
      })),

      addGeometryObject: (obj) => set((state) => ({
        geometryObjects: [...state.geometryObjects, { ...obj, id: Math.random().toString(36).substr(2, 9) }]
      })),

      updateGeometryObject: (id, updates) => set((state) => ({
        geometryObjects: state.geometryObjects.map((obj) => obj.id === id ? { ...obj, ...updates } : obj)
      })),

      removeGeometryObject: (id) => set((state) => ({
        geometryObjects: state.geometryObjects.filter((obj) => obj.id !== id)
      })),

      loadState: (data) => set((state) => ({
        ...state,
        ...data
      })),
    }),
    {
      name: 'ravir-math-studio-storage',
    }
  )
);
