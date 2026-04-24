"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCaseFromReport } from "@/lib/api";

const crimeTypes = [
  "Phishing",
  "Identity Theft",
  "Online Fraud",
  "Ransomware",
  "Cyberstalking",
  "Data Breach",
  "Social Media Crime",
  "Financial Fraud",
  "Hacking",
  "Other",
] as const;

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
] as const;

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(300, "Title must be under 300 characters"),
  description: z.string().min(10, "Please provide more details (min 10 chars)"),
  crime_type: z.string().min(2, "Please select a crime type"),
  incident_date: z.string().optional(),
  financial_loss: z.number().min(0).default(0),
  currency: z.string().default("INR"),
  affected_platform: z.string().optional(),
  suspect_info: z.string().optional(),
  victim_area: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const resolver = zodResolver(formSchema);

export default function ReportIncidentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver,
    defaultValues: {
      title: "",
      description: "",
      crime_type: "",
      incident_date: "",
      financial_loss: 0,
      currency: "INR",
      affected_platform: "",
      suspect_info: "",
      victim_area: "",
      district: "",
      state: "",
    },
  });

  async function onSubmit(data: Record<string, unknown>) {
    setSubmitting(true);
    try {
      const created = await createCaseFromReport({
        title: String(data.title ?? ""),
        description: String(data.description ?? ""),
        crime_type: String(data.crime_type ?? ""),
        incident_date: data.incident_date ? String(data.incident_date) : undefined,
        financial_loss: Number(data.financial_loss ?? 0),
        affected_platform: data.affected_platform
          ? String(data.affected_platform)
          : undefined,
        district: data.district ? String(data.district) : undefined,
        state: data.state ? String(data.state) : undefined,
      });
      toast.success(`Case ${created.case_number} created successfully`);
      router.push("/dashboard/cases");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Report a Cybercrime Incident</h1>
        <p className="text-muted-foreground">
          Provide details about the incident. All fields marked * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Incident Details */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Details</CardTitle>
            <CardDescription>
              Describe what happened and when it occurred.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of the incident"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="Detailed description of the cybercrime incident..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Crime Type *</Label>
                <Select
                  onValueChange={(val: string | null) => { if (val) setValue("crime_type", val); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {crimeTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.crime_type && (
                  <p className="text-sm text-destructive">
                    {errors.crime_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="incident_date">Date of Incident</Label>
                <Input
                  id="incident_date"
                  type="date"
                  {...register("incident_date")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="affected_platform">
                Affected Platform / Website
              </Label>
              <Input
                id="affected_platform"
                placeholder="e.g. Facebook, Gmail, Paytm..."
                {...register("affected_platform")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Impact */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Impact</CardTitle>
            <CardDescription>
              If there was financial loss, provide the amount.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="financial_loss">Loss Amount</Label>
                <Input
                  id="financial_loss"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register("financial_loss", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  defaultValue="INR"
                  onValueChange={(val: string | null) => { if (val) setValue("currency", val); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Suspect Info */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Suspect Info</CardTitle>
            <CardDescription>
              Help us understand where this happened and any suspect details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>State</Label>
                <Select onValueChange={(val: string | null) => { if (val) setValue("state", val); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  placeholder="District name"
                  {...register("district")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="victim_area">Locality / Area</Label>
              <Input
                id="victim_area"
                placeholder="Locality or pin code"
                {...register("victim_area")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suspect_info">Suspect Information</Label>
              <Textarea
                id="suspect_info"
                rows={3}
                placeholder="Phone numbers, social media handles, email IDs, UPI IDs, bank details..."
                {...register("suspect_info")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </form>
    </div>
  );
}
