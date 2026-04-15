import React, { useEffect } from 'react';
import { useMathStore, EquationType } from '@/src/store/useMathStore';
import { detectVariables, parseEquation } from '@/src/lib/math-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Eye, EyeOff, Settings2, Table as TableIcon, Box, Activity, FunctionSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { TableInput } from './graphing/TableInput';

export const Sidebar: React.FC = () => {
  const { 
    equations, 
    variables, 
    addEquation, 
    updateEquation, 
    removeEquation, 
    addVariable, 
    setVariable,
    updateVariableConfig
  } = useMathStore();

  // Detect variables whenever equations change
  useEffect(() => {
    equations.forEach((eq) => {
      if (eq.latex && eq.type !== 'table') {
        const expr = parseEquation(eq.latex);
        const vars = detectVariables(expr);
        vars.forEach((v) => addVariable(v));
      }
    });
  }, [equations, addVariable]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] border-r border-white/10">
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-[#161b22]/50">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Expressions
        </h2>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-white/5" 
            onClick={() => addEquation('function')} 
            title="Add Function"
          >
            <FunctionSquare className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-white/5" 
            onClick={() => addEquation('table')} 
            title="Add Table"
          >
            <TableIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <AnimatePresence initial={false}>
            {equations.map((eq, index) => (
              <motion.div
                key={eq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-3 bg-[#161b22] border-white/5 hover:border-white/10 transition-all group shadow-lg shadow-black/20">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                      style={{ backgroundColor: eq.color }}
                    />
                    
                    {eq.type === 'table' ? (
                      <span className="text-xs font-medium text-slate-400 flex-1">Data Table</span>
                    ) : (
                      <Input
                        value={eq.latex}
                        onChange={(e) => updateEquation(eq.id, { latex: e.target.value })}
                        placeholder="y = x^2"
                        className="h-8 bg-transparent border-none focus-visible:ring-1 focus-visible:ring-blue-500/50 text-slate-200 font-mono text-sm p-0"
                      />
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-white/5"
                        onClick={() => updateEquation(eq.id, { visible: !eq.visible })}
                      >
                        {eq.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => removeEquation(eq.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {eq.type === 'table' && <TableInput equationId={eq.id} />}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {Object.keys(variables).length > 0 && (
            <div className="pt-4 space-y-6">
              <div className="flex items-center gap-2 px-1">
                <Separator className="flex-1 bg-white/5" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Sliders</span>
                <Separator className="flex-1 bg-white/5" />
              </div>
              
              <div className="space-y-6">
                {Object.values(variables).map((v) => (
                  <div key={v.name} className="space-y-3 px-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <Label className="text-sm font-mono font-medium text-slate-300">
                          {v.name} = <span className="text-blue-400">{v.value.toFixed(2)}</span>
                        </Label>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/5">
                        <Settings2 className="w-3 h-3 text-slate-500" />
                      </Button>
                    </div>
                    <Slider
                      value={[v.value]}
                      min={v.min}
                      max={v.max}
                      step={v.step}
                      onValueChange={(vals: number[]) => setVariable(v.name, vals[0])}
                      className="py-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10 bg-[#161b22]/30">
        <div className="flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-default">
          <Activity className="w-3 h-3 text-blue-500" />
          <p className="text-[10px] font-medium text-slate-400 tracking-tight">
            Ravir Math Studio v1.0
          </p>
        </div>
      </div>
    </div>
  );
};
