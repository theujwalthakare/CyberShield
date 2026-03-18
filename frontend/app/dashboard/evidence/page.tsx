"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export default function EvidencePage() {
  const { getToken } = useAuth();
  const [caseNumber, setCaseNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [annotation, setAnnotation] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !caseNumber) {
      toast.error("Please provide a case number and select a file");
      return;
    }

    setUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("case_number", caseNumber);
      if (annotation) formData.append("annotation", annotation);

      const res = await fetch(`${API_BASE}/evidence/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? "Upload failed");
      }

      toast.success("Evidence uploaded successfully");
      setFile(null);
      setAnnotation("");
      setCaseNumber("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
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

      <Card>
        <CardHeader>
          <CardTitle>Upload Evidence</CardTitle>
          <CardDescription>
            Supported formats: images, PDFs, text files, screenshots. Max 10 MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case_number">Case Number *</Label>
              <Input
                id="case_number"
                placeholder="CS-xxxxxxxx"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="file"
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors"
                >
                  <FileUp className="h-8 w-8 text-muted-foreground" />
                  <span className="mt-2 text-sm text-muted-foreground">
                    {file ? file.name : "Click to select a file"}
                  </span>
                  {file && (
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  )}
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

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Evidence"
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
          <p>• Uploaded evidence is linked to the specified case number.</p>
        </CardContent>
      </Card>
    </div>
  );
}
