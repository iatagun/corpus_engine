
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.json();
    // Default to internal API URL or localhost
    const apiUrl = process.env.API_URL || 'http://localhost:3000';

    console.log(`[Proxy] Forwarding search request to ${apiUrl}/search`);

    try {
        const backendRes = await fetch(`${apiUrl}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!backendRes.ok) {
            console.error(`[Proxy] Backend returned ${backendRes.status}`);
            return NextResponse.json({ error: 'Backend Error' }, { status: backendRes.status });
        }

        const data = await backendRes.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Proxy] Error forwarding request:', error);
        return NextResponse.json({ error: 'Internal Proxy Error' }, { status: 500 });
    }
}
