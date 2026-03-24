import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 🛠️ FIX: Using require() bypasses the Next.js/Vercel ESM export crash!
const pdfParse = require('pdf-parse');

// Initialize Supabase admin using service role key (bypasses RLS for secure internal admin uploads)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const language = formData.get('language') as string;
    const level = formData.get('level') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadResults = [];

    // 🔄 Loop through every single PDF you uploaded!
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const pdfData = await pdfParse(buffer);
        const text = pdfData.text.trim();

        if (text) {
          const { error } = await supabaseAdmin
            .from('passages')
            .insert([
              {
                text: text,
                language: language,
                level: level,
              }
            ]);

          if (error) throw error;
          uploadResults.push({ fileName: file.name, status: 'Success ✅' });
        } else {
          uploadResults.push({ fileName: file.name, status: 'Failed: No text found ❌' });
        }
      } catch (err: any) {
        console.error(`Error with file ${file.name}:`, err);
        uploadResults.push({ fileName: file.name, status: 'Failed: Parsing error ❌' });
      }
    }

    return NextResponse.json({ success: true, results: uploadResults });
  } catch (error: any) {
    console.error('Bulk Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
  }
}