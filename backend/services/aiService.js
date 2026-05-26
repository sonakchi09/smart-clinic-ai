const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const suggestDoctor = async (symptoms) => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `A patient at a clinic has the following symptoms: "${symptoms}"
          
Based on these symptoms, suggest the most appropriate type of doctor to see.
Choose from: General Physician, Cardiologist, Dermatologist, Orthopedic, ENT Specialist, Neurologist, Gastroenterologist, Pediatrician, Gynecologist, Psychiatrist.

Also give an urgency level: Low, Medium, or High.

Respond in this exact JSON format only, no extra text, no markdown:
{
  "doctorType": "General Physician",
  "urgency": "Medium",
  "reason": "One sentence explanation"
}`
        }
      ],
      temperature: 0.3
    });

    const text = completion.choices[0].message.content.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.log('AI suggest doctor error:', error.message);
    return {
      doctorType: 'General Physician',
      urgency: 'Medium',
      reason: 'Unable to analyze symptoms at this time'
    };
  }
};

const generatePreConsultationSummary = async (patient) => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `You are an AI assistant for a doctor. A patient is about to enter for consultation.

Patient details:
- Name: ${patient.name}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Symptoms: ${patient.symptoms}

Generate a brief pre-consultation summary for the doctor in 2-3 sentences.
Include the key symptoms, suggested focus areas, and any red flags to watch for.
Be clinical and concise. Respond with plain text only.`
        }
      ],
      temperature: 0.3
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.log('AI summary error:', error.message);
    return 'Unable to generate summary at this time.';
  }
};

const generateDashboardInsights = async (stats) => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `You are an AI assistant for a clinic admin. Here are today's statistics:

- Total patients: ${stats.totalPatients}
- Waiting: ${stats.waiting}
- In consultation: ${stats.inConsultation}
- Completed: ${stats.done}
- Total doctors: ${stats.totalDoctors}
- Available doctors: ${stats.availableDoctors}

Generate a brief 2-3 sentence natural language insight about today's clinic performance.
Be helpful and suggest any actions if needed. Respond with plain text only.`
        }
      ],
      temperature: 0.3
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.log('AI insights error:', error.message);
    return 'Unable to generate insights at this time.';
  }
};

const structurePrescription = async (transcript) => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `You are a medical AI assistant. A doctor has spoken the following during a consultation:

"${transcript}"

Extract and structure this into a medical prescription format.

Respond in this exact JSON format only, no extra text, no markdown:
{
  "diagnosis": "The diagnosis",
  "medicines": "Medicine names and dosages",
  "instructions": "Patient instructions",
  "followUp": "Follow up advice"
}`
        }
      ],
      temperature: 0.3
    });

    const text = completion.choices[0].message.content.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.log('AI prescription error:', error.message);
    return {
      diagnosis: transcript,
      medicines: '',
      instructions: '',
      followUp: ''
    };
  }
};

module.exports = {
  suggestDoctor,
  generatePreConsultationSummary,
  generateDashboardInsights,
  structurePrescription
};