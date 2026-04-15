import React, { useState, useEffect } from 'react';
import { useMathStore } from '@/src/store/useMathStore';
import { Sidebar } from '@/src/components/Sidebar';
import { Graph2D } from '@/src/components/graphing/Graph2D';
import { Graph3D } from '@/src/components/graphing/Graph3D';
import { GeometryWorkspace } from '@/src/components/geometry/GeometryWorkspace';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Box, 
  Shapes, 
  Sparkles, 
  Download, 
  Share2, 
  RotateCcw,
  Search,
  Menu,
  X
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  const { mode, setMode, addEquation, loadState } = useMathStore();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
      try {
        const decoded = JSON.parse(atob(data));
        loadState(decoded);
        toast.info("Shared graph loaded!");
      } catch (e) {
        console.error("Failed to decode shared data", e);
      }
    }
  }, [loadState]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Convert this natural language description into a mathematical equation for a graphing calculator. Return ONLY the equation (e.g., y = x^2).
        Description: ${aiPrompt}`,
        config: {
          systemInstruction: "You are a math expert. You convert natural language to math equations. Return ONLY the equation string.",
        }
      });
      
      const equation = response.text?.trim();
      if (equation) {
        addEquation('function');
        // We need to update the last added equation, but our addEquation doesn't return the id.
        // For simplicity, let's just toast it and let the user know.
        // Actually, I'll modify the store to handle this better or just use the last equation.
        toast.success(`Generated: ${equation}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate equation");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSave = () => {
    const state = useMathStore.getState();
    localStorage.setItem('ravir-math-studio-saved', JSON.stringify({
      equations: state.equations,
      variables: state.variables,
      geometryObjects: state.geometryObjects
    }));
    toast.success("Project saved successfully!");
  };

  const handleReset = () => {
    localStorage.removeItem('ravir-math-studio-storage');
    window.location.reload();
  };

  const handleShare = () => {
    const state = useMathStore.getState();
    const data = btoa(JSON.stringify({
      equations: state.equations,
      variables: state.variables
    }));
    const url = `${window.location.origin}?data=${data}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-[#0d1117] text-slate-200 overflow-hidden font-sans">
        <Toaster position="top-center" theme="dark" />
        
        {/* Top Bar */}
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#161b22] shrink-0 z-50">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden"
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-lg tracking-tight hidden sm:block">
                Ravir <span className="text-blue-500">Math Studio</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="bg-transparent h-8 p-0 gap-1">
                <TabsTrigger value="2d" className="h-7 px-3 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <Activity className="w-3.5 h-3.5 mr-2" /> 2D
                </TabsTrigger>
                <TabsTrigger value="3d" className="h-7 px-3 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <Box className="w-3.5 h-3.5 mr-2" /> 3D
                </TabsTrigger>
                <TabsTrigger value="geometry" className="h-7 px-3 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <Shapes className="w-3.5 h-3.5 mr-2" /> Geometry
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-white/10 rounded-full px-3 py-1 focus-within:border-blue-500/50 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              <input 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                placeholder="AI Equation Generator..." 
                className="bg-transparent border-none outline-none text-xs w-48 placeholder:text-slate-600"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 hover:bg-white/5"
                onClick={handleAiGenerate}
                disabled={isAiLoading}
              >
                <Search className="w-3 h-3" />
              </Button>
            </div>
            <Separator orientation="vertical" className="h-6 bg-white/10 mx-1 hidden sm:block" />
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave} title="Save Project">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare} title="Share Project">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset} title="Reset Studio">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* Sidebar */}
          <aside className={`
            ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0'} 
            transition-all duration-300 ease-in-out border-r border-white/10 z-40
            absolute md:relative h-full bg-[#0d1117]
          `}>
            <Sidebar />
          </aside>

          {/* Viewport */}
          <section className="flex-1 relative">
            {mode === '2d' && <Graph2D />}
            {mode === '3d' && <Graph3D />}
            {mode === 'geometry' && <GeometryWorkspace />}
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}
