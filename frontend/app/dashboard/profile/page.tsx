"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Shield, Bell, FileText, Smartphone, Laptop, Key, LogOut, AlertTriangle, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900 dark:text-white mb-2">
          <User className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
          My Profile & Security
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your identity verification, security preferences, and incident history.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <TabsTrigger value="general" className="py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">
            <User className="w-4 h-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="security" className="py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">
            <Shield className="w-4 h-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="history" className="py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">
            <FileText className="w-4 h-4 mr-2" /> Case History
          </TabsTrigger>
        </TabsList>

        {/* GENERAL TAB */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Identity Verification</CardTitle>
                  <CardDescription>Your KYC (Know Your Customer) status for official reporting.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 flex items-center gap-1 py-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Government ID Verified
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Legal Name</Label>
                  <Input id="fullName" defaultValue="Jane Doe" disabled className="bg-slate-50 dark:bg-slate-900/50 text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" defaultValue="1990-05-15" disabled className="bg-slate-50 dark:bg-slate-900/50 text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" defaultValue="jane.doe@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+91 98765 43210" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Multi-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your CyberShield Nexus account.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">Authenticator App</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Use an app like Google Authenticator to generate codes.</p>
              </div>
              <Button 
                variant={is2FAEnabled ? "outline" : "default"}
                onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                className={!is2FAEnabled ? "bg-cyan-600 hover:bg-cyan-700 text-white" : ""}
              >
                {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Active Sessions</CardTitle>
              <CardDescription>Manage the devices currently logged into your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                    <Laptop className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Windows PC • Chrome</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Current Session • Mumbai, IN</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400 border-none">Active Now</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                    <Smartphone className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">iPhone 14 • Safari</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Last active: 2 hours ago • Delhi, IN</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                  <LogOut className="w-4 h-4 mr-2" /> Revoke
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Alert Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified about case updates and threats.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: "Case Status Updates", desc: "Get notified when authorities update your reported incidents." },
                { title: "Critical Security Advisories", desc: "Receive immediate alerts for zero-day vulnerabilities and local threats." },
                { title: "Monthly Threat Report", desc: "A summary of cybercrime trends in your region." }
              ].map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-base">{item.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant={i === 2 ? "outline" : "default"} size="sm" className={i !== 2 ? "bg-cyan-600 hover:bg-cyan-700 text-white" : ""}>
                      Email {i !== 2 ? "On" : "Off"}
                    </Button>
                    <Button variant={i === 0 ? "default" : "outline"} size="sm" className={i === 0 ? "bg-cyan-600 hover:bg-cyan-700 text-white" : ""}>
                      SMS {i === 0 ? "On" : "Off"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CASE HISTORY TAB */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl">My Reported Incidents</CardTitle>
                <CardDescription>Track the progress of your submitted reports.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-800 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 inline" /> Action Required (1)
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                      <TableHead className="font-semibold">Case ID</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Date Filed</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableCell className="font-mono text-xs">CYB-2026-9042</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">Financial Fraud (UPI)</TableCell>
                      <TableCell className="text-slate-500">Oct 24, 2026</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                          Under Investigation
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-cyan-600 hover:text-cyan-700">View Details</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableCell className="font-mono text-xs">CYB-2026-4412</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">Social Media Hacking</TableCell>
                      <TableCell className="text-slate-500">Sep 12, 2026</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-800">
                          Evidence Required
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="default" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">Upload Docs</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableCell className="font-mono text-xs">CYB-2025-1109</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">Phishing Setup</TableCell>
                      <TableCell className="text-slate-500">Dec 05, 2025</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                          Resolved
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">Archived</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}