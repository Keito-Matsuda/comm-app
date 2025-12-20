import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    console.log('--- Request to Mastra ---');
    console.log('Message:', message);
    
    // 【修正箇所】 /start → /start-async に変更
    // start-async は runId なしで実行でき、inputData を受け取れます
    const mastraUrl = `http://localhost:4111/api/workflows/checkEnWorkflow/start-async`;
    
    console.log(`Trying to connect: ${mastraUrl}`);

    const mastraResponse = await fetch(mastraUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputData: {
          userMessage: message,
        }
      }),
    });

    if (!mastraResponse.ok) {
      const errorText = await mastraResponse.text();
      console.error(`❌ Error ${mastraResponse.status}:`, errorText);
      return NextResponse.json(
        { error: `Mastra API error: ${mastraResponse.status}`, details: errorText },
        { status: mastraResponse.status }
      );
    }

    const data = await mastraResponse.json();
    console.log('✅ Success:', JSON.stringify(data, null, 2));
    
    // start-async の結果から results を取り出す
    // （返り値の構造次第で data.results または data 自体が結果の場合があります）
    return NextResponse.json(data.results || data);

  } catch (error) {
    console.error('💥 Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    );
  }
}