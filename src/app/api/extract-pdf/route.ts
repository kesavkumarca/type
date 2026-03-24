import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin (bypass RLS for internal admin uploads)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for backend uploads
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

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdfParse(buffer);
        const text = pdfData.text.trim();

        if (text) {
          // Insert into your passages table
          const { data, error } = await supabaseAdmin
            .from('passages')
            .insert([
              {
                text: text,
                language: language,
                level: level,
              }
            ])
            .select();

          if (error) throw error;
          uploadResults.push({ fileName: file.name, status: 'Success' });
        }
      } catch (err: any) {
        uploadResults.push({ fileName: file.name, status: 'Failed', error: err.message });
      }
    }

    return NextResponse.json({ success: true, results: uploadResults });
  } catch (error: any) {
    console.error('Bulk Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
  }
}