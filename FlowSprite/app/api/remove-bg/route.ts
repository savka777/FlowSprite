import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { imageBase64 } = await request.json();

        if (!imageBase64) {
            return NextResponse.json(
                { error: "Missing imageBase64" },
                { status: 400 }
            );
        }

        const apiKey = process.env.REMOVEBG_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "REMOVEBG_API_KEY not configured" },
                { status: 500 }
            );
        }

        console.log('Calling remove.bg API...');
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_file_b64: imageBase64,
                size: 'auto',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Remove.bg API error:', error);
            return NextResponse.json(
                { error: 'Background removal failed' },
                { status: response.status }
            );
        }

        const resultBuffer = await response.arrayBuffer();
        const resultBase64 = Buffer.from(resultBuffer).toString('base64');
        console.log('Background removed successfully!');

        return NextResponse.json({
            imageBase64: resultBase64,
        });
    } catch (err: any) {
        console.error("Error in remove-bg API:", err);
        return NextResponse.json(
            { error: err?.message ?? "Unknown error" },
            { status: 500 }
        );
    }
}
