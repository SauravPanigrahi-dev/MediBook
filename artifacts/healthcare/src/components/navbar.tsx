import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, Search, User as UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useSearch } from "@workspace/api-client-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults } = useSearch(
    { q: debouncedQuery, type: "all" },
    { query: { enabled: debouncedQuery.length >= 2 } }
  );

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-card rounded-none border-x-0 border-t-0 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00b4db] to-[#0083b0] flex items-center justify-center text-white font-bold">M</div>
          MediBook
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-4">
            {user.role === "patient" && (
              <>
                <Link href="/patient/dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</Link>
                <Link href="/patient/book" className="text-white/80 hover:text-white transition-colors">Book</Link>
                <Link href="/patient/appointments" className="text-white/80 hover:text-white transition-colors">Appointments</Link>
                <Link href="/patient/reports" className="text-white/80 hover:text-white transition-colors">Reports</Link>
              </>
            )}
            {user.role === "doctor" && (
              <>
                <Link href="/doctor/dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</Link>
                <Link href="/doctor/calendar" className="text-white/80 hover:text-white transition-colors">Calendar</Link>
                <Link href="/doctor/analytics" className="text-white/80 hover:text-white transition-colors">Analytics</Link>
              </>
            )}
            {user.role === "admin" && (
              <>
                <Link href="/admin/dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</Link>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctors, reports..."
              className="glass-input pl-9 h-9"
            />
            {debouncedQuery.length >= 2 && searchResults && (
              <div className="absolute top-full mt-2 w-full glass-card p-2 flex flex-col gap-2 max-h-96 overflow-y-auto">
                {searchResults.doctors.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-white/50 uppercase px-2 mb-1">Doctors</div>
                    {searchResults.doctors.map(d => (
                      <Link key={d.id} href={`/patient/book?doctor=${d.id}`} className="block px-2 py-1.5 hover:bg-white/10 rounded-md text-sm text-white">
                        Dr. {d.name} - {d.specialization}
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.reports.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-white/50 uppercase px-2 mb-1 mt-2">Reports</div>
                    {searchResults.reports.map(r => (
                      <Link key={r.id} href={`/patient/reports?id=${r.id}`} className="block px-2 py-1.5 hover:bg-white/10 rounded-md text-sm text-white">
                        {r.title}
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.doctors.length === 0 && searchResults.reports.length === 0 && (
                  <div className="p-2 text-sm text-white/50">No results found</div>
                )}
              </div>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-white hover:bg-white/10 rounded-full w-9 h-9"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20">
                <UserIcon className="w-4 h-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-white/20 w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="w-[200px] truncate text-sm text-white/60">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer text-white">
                <Link href={`/${user.role}/profile`}>Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="hover:bg-white/10 cursor-pointer text-red-400 focus:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild className="btn-primary h-9">
            <Link href="/">Sign In</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
