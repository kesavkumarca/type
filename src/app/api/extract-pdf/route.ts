import { NextRequest, NextResponse } from 'next/server';

// ✅ Uses the fork to prevent the DOMMatrix crash on Vercel!
const pdfParse = require('pdf-parse-fork');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfData = await pdfParse(buffer);

    return NextResponse.json({ text: pdfData.text });
  } catch (error: any) {
    console.error('PDF Extraction Error:', error);
    return NextResponse.json({ error: 'Failed to read PDF file' }, { status: 500 });
  }
}