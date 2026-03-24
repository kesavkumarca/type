import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse-fork';// 👈 Note: you will need to run `npm i pdf-parse`

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string;
    const level = formData.get('level') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert PDF File to ArrayBuffer for parsing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 📝 Extract Text using pdf-parse
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text.trim();

    if (!extractedText) {
      return NextResponse.json({ error: 'Failed to extract text from PDF.' }, { status: 400 });
    }

    // Calculate Stroke Limit based on level
    const strokeLimit = level === 'junior' ? 1500 : 2250;

    // 🛰️ Initialize Admin Supabase (Bypass RLS for Admin Upload)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 Ensure this is in your .env file
    );

    // Insert into 'passages' table
    const { data, error } = await supabaseAdmin
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