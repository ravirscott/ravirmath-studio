import React from 'react';
import { useMathStore } from '@/src/store/useMathStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface TableInputProps {
  equationId: string;
}

export const TableInput: React.FC<TableInputProps> = ({ equationId }) => {
  const { equations, updateEquation } = useMathStore();
  const equation = equations.find(e => e.id === equationId);

  if (!equation || equation.type !== 'table') return null;

  const points = equation.points || [{ x: 0, y: 0 }];

  const updatePoint = (index: number, field: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], [field]: numValue };
    updateEquation(equationId, { points: newPoints });
  };

  const addRow = () => {
    const lastPoint = points[points.length - 1];
    updateEquation(equationId, {
      points: [...points, { x: lastPoint.x + 1, y: lastPoint.y + 1 }]
    });
  };

  const removeRow = (index: number) => {
    if (points.length <= 1) return;
    const newPoints = points.filter((_, i) => i !== index);
    updateEquation(equationId, { points: newPoints });
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
        <span>X</span>
        <span>Y</span>
        <span></span>
      </div>
      <div className="space-y-1">
        {points.map((p, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-center">
            <Input
              type="number"
              value={p.x}
              onChange={(e) => updatePoint(i, 'x', e.target.value)}
              className="h-7 bg-black/20 border-white/5 text-xs px-2"
            />
            <Input
              type="number"
              value={p.y}
              onChange={(e) => updatePoint(i, 'y', e.target.value)}
              className="h-7 bg-black/20 border-white/5 text-xs px-2"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-600 hover:text-red-400"
              onClick={() => removeRow(i)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-7 text-[10px] border border-dashed border-white/10 hover:bg-white/5"
        onClick={addRow}
      >
        <Plus className="w-3 h-3 mr-1" /> Add Row
      </Button>
    </div>
  );
};
