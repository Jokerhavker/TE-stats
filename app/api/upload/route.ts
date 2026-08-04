import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_SECRET) {
      // Return base64 directly as fallback if Cloudinary is not configured
      return NextResponse.json({ url: image });
    }

    const uploadResult = await cloudinary.uploader.upload(image, {
      folder: 's8ul-elite-scoring/players',
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
