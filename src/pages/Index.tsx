
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Briefcase, CheckCircle } from "lucide-react";

const Index = () => {
  const { user, userRole } = useAuth();
  
  return (
    <div className="min-h-screen">
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Connect Talent with Opportunity
            </h2>
            <p className="text-xl text-muted-foreground">
              A modern recruitment platform that matches skills with opportunities.
            </p>
            {!user ? (
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
            ) : (
              <div className="flex gap-4 justify-center pt-4">
                <Link to="/dashboard">
                  <Button size="lg">Go to Dashboard</Button>
                </Link>
                {userRole === 'employee' && (
                  <Link to="/generate-quiz">
                    <Button size="lg" variant="outline">
                      <Sparkles className="mr-2 h-4 w-4" /> Generate Quiz
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 animate-slide-in">
              <div className="flex items-center mb-4">
                <Briefcase className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold">Skill-Based Matching</h3>
              </div>
              <p className="text-muted-foreground">
                Our intelligent system matches your skills with the perfect job opportunities.
              </p>
            </Card>
            <Card className="p-6 animate-slide-in [animation-delay:200ms]">
              <div className="flex items-center mb-4">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold">Automated Assessment</h3>
              </div>
              <p className="text-muted-foreground">
                Take skill-specific quizzes to showcase your expertise or practice at any time.
              </p>
            </Card>
            <Card className="p-6 animate-slide-in [animation-delay:400ms]">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold">Secure Platform</h3>
              </div>
              <p className="text-muted-foreground">
                Your data is protected with enterprise-grade security and role-based access.
              </p>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
