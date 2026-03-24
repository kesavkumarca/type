import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse-fork'; // 👈 Using the Vercel-friendly fork

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string;
    const level = formData.get('level') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert PDF File to Buffer for pdf-parse-fork
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 📝 Extract Text using pdf-parse-fork
    const pdfData = await pdf(buffer);
    
    // Clean up the text (remove unnecessary tabs and excessive spaces)
    const extractedText = pdfData.text
      .replace(/\s+/g, ' ')
      .trim();

    if (!extractedText) {
      return NextResponse.json({ error: 'The PDF appears to be empty or an image.' }, { status: 400 });
    }

    // Determine character stroke limits based on level
    const strokeLimit = level === 'junior' ? 1500 : 2250;

    // 🛰️ Initialize Admin Supabase to bypass RLS policies for admin uploads
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 Ensure this secret is in your .env
    );

    // Insert into 'passages' table
    const { error } = await supabaseAdmin
      .from('passages')
      .insert([
        {
          text: extractedText,
          language,
          level,
          stroke_limit: strokeLimit,
        },
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Passage parsed and saved!' });

  } catch (error: any) {
    console.error('PDF Parse Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse PDF' }, { status: 500 });
  }
}