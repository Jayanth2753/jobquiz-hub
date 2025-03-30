
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, signOut, userProfile } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-4 px-8 flex items-center justify-between glass-effect sticky top-0 z-10 border-b">
        <Link to="/" className="text-2xl font-semibold">
          TalentBridge
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <User size={16} />
                    {userProfile?.first_name || "Profile"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  {userProfile?.role === "employer" && (
                    <DropdownMenuItem asChild>
                      <Link to="/post-job">Post Job</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/manage-skills">Manage Skills</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="w-full py-6 px-8 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2024 TalentBridge. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
