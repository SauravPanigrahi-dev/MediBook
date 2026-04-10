import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse, Stethoscope, ShieldCheck } from "lucide-react";

export default function Landing() {
  const { user, login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"patient" | "doctor">("patient");
  const [regInviteCode, setRegInviteCode] = useState("");

  useEffect(() => {
    if (user) {
      setLocation(`/${user.role}/dashboard`);
    }
  }, [user, setLocation]);

  if (user) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email: loginEmail, password: loginPassword });
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login failed", description: error.message || "Invalid credentials" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        inviteCode: regRole === "doctor" ? regInviteCode : undefined,
      });
      toast({ title: "Account created!", description: "Welcome to MediBook." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration failed", description: error.message || "Something went wrong" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-white space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
            Premium Healthcare, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
              When You Need It.
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-white/80 max-w-lg">
            Experience medical care designed around you. Book appointments, manage your health records, and consult top specialists with ease.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4 pt-8">
            <div className="glass-card p-4 rounded-xl flex items-start gap-4 hover-card">
              <div className="p-3 bg-teal-500/20 rounded-lg">
                <HeartPulse className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Instant Booking</h3>
                <p className="text-sm text-white/60">Find and book available slots in seconds.</p>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-start gap-4 hover-card">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <Stethoscope className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Top Specialists</h3>
                <p className="text-sm text-white/60">Verified doctors across all disciplines.</p>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-start gap-4 hover-card sm:col-span-2">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure Records</h3>
                <p className="text-sm text-white/60">Your health data is encrypted and completely private.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00b4db] to-[#0083b0]" />
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 mb-8 p-1 rounded-lg">
              <TabsTrigger value="login" className="data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-md text-white/70 transition-all">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-md text-white/70 transition-all">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 page-transition-enter-active">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    required 
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <Button type="submit" className="w-full btn-primary h-12 text-lg font-medium mt-6" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 page-transition-enter-active">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <Select value={regRole} onValueChange={(v: "patient" | "doctor") => setRegRole(v)}>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input 
                    id="reg-name" 
                    required 
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    required 
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    required 
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="glass-input"
                  />
                </div>
                
                {regRole === "doctor" && (
                  <div className="space-y-2 page-transition-enter-active">
                    <Label htmlFor="invite-code">Doctor Invite Code</Label>
                    <Input 
                      id="invite-code" 
                      required 
                      value={regInviteCode}
                      onChange={e => setRegInviteCode(e.target.value)}
                      className="glass-input"
                      placeholder="Provided by administrator"
                    />
                  </div>
                )}
                
                <Button type="submit" className="w-full btn-primary h-12 text-lg font-medium mt-6" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
