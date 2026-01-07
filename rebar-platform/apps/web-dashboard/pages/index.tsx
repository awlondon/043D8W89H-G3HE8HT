import React, { useEffect, useRef, useState } from 'react';
import {
  AlertOctagon,
  Camera,
  ChevronRight,
  Cpu,
  FileText,
  Gauge,
  Lock,
  Network,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Scan,
  Scale,
  ShieldAlert,
  Target,
  Thermometer,
  TrendingUp,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const ZONES = {
  SAFE: 'SAFE',
  MARGINAL: 'MARGINAL',
  IRREVERSIBLE: 'IRREVERSIBLE',
};

const SUBSYSTEMS = {
  KINETIC: { id: 'KINETIC_CORE', minToLock: 1, label: 'Kinetic Guidance', icon: Gauge },
  ENVIRONMENTAL: { id: 'ENV_THERMAL', minToLock: 1, label: 'Thermal Envelope', icon: Thermometer },
};

const RESET_LEVELS = {
  OP: { id: 'OP', label: 'Operator Clear', auth: 1 },
  MAINT: { id: 'MAINT', label: 'Maintenance Override', auth: 2 },
};

const AnchorAuthority = {
  calculateZone: (anchor: SystemAnchor, value: number) => {
    if (anchor.isLocked || value >= anchor.thresholds.fail) return ZONES.IRREVERSIBLE;
    if (anchor.zone === ZONES.MARGINAL) {
      return value < anchor.thresholds.warn * 0.85 ? ZONES.SAFE : ZONES.MARGINAL;
    }
    return value >= anchor.thresholds.warn ? ZONES.MARGINAL : ZONES.SAFE;
  },
};

const HLSFEngine = {
  tick: (state: SystemState, inputs: number[]) => {
    const events: SystemEvent[] = [];
    let systemLock = state.isIrreversible;

    const nextAnchors = state.anchors.map((anchor, index) => {
      const val = inputs[index];
      const nextZone = AnchorAuthority.calculateZone(anchor, val);

      if (anchor.isLocked && nextZone !== ZONES.IRREVERSIBLE) {
        return { ...anchor, currentValue: val, zone: ZONES.IRREVERSIBLE };
      }

      if (nextZone !== anchor.zone) {
        events.push({
          id: `EV-${Date.now()}-${index}`,
          time: new Date().toLocaleTimeString(),
          type: 'TRANSITION',
          severity: nextZone === ZONES.IRREVERSIBLE ? 'CRITICAL' : 'WARN',
          payload: { id: anchor.id, from: anchor.zone, to: nextZone },
        });
      }

      return {
        ...anchor,
        currentValue: val,
        velocity: Math.abs(val - anchor.currentValue),
        zone: nextZone,
        isLocked: anchor.isLocked || nextZone === ZONES.IRREVERSIBLE,
      };
    });

    const subStates: Record<string, SubsystemState> = {};
    Object.values(SUBSYSTEMS).forEach((sys) => {
      const members = nextAnchors.filter((anchor) => anchor.subsystem === sys.id);
      const locked = members.filter((anchor) => anchor.isLocked).length;
      const isLocked = locked >= sys.minToLock;
      subStates[sys.id] = {
        isLocked,
        marginal: members.filter((anchor) => anchor.zone === ZONES.MARGINAL).length,
        total: members.length,
      };
      if (isLocked) systemLock = true;
    });

    const margin = Math.min(...nextAnchors.map((anchor) => Math.max(0, 100 * (1 - anchor.currentValue / anchor.thresholds.fail))));
    const marginalCount = nextAnchors.filter((anchor) => anchor.zone === ZONES.MARGINAL).length;
    const confidence = systemLock ? 0 : Math.max(0, 100 - marginalCount * 25);

    return {
      anchors: nextAnchors,
      subsystems: subStates,
      metrics: {
        margin,
        fatigue: Math.min(100, state.metrics.fatigue + marginalCount * 0.3 + (systemLock ? 0.5 : 0)),
        confidence,
      },
      isIrreversible: systemLock,
      events,
      timestamp: new Date().toLocaleTimeString(),
    };
  },
};

type SystemAnchor = {
  id: string;
  subsystem: string;
  thresholds: { warn: number; fail: number };
  currentValue: number;
  velocity: number;
  zone: string;
  isLocked: boolean;
  pos: { t: number; l: number };
};

type SystemEvent = {
  id: string;
  time: string;
  type: string;
  severity: string;
  payload: { id?: string; level?: string; from?: string; to?: string };
};

type SubsystemState = { isLocked: boolean; marginal: number; total: number };

type SystemState = {
  anchors: SystemAnchor[];
  subsystems: Record<string, SubsystemState>;
  metrics: { margin: number; fatigue: number; confidence: number };
  isIrreversible: boolean;
  history: Array<{ time: string; margin: number; fatigue: number; confidence: number }>;
  journal: SystemEvent[];
};

export default function RealityAnchorApp() {
  const [system, setSystem] = useState<SystemState>({
    anchors: [
      {
        id: 'AN-01',
        subsystem: SUBSYSTEMS.KINETIC.id,
        thresholds: { warn: 0.35, fail: 0.75 },
        currentValue: 0,
        velocity: 0,
        zone: ZONES.SAFE,
        isLocked: false,
        pos: { t: 30, l: 30 },
      },
      {
        id: 'AN-02',
        subsystem: SUBSYSTEMS.KINETIC.id,
        thresholds: { warn: 0.35, fail: 0.75 },
        currentValue: 0,
        velocity: 0,
        zone: ZONES.SAFE,
        isLocked: false,
        pos: { t: 45, l: 25 },
      },
      {
        id: 'AN-03',
        subsystem: SUBSYSTEMS.ENVIRONMENTAL.id,
        thresholds: { warn: 6.0, fail: 10.0 },
        currentValue: 0,
        velocity: 0,
        zone: ZONES.SAFE,
        isLocked: false,
        pos: { t: 65, l: 75 },
      },
    ],
    subsystems: {},
    metrics: { margin: 100, fatigue: 0, confidence: 100 },
    isIrreversible: false,
    history: [],
    journal: [],
  });

  const [isRunning, setIsRunning] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [authRequest, setAuthRequest] = useState<null | (typeof RESET_LEVELS)[keyof typeof RESET_LEVELS]>(null);
  const [manualInputs, setManualInputs] = useState<number[]>(() => system.anchors.map((anchor) => anchor.currentValue));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && !system.isIrreversible) {
      timerRef.current = setInterval(() => {
        setSystem((prev) => {
          const noise = prev.anchors.map((anchor) => Math.max(0, anchor.currentValue + (Math.random() - 0.47) * 0.22));
          const next = HLSFEngine.tick(prev, noise);
          return {
            ...next,
            history: [...prev.history, { time: next.timestamp, ...next.metrics }].slice(-50),
            journal: [...next.events, ...prev.journal].slice(0, 50),
          };
        });
      }, 800);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, system.isIrreversible]);

  useEffect(() => {
    if (!showAR) {
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      return;
    }
    const initAR = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setShowAR(false);
      }
    };
    initAR();
  }, [showAR]);

  const performReset = (level: (typeof RESET_LEVELS)[keyof typeof RESET_LEVELS]) => {
    setSystem((prev) => ({
      ...prev,
      anchors: prev.anchors.map((anchor) => ({ ...anchor, currentValue: 0, zone: ZONES.SAFE, isLocked: false })),
      isIrreversible: false,
      metrics: { margin: 100, fatigue: 0, confidence: 100 },
      history: [],
      journal: [
        {
          id: `RST-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          type: 'RESET',
          severity: 'INFO',
          payload: { level: level.label },
        },
        ...prev.journal,
      ],
    }));
    setManualInputs(system.anchors.map(() => 0));
    setAuthRequest(null);
  };

  const applyManualInputs = () => {
    setSystem((prev) => {
      const next = HLSFEngine.tick(prev, manualInputs);
      return {
        ...next,
        history: [...prev.history, { time: next.timestamp, ...next.metrics }].slice(-50),
        journal: [...next.events, ...prev.journal].slice(0, 50),
      };
    });
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-slate-100 font-sans selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_50%),radial-gradient(circle_at_center,_rgba(16,185,129,0.08),_transparent_55%)] pointer-events-none" />
      {authRequest && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#121214] border border-white/10 p-8 md:p-12 rounded-[2.5rem] max-w-lg w-full shadow-2xl">
            <ShieldAlert className="text-red-500 mb-6" size={48} />
            <h2 className="text-3xl font-bold tracking-tight mb-2 uppercase">System Authorization</h2>
            <p className="text-slate-500 text-sm mb-8 font-mono leading-relaxed">
              Safety interlock active. Restoration requires verified credentials.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => performReset(RESET_LEVELS.OP)}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all"
              >
                <span className="font-bold text-xs uppercase tracking-widest">Operator Clear</span>
                <ChevronRight size={18} className="text-slate-600" />
              </button>
              <button
                onClick={() => performReset(RESET_LEVELS.MAINT)}
                className="w-full p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex justify-between items-center hover:bg-blue-500/20 transition-all group"
              >
                <span className="font-bold text-xs uppercase tracking-widest text-blue-400">Maint Override</span>
                <Wrench size={18} className="text-blue-400 group-hover:rotate-12 transition-transform" />
              </button>
              <button
                onClick={() => setAuthRequest(null)}
                className="w-full py-4 text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] mt-4"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAR && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
          />
          <div className="relative z-10 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3 font-mono text-[10px] text-blue-500 tracking-widest font-bold uppercase">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Telemetry Lens
            </div>
            <button
              onClick={() => setShowAR(false)}
              className="bg-white/10 p-3 rounded-full hover:bg-red-500/80 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="relative flex-1">
            {system.anchors.map((anchor) => (
              <div
                key={anchor.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${anchor.pos.t}%`, left: `${anchor.pos.l}%` }}
              >
                <div
                  className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all ${
                    anchor.isLocked
                      ? 'border-red-500 bg-red-500/20 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                      : 'border-blue-500/30 bg-blue-500/5'
                  }`}
                >
                  {anchor.isLocked ? <Lock className="text-red-500" size={32} /> : <Scan className="text-blue-500/40" size={32} />}
                </div>
                <div className="mt-6 bg-[#121214]/90 backdrop-blur-xl p-6 rounded-2xl border border-white/5 w-60 shadow-xl">
                  <div className="flex justify-between font-mono text-[9px] text-slate-500 mb-2 uppercase font-bold">
                    <span>{anchor.id}</span>
                    <span className={anchor.isLocked ? 'text-red-500' : 'text-blue-500'}>{anchor.zone}</span>
                  </div>
                  <div className="text-2xl font-bold mb-3 tabular-nums">{anchor.currentValue.toFixed(4)}</div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${anchor.isLocked ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, (anchor.currentValue / anchor.thresholds.fail) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <header className="relative bg-[#121214] border-b border-white/5 px-6 py-8 md:px-12 md:py-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(59,130,246,0.12),_transparent_45%),linear-gradient(300deg,_rgba(14,116,144,0.18),_transparent_55%)] opacity-70" />
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 ring-1 ring-white/10">
              <Target size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase italic">
                Reality Anchor <span className="text-blue-500">Pro</span>
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[9px] font-bold font-mono text-slate-500 uppercase tracking-widest">
                  <Radio size={12} className="text-emerald-500" /> Active Sync
                </span>
                <span className="text-[9px] font-bold font-mono text-slate-700 uppercase tracking-[0.2em]">Build 4.1.0</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto relative z-10">
            <button
              onClick={() => setShowAR(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-bold text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.12)]"
            >
              <Camera size={18} className="text-blue-400" /> Lens
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              disabled={system.isIrreversible}
              className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.15)] ${
                system.isIrreversible
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : isRunning
                    ? 'bg-amber-500 text-white'
                    : 'bg-blue-600 text-white'
              }`}
            >
              {system.isIrreversible ? <AlertOctagon size={18} /> : isRunning ? <Pause size={18} /> : <Play size={18} />}
              {system.isIrreversible ? 'Interlocked' : isRunning ? 'Halt' : 'Execute'}
            </button>
            <button
              onClick={() => setAuthRequest(RESET_LEVELS.OP)}
              className="p-4 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <RefreshCw size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-[#0f1012] border border-white/10 p-6 rounded-[2rem] shadow-[0_25px_60px_-40px_rgba(59,130,246,0.6)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Wrench size={14} className="text-blue-500" /> Operator Input Deck
                  </div>
                  <div className="text-sm font-semibold text-white mt-2">Tune anchor vectors in real time.</div>
                </div>
                <button
                  onClick={() => setManualInputs(system.anchors.map((anchor) => anchor.currentValue))}
                  className="text-[9px] uppercase tracking-[0.3em] text-slate-500 hover:text-slate-200 transition-colors"
                >
                  Sync
                </button>
              </div>
              <div className="space-y-5">
                {system.anchors.map((anchor, index) => {
                  const maxValue = anchor.thresholds.fail * 1.2;
                  return (
                    <div key={anchor.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{anchor.id}</div>
                        <div className="text-[10px] font-mono text-slate-500">{anchor.subsystem === SUBSYSTEMS.KINETIC.id ? 'Kinetic' : 'Thermal'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={maxValue}
                          step={anchor.subsystem === SUBSYSTEMS.ENVIRONMENTAL.id ? 0.1 : 0.01}
                          value={manualInputs[index] ?? 0}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setManualInputs((prev) => prev.map((entry, i) => (i === index ? value : entry)));
                          }}
                          className="w-full accent-blue-500"
                        />
                        <input
                          type="number"
                          min={0}
                          max={maxValue}
                          step={anchor.subsystem === SUBSYSTEMS.ENVIRONMENTAL.id ? 0.1 : 0.01}
                          value={manualInputs[index] ?? 0}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setManualInputs((prev) => prev.map((entry, i) => (i === index ? value : entry)));
                          }}
                          className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={applyManualInputs}
                  className="py-3 rounded-xl bg-blue-600 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-blue-500 transition-all"
                >
                  Apply Inputs
                </button>
                <button
                  onClick={() => setManualInputs(system.anchors.map(() => 0))}
                  className="py-3 rounded-xl bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                >
                  Zero Load
                </button>
              </div>
            </section>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Safety Margin', val: system.metrics.margin, color: 'text-emerald-500', icon: Scale },
                { label: 'System Fatigue', val: system.metrics.fatigue, color: 'text-amber-500', icon: Zap },
                { label: 'Network Trust', val: system.metrics.confidence, color: 'text-blue-500', icon: Cpu },
              ].map((metric) => (
                <div key={metric.label} className="bg-[#121214] border border-white/5 p-6 rounded-3xl relative overflow-hidden group shadow-[0_20px_50px_-40px_rgba(15,23,42,0.8)]">
                  <metric.icon className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-all ${metric.color}`} size={80} />
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 tracking-widest">{metric.label}</div>
                  <div className={`text-4xl font-bold tracking-tight tabular-nums ${metric.color}`}>
                    {metric.val.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#121214] border border-white/5 p-8 rounded-[2rem]">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                <Network size={16} className="text-blue-500" /> Topology
              </h2>
              <div className="space-y-4">
                {Object.values(SUBSYSTEMS).map((sys) => {
                  const state = system.subsystems[sys.id] || { isLocked: false, marginal: 0, total: 0 };
                  const Icon = sys.icon;
                  return (
                    <div
                      key={sys.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        state.isLocked ? 'bg-red-500/5 border-red-500/20' : 'bg-black/20 border-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <Icon size={16} className={state.isLocked ? 'text-red-500' : 'text-slate-500'} />
                          <span className="font-bold text-[11px] uppercase tracking-wide">{sys.label}</span>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full ${state.isLocked ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-600 uppercase">
                        <span>Marginal Load</span>
                        <span className={state.marginal > 0 ? 'text-amber-500' : ''}>
                          {state.marginal} / {state.total}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#121214] border border-white/5 p-8 rounded-[2rem] h-[350px] flex flex-col">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                <FileText size={16} className="text-blue-500" /> Event Journal
              </h2>
              <div className="flex-1 overflow-y-auto space-y-4 font-mono text-[9px] pr-2">
                {system.journal.length === 0 && <div className="text-slate-800 italic uppercase">Log Idle...</div>}
                {system.journal.map((event) => (
                  <div key={event.id} className="flex gap-4 border-l-2 border-white/5 pl-4 py-1">
                    <span className="text-slate-700 shrink-0">[{event.time}]</span>
                    <span className={event.severity === 'CRITICAL' ? 'text-red-500 font-bold' : 'text-slate-500 uppercase'}>
                      {event.type}: {event.payload.id || event.payload.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <section className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-xl overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
                  <TrendingUp size={18} className="text-blue-500" /> Vector Stability
                </h2>
                <div className="flex gap-8 font-mono text-[9px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2 text-emerald-500/60">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Margin
                  </div>
                  <div className="flex items-center gap-2 text-blue-500/60">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> Trust
                  </div>
                </div>
              </div>
              <div className="h-[400px] md:h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={system.history}>
                    <defs>
                      <linearGradient id="safetyG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="confG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #ffffff10',
                        borderRadius: '16px',
                        fontSize: '10px',
                        color: '#fff',
                      }}
                    />
                    <Area type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={3} fill="url(#safetyG)" isAnimationActive={false} />
                    <Area type="stepAfter" dataKey="confidence" stroke="#3b82f6" strokeWidth={2} fill="url(#confG)" isAnimationActive={false} />
                    <ReferenceLine
                      y={20}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      opacity={0.3}
                      label={{ position: 'right', value: 'TERMINAL', fill: '#ef4444', fontSize: 8, fontWeight: 'bold' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {system.anchors.map((anchor) => (
                <div
                  key={anchor.id}
                  className={`p-8 rounded-[2rem] border transition-all ${
                    anchor.isLocked ? 'bg-red-500/5 border-red-500/20' : 'bg-[#121214] border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">
                        {anchor.id}
                      </div>
                      <div className="font-bold text-sm uppercase tracking-tight">
                        {anchor.subsystem === SUBSYSTEMS.KINETIC.id ? 'Kinetic' : 'Thermal'} Vector
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                        anchor.isLocked ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {anchor.zone}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold tracking-tighter tabular-nums">{anchor.currentValue.toFixed(4)}</span>
                    <span className="text-[10px] text-slate-600 font-mono uppercase">Value</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-bold text-slate-700 uppercase tracking-widest">
                      <span>Threshold Load</span>
                      <span>{Math.min(100, (anchor.currentValue / anchor.thresholds.fail) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${anchor.isLocked ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, (anchor.currentValue / anchor.thresholds.fail) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 px-6 py-12 md:px-12 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex gap-10 font-mono text-[9px] font-bold text-slate-700 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${system.isIrreversible ? 'bg-red-500' : 'bg-emerald-500'}`} /> Logic:{' '}
              {system.isIrreversible ? 'TERMINAL' : 'STABLE'}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Network: SYNCED
            </span>
          </div>
          <div className="text-[9px] font-bold text-slate-800 uppercase tracking-[0.3em]">
            Reality Anchor Framework v4.1.0 // 2024 Deployment
          </div>
        </div>
      </footer>
    </div>
  );
}
