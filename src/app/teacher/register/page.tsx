"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { teacherServices } from "@/services/teacher.services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterStudent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    practiceLocation: "Rwandan"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await teacherServices.registerStudent(formData);
      toast.success("Student registered successfully!");
      // Navigate to the application wizard for the newly created application
      router.push(`/teacher/application/${response.application.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to register student");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
      <Link href="/teacher">
        <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-navy">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workspace
        </Button>
      </Link>
      
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-navy">Register New Student</CardTitle>
          <CardDescription>
            Provision an account for a student and start their Student Application. A password will be automatically generated and emailed to them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                required 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                placeholder="Jean de Dieu"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="student@example.com"
              />
            </div>

            {/* Password field removed - backend generates and emails it */}

            <div className="space-y-2">
              <Label htmlFor="practiceLocation">Practice Location</Label>
              <Select 
                value={formData.practiceLocation} 
                onValueChange={(val) => setFormData({...formData, practiceLocation: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rwandan">Local (Rwanda)</SelectItem>
                  <SelectItem value="Non_Rwandan">Foreign (Non-Rwandan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full bg-navy hover:bg-[#1a2c42] text-white" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Create Student Account & Start Application"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
