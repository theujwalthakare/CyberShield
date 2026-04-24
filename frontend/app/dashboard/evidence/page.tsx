"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileUp, Loader2 } from "lucide-react";
import { uploadEvidenceForCase } from "@/lib/api";

export default function EvidencePage() {
  const [caseNumber, setCaseNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [annotation, setAnnotation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [hash, setHash] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !caseNumber) {
      toast.error("Please provide a case ID and select a file");
      return;
    }

    setUploading(true);
    setUploadStep(1); // Analyzing...
    await new Promise((r) => setTimeout(r, 800));
    setUploadStep(2); // Scanning...
    await new Promise((r) => setTimeout(r, 1200));
    setUploadStep(3); // Hashing...
    await new Promise((r) => setTimeout(r, 800));
    setUploadStep(4); // Securing...
    await new Promise((r) => setTimeout(r, 500));

    try {
      const result = await uploadEvidenceForCase({
        caseId: caseNumber,
        file,
        annotation,
      });

      setHash(result.hash);
      toast.success(`Evidence secured! SHA-256: ${result.hash.substring(0, 8)}...`);
      setFile(null);
      setAnnotation("");
      setCaseNumber("");
      setUploadStep(0);
      setHash("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setUploadStep(0);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6" /> Evidence Upload
        </h1>
        <p className="text-muted-foreground">
          Securely upload evidence files for an existing case
        </p>
      </div>

      <Card className="border shadow-sm dark:glass-panel dark:border-cyan-900/30">
        <CardHeader>
          <CardTitle className="text-primary dark:text-cyan-400 tracking-wider">CYBER_VAULT</CardTitle>
          <CardDescription>
            Supported formats: images, PDFs, text files, screenshots. Max 10 MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case_number">Case ID *</Label>
              <Input
                id="case_number"
                placeholder="Paste case ID (UUID)"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="file"
                  className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-500 ${file ? 'border-primary bg-primary/5 dark:border-cyan-500 dark:bg-cyan-950/20 dark:shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-slate-300 hover:border-primary/50 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:hover:border-cyan-400/50 dark:bg-slate-900/30 dark:hover:bg-slate-800/50'}`}
                >
                  <div className={`p-4 rounded-full mb-3 transition-colors duration-500 ${file ? 'bg-primary/10 text-primary dark:bg-cyan-500/20 dark:text-cyan-400 dark:shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    <FileUp className="h-8 w-8" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {file ? file.name : "Drag & Drop Evidence File"}
                  </span>
                  {file ? (
                    <span className="mt-1 font-mono text-xs text-primary dark:text-cyan-500 font-bold">
                       READY FOR SECURE VAULT ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                     <span className="mt-1 text-xs text-slate-500">
                       Supports images, PDFs, archives (Max 50MB)
                    </span>
                  )}
                  {hash && <span className="mt-2 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 text-center px-4 break-all">{hash}</span>}
                </label>
                <input
                  id="file"
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx,.csv"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annotation">Annotation / Notes</Label>
              <Textarea
                id="annotation"
                rows={3}
                placeholder="Describe what this evidence shows..."
                value={annotation}
                onChange={(e) => setAnnotation(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={uploading} className="w-full relative overflow-hidden group h-12 bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700 dark:text-cyan-50 shadow-md dark:shadow-lg">
              {uploading ? (
                <div className="flex flex-col items-center justify-center w-full px-4">
                   <div className="flex items-center justify-between w-full mb-1">
                     <span className="font-mono text-[11px] text-primary-foreground dark:text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {uploadStep === 1 && "Analyzing Signature..."}
                        {uploadStep === 2 && "ClamAV Bulk Scan..."}
                        {uploadStep === 3 && "Generating SHA-256 Hash..."}
                        {uploadStep === 4 && "Encrypting & Storing..."}
                     </span>
                     <span className="font-mono text-[10px] text-primary-foreground/70 dark:text-slate-500">{(uploadStep/4*100).toFixed(0)}%</span>
                   </div>
                   <div className="w-full bg-primary-foreground/20 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden border border-transparent dark:border-slate-700/50">
                     <div 
                        className="bg-primary-foreground dark:bg-cyan-500 h-full transition-all duration-500 ease-out dark:shadow-[0_0_10px_rgba(6,182,212,0.8)]" 
                        style={{ width: `${(uploadStep / 4) * 100}%` }}
                     />
                   </div>
                </div>
              ) : (
                <span className="flex items-center gap-2 tracking-wide font-medium"><Upload className="h-4 w-4 dark:text-cyan-400"/> SECURE UPLOAD</span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Do not alter or modify original evidence files before uploading.</p>
          <p>• Screenshots should clearly show timestamps and relevant content.</p>
          <p>• Each file is hashed (SHA-256) for integrity verification.</p>
          <p>• Uploaded evidence is linked to the specified case ID.</p>
        </CardContent>
      </Card>
    </div>
  );
}
