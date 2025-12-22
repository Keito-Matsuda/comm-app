import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, mode, agentId } = await req.json();
    console.log(`--- Request [Mode: ${mode}, Agent: ${agentId}] ---`);
    console.log('Message:', message);

    let mastraUrl = '';
    let body = {};

    if (mode === 'single') {
      // シングルエージェントのリンクを叩く
      mastraUrl = `http://localhost:4111/api/agents/${agentId}/generate`;
      body = { messages: [message] };
    } else {
      // マルチエージェントのワークフローを叩く
      mastraUrl = `http://localhost:4111/api/workflows/checkEnWorkflow/start-async`;
      body = { inputData: { userMessage: message } };
    }

    const mastraResponse = await fetch(mastraUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
    
    /// シングルなら .text、マルチなら .results (または data そのもの) を返却
    return NextResponse.json(data.results || data);

  } catch (error) {
    console.error('💥 Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}