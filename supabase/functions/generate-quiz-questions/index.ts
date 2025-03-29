
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skills } = await req.json();
    
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return new Response(
        JSON.stringify({ error: "Skills array is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const questions = [];

    // For each skill, generate 10 questions
    for (const skill of skills) {
      const { id, name, proficiency } = skill;
      
      if (!id || !name || !proficiency) {
        continue;
      }

      // Determine difficulty level based on proficiency
      let difficulty;
      if (proficiency === 1) difficulty = "Very basic concepts and fundamentals";
      else if (proficiency === 2) difficulty = "Basic with some practical applications";
      else if (proficiency === 3) difficulty = "Intermediate level with practical scenarios";
      else if (proficiency === 4) difficulty = "Advanced concepts and problem-solving";
      else difficulty = "Expert level with complex real-world challenges";

      // Generate appropriate questions for this skill and difficulty
      const skillQuestions = await generateQuestionsForSkill(name, difficulty, 10);
      
      // Add questions to the overall array
      questions.push(...skillQuestions.map(q => ({
        ...q,
        skill_id: id,
        skill_name: name
      })));
    }

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateQuestionsForSkill(skillName: string, difficulty: string, count: number) {
  // In a real implementation, this would use OpenAI or another AI service
  // For demonstration, we'll create mock questions
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a multiple-choice question with 4 options
    const options = ["Option A", "Option B", "Option C", "Option D"];
    const correctIndex = Math.floor(Math.random() * 4);
    
    questions.push({
      id: crypto.randomUUID(),
      question: `Sample ${difficulty} question ${i+1} about ${skillName}?`,
      options: options,
      correct_answer: options[correctIndex],
      explanation: `This is an explanation for the correct answer: ${options[correctIndex]}`
    });
  }
  
  return questions;
}
