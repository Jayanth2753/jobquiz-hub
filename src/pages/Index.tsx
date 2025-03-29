
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-6 px-8 flex items-center justify-between glass-effect fixed top-0">
        <h1 className="text-2xl font-semibold">TalentBridge</h1>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={signOut} 
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1 pt-24">
        <section className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Connect Talent with Opportunity
            </h2>
            <p className="text-xl text-muted-foreground">
              A modern recruitment platform that matches skills with opportunities.
            </p>
            {!user && (
              <div className="flex gap-4 justify-center pt-4">
                <Link to="/auth?type=employee">
                  <Button size="lg">Find Jobs</Button>
                </Link>
                <Link to="/auth?type=employer">
                  <Button size="lg" variant="outline">
                    Post Jobs
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 animate-slide-in">
              <h3 className="text-lg font-semibold mb-2">Skill-Based Matching</h3>
              <p className="text-muted-foreground">
                Our intelligent system matches your skills with the perfect job opportunities.
              </p>
            </Card>
            <Card className="p-6 animate-slide-in [animation-delay:200ms]">
              <h3 className="text-lg font-semibold mb-2">Automated Assessment</h3>
              <p className="text-muted-foreground">
                Take skill-specific quizzes to showcase your expertise to employers.
              </p>
            </Card>
            <Card className="p-6 animate-slide-in [animation-delay:400ms]">
              <h3 className="text-lg font-semibold mb-2">Secure Platform</h3>
              <p className="text-muted-foreground">
                Your data is protected with enterprise-grade security and role-based access.
              </p>
            </Card>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 px-8 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2024 TalentBridge. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
