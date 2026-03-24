import { NextRequest, NextResponse } from 'next/server';

// 🛠️ FIX: Using require() bypasses the Next.js/Vercel ESM export crash!
const pdfParse = require('pdf-parse');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read text from the PDF buffer
    const pdfData = await pdfParse(buffer);

    return NextResponse.json({ text: pdfData.text });
  } catch (error: any) {
    console.error('PDF Extraction Error:', error);
    return NextResponse.json({ error: 'Failed to read PDF file' }, { status: 500 });
  }
}