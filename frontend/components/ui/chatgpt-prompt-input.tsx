"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { toast } from "sonner";

// --- cn utility ---
type ClassValue = string | number | boolean | null | undefined;
function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}

// --- Radix Primitives ---
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & { showArrow?: boolean }
>(({ className, sideOffset = 4, showArrow = false, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "relative z-50 max-w-[280px] rounded-md bg-popover text-popover-foreground px-1.5 py-1 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      {props.children}
      {showArrow && <TooltipPrimitive.Arrow className="-my-px fill-popover" />}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-64 rounded-xl bg-popover dark:bg-[#1e293b] p-2 text-popover-foreground dark:text-white shadow-md outline-none animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[90vw] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border-none bg-transparent p-0 shadow-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      <div className="relative bg-card dark:bg-[#1e293b] rounded-[28px] overflow-hidden shadow-2xl p-1">
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 z-10 rounded-full bg-background/50 dark:bg-slate-800 p-1 hover:bg-accent dark:hover:bg-slate-700 transition-all">
          <XIcon className="h-5 w-5 text-muted-foreground dark:text-gray-200 hover:text-foreground dark:hover:text-white" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </div>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// --- Icons ---
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 5V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Settings2Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 7h-9" /><path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
  </svg>
);
const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 5.25L12 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.75 12L12 5.25L5.25 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const ShieldIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const AlertIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
  </svg>
);

// --- SiriOrb ---
interface SiriOrbProps {
  size?: string;
  className?: string;
  animationDuration?: number;
}
export const SiriOrb: React.FC<SiriOrbProps> = ({ size = "120px", className, animationDuration = 8 }) => {
  const sizeValue = parseInt(size.replace("px", ""), 10);
  const blurAmount = Math.max(sizeValue * 0.08, 8);
  const contrastAmount = Math.max(sizeValue * 0.003, 1.8);

  return (
    <div
      className={cn("siri-orb", className)}
      style={{
        width: size,
        height: size,
        ["--blur-amount" as string]: `${blurAmount}px`,
        ["--contrast-amount" as string]: contrastAmount,
        ["--animation-duration" as string]: `${animationDuration}s`,
      }}
    >
      <style>{`
        @property --angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        .siri-orb {
          display: grid;
          grid-template-areas: "stack";
          overflow: hidden;
          border-radius: 50%;
          position: relative;
          background: radial-gradient(circle, rgba(0,0,0,0.06) 0%, transparent 70%);
        }
        .dark .siri-orb {
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
        }
        .siri-orb::before {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background:
            conic-gradient(from calc(var(--angle) * 1.2) at 30% 65%, oklch(75% 0.18 200) 0deg, transparent 45deg 315deg, oklch(75% 0.18 200) 360deg),
            conic-gradient(from calc(var(--angle) * 0.8) at 70% 35%, oklch(80% 0.15 180) 0deg, transparent 60deg 300deg, oklch(80% 0.15 180) 360deg),
            conic-gradient(from calc(var(--angle) * -1.5) at 65% 75%, oklch(72% 0.2 210) 0deg, transparent 90deg 270deg, oklch(72% 0.2 210) 360deg),
            radial-gradient(ellipse 120% 80% at 40% 60%, oklch(78% 0.16 195) 0%, transparent 50%);
          filter: blur(var(--blur-amount)) contrast(var(--contrast-amount)) saturate(1.4);
          animation: siri-rotate var(--animation-duration) linear infinite;
          will-change: transform;
        }
        .siri-orb::after {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at 45% 55%, rgba(255,255,255,0.12) 0%, transparent 60%);
          mix-blend-mode: overlay;
        }
        @keyframes siri-rotate {
          from { --angle: 0deg; }
          to { --angle: 360deg; }
        }
        @media (prefers-reduced-motion: reduce) {
          .siri-orb::before { animation: none; }
        }
      `}</style>
    </div>
  );
};

// --- Tools list (cybersecurity-themed) ---
const toolsList = [
  { id: "threatAnalysis", name: "Analyze a threat", shortName: "Threat", icon: ShieldIcon },
  { id: "searchWeb",      name: "Search threat intel", shortName: "Search", icon: GlobeIcon },
  { id: "incidentReport", name: "Report an incident", shortName: "Report", icon: AlertIcon },
];

// --- PromptBox ---
export interface PromptBoxProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSend?: (text: string, imageDataUrl?: string | null) => void;
  loading?: boolean;
}

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export const PromptBox = React.forwardRef<HTMLTextAreaElement, PromptBoxProps>(
  ({ className, onSend, loading = false, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [value, setValue] = React.useState("");
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [selectedTool, setSelectedTool] = React.useState<string | null>(null);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isImageDialogOpen, setIsImageDialogOpen] = React.useState(false);
    const [isListening, setIsListening] = React.useState(false);
    const recognitionRef = React.useRef<BrowserSpeechRecognition | null>(null);
    const transcriptRef = React.useRef("");

    const stopVoice = React.useCallback(() => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }, []);

    React.useEffect(() => {
      return () => {
        recognitionRef.current?.stop();
      };
    }, []);

    React.useImperativeHandle(ref, () => internalRef.current!, []);

    React.useLayoutEffect(() => {
      const ta = internalRef.current;
      if (ta) {
        ta.style.height = "auto";
        ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
      }
    }, [value]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file?.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
      e.target.value = "";
    };

    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setImagePreview(null);
    };

    const handleSubmit = () => {
      if ((!value.trim() && !imagePreview) || loading) return;
      onSend?.(value.trim(), imagePreview);
      setValue("");
      setImagePreview(null);
    };

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const toggleVoice = async () => {
      if (loading) return;

      if (isListening) {
        stopVoice();
        return;
      }

      const SpeechRecognition = (
        window as unknown as {
          SpeechRecognition?: BrowserSpeechRecognitionConstructor;
          webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
        }
      ).SpeechRecognition || (
        window as unknown as {
          webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
        }
      ).webkitSpeechRecognition;

      if (!window.isSecureContext) {
        toast.error("Voice recording requires a secure context (HTTPS or localhost).");
        return;
      }

      if (!SpeechRecognition) {
        toast.error("Voice recording is not supported in this browser. Use Chrome or Edge.");
        return;
      }

      // Validate raw microphone access first. This avoids ambiguous SpeechRecognition failures.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        toast.error("Microphone access is blocked at browser or OS level. Enable it and retry.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = true;
      recognition.continuous = true;

      transcriptRef.current = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = transcriptRef.current;
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalTranscript += `${transcript} `;
          } else {
            interimTranscript += transcript;
          }
        }

        transcriptRef.current = finalTranscript;
        const combined = `${finalTranscript}${interimTranscript}`.trim();
        setValue(combined);
      };
      recognition.onend = () => {
        const finalText = transcriptRef.current.trim();
        setIsListening(false);
        recognitionRef.current = null;
        if (finalText && !loading) {
          onSend?.(finalText, null);
          setValue("");
        }
      };
      recognition.onerror = (event: Event) => {
        const speechEvent = event as Event & { error?: string };
        const code = speechEvent.error;

        if (code === "not-allowed") {
          toast.error("Microphone permission denied. Please allow mic access and try again.");
        } else if (code === "service-not-allowed") {
          toast.error("Speech recognition service is blocked in this browser/profile. Try Chrome or Edge regular mode.");
        } else if (code === "audio-capture") {
          toast.error("No microphone detected. Please connect a mic and retry.");
        } else if (code === "network") {
          toast.error("Speech recognition network error. Please check your connection.");
        } else if (code === "no-speech") {
          toast.error("No speech detected. Try speaking louder and closer to the mic.");
        } else {
          toast.error("Unable to start voice recording. Please try again.");
        }

        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        recognitionRef.current = null;
        setIsListening(false);
        toast.error("Voice recording could not be started. Please try again.");
      }
    };

    const hasValue = value.trim().length > 0 || !!imagePreview;
    const activeTool = selectedTool ? toolsList.find((t) => t.id === selectedTool) : null;
    const ActiveToolIcon = activeTool?.icon;

    return (
      <div
        className={cn(
          "flex flex-col rounded-[28px] p-2 shadow-sm transition-colors bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 cursor-text",
          className
        )}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

        {/* Image preview */}
        {imagePreview && (
          <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
            <div className="relative mb-1 w-fit rounded-[1rem] px-1 pt-1">
              <button type="button" onClick={() => setIsImageDialogOpen(true)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="h-14 w-14 rounded-[1rem] object-cover" />
              </button>
              <button
                onClick={handleRemoveImage}
                className="absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-white/70 dark:bg-slate-800 text-black dark:text-white hover:bg-accent"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
            <DialogContent>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Full preview" className="w-full max-h-[95vh] object-contain rounded-[24px]" />
            </DialogContent>
          </Dialog>
        )}

        {/* Voice mode overlay */}
        {isListening && (
          <div className="flex flex-col items-center justify-center py-4 gap-3">
            <SiriOrb size="80px" animationDuration={6} />
            <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">Listening… speak now</p>
          </div>
        )}

        {/* Textarea */}
        {!isListening && (
          <textarea
            ref={internalRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about a cyber threat, incident, or security practice..."
            className="w-full resize-none border-0 bg-transparent p-3 text-foreground dark:text-white placeholder:text-muted-foreground focus:ring-0 focus-visible:outline-none min-h-12"
            {...props}
          />
        )}

        {/* Toolbar */}
        <div className="mt-0.5 p-1 pt-0">
          <TooltipProvider delayDuration={100}>
            <div className="flex items-center gap-2">
              {/* Attach */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-foreground dark:text-white transition-colors hover:bg-accent dark:hover:bg-slate-800 focus-visible:outline-none"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span className="sr-only">Attach image</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" showArrow>
                  <p>Attach image</p>
                </TooltipContent>
              </Tooltip>

              {/* Tools popover */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-8 items-center gap-2 rounded-full p-2 text-sm text-foreground dark:text-white transition-colors hover:bg-accent dark:hover:bg-slate-800 focus-visible:outline-none"
                      >
                        <Settings2Icon className="h-4 w-4" />
                        {!selectedTool && <span>Tools</span>}
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" showArrow>
                    <p>Explore Tools</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent side="top" align="start">
                  <div className="flex flex-col gap-1">
                    {toolsList.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => { setSelectedTool(tool.id); setIsPopoverOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent dark:hover:bg-slate-700"
                      >
                        <tool.icon className="h-4 w-4" />
                        <span>{tool.name}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Active tool chip */}
              {activeTool && (
                <>
                  <div className="h-4 w-px bg-border dark:bg-slate-600" />
                  <button
                    onClick={() => setSelectedTool(null)}
                    className="flex h-8 items-center gap-2 rounded-full px-2 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-accent dark:hover:bg-slate-800 transition-colors"
                  >
                    {ActiveToolIcon && <ActiveToolIcon className="h-4 w-4" />}
                    {activeTool.shortName}
                    <XIcon className="h-3 w-3" />
                  </button>
                </>
              )}

              {/* Right side: mic + send */}
              <div className="ml-auto flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={toggleVoice}
                      disabled={loading}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                        isListening
                          ? "bg-cyan-500 text-white"
                          : "text-foreground dark:text-white hover:bg-accent dark:hover:bg-slate-800"
                      )}
                    >
                      <MicIcon className="h-5 w-5" />
                      <span className="sr-only">{isListening ? "Stop recording" : "Record voice"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" showArrow>
                    <p>{isListening ? "Stop recording" : "Record voice"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={!hasValue || loading}
                      onClick={handleSubmit}
                      className="flex h-8 w-8 items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-slate-300 dark:disabled:bg-slate-700"
                    >
                      <SendIcon className="h-4 w-4" />
                      <span className="sr-only">Send</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" showArrow>
                    <p>Send</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </div>
    );
  }
);
PromptBox.displayName = "PromptBox";
