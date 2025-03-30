
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { corsHeaders } from '../_shared/cors.ts';
import { OpenAI } from 'https://esm.sh/openai@4.26.0';

const openAIClient = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

interface RequestData {
  skills: Array<{
    id: string;
    name: string;
    proficiency: number;
  }>;
  questionsPerSkill?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestUrl = new URL(req.url);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const requestData: RequestData = await req.json();
    const { skills, questionsPerSkill = 10 } = requestData; // Default to 10 questions per skill

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid skills data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Generating quiz questions for ${skills.length} skills, ${questionsPerSkill} questions per skill`);

    // Process each skill and generate questions
    const results = await Promise.all(
      skills.map(async (skill) => {
        try {
          console.log(`Generating questions for skill: ${skill.name} at proficiency level ${skill.proficiency}`);
          const questions = await generateQuestionsForSkill(skill, questionsPerSkill);
          console.log(`Generated ${questions.length} questions for ${skill.name}`);
          return {
            skill_id: skill.id,
            skill_name: skill.name,
            questions
          };
        } catch (error) {
          console.error(`Error generating questions for ${skill.name}:`, error);
          return {
            skill_id: skill.id,
            skill_name: skill.name,
            error: error.message || 'Failed to generate questions'
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ data: results }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateQuestionsForSkill(
  skill: { id: string; name: string; proficiency: number },
  questionsCount: number
): Promise<Array<{
  question: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
}>> {
  try {
    const prompt = `
Generate ${questionsCount} multiple-choice questions about ${skill.name} at proficiency level ${skill.proficiency} (1=beginner, 5=expert).
Each question should have 4 options with one correct answer.
Return the response as a JSON array with this structure:
[{
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "The correct option (exact match to one of the options)",
  "explanation": "Brief explanation of why this is the correct answer"
}]
Make sure the difficulty matches the proficiency level:
- Level 1: Basic knowledge and fundamental concepts
- Level 2: Intermediate understanding with some practical experience
- Level 3: Good working knowledge and practical skills
- Level 4: Advanced concepts and problem-solving skills
- Level 5: Expert-level understanding and deep technical knowledge

The questions should be varied and cover different aspects of the skill.
Make the questions challenging but fair for the given proficiency level.
Ensure all options are plausible but only one is clearly correct.
`;

    console.log("Sending request to OpenAI");
    const response = await openAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a specialized education AI that creates relevant assessment questions." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000, // Increased token limit to handle more questions
      response_format: { type: "json_object" }, // Request JSON format specifically
    });

    console.log("Received response from OpenAI");
    
    try {
      const content = response.choices[0]?.message.content || "";
      
      // Parse the JSON content
      const parsedContent = JSON.parse(content);
      
      // Check if the content contains a questions array
      if (Array.isArray(parsedContent)) {
        return parsedContent;
      } else if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
        return parsedContent.questions;
      } else {
        // Extract any array that might be in the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        console.error("Unexpected OpenAI response format:", content);
        return generateMockQuestions(skill, questionsCount);
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError, "Response was:", response.choices[0]?.message.content);
      return generateMockQuestions(skill, questionsCount);
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    // Fallback to mock data if the API call fails
    return generateMockQuestions(skill, questionsCount);
  }
}

function generateMockQuestions(
  skill: { id: string; name: string; proficiency: number },
  questionsCount: number
): Array<{
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}> {
  const difficultyPrefix = proficiencyToPrefix(skill.proficiency);
  
  return Array.from({ length: questionsCount }, (_, i) => {
    return {
      question: `${difficultyPrefix} ${skill.name} Question ${i + 1}: What is the best practice for ${skill.name}?`,
      options: [
        `Option A for ${skill.name}`,
        `Option B for ${skill.name}`,
        `Option C for ${skill.name}`,
        `Option D for ${skill.name}`
      ],
      correct_answer: `Option C for ${skill.name}`,
      explanation: `Explanation for question ${i + 1} about ${skill.name}`
    };
  });
}

function proficiencyToPrefix(proficiency: number): string {
  switch (proficiency) {
    case 1: return "BEGINNER:";
    case 2: return "BASIC:";
    case 3: return "INTERMEDIATE:";
    case 4: return "ADVANCED:";
    case 5: return "EXPERT:";
    default: return "GENERAL:";
  }
}
