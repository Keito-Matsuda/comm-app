import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// ステップ1: 筋肉男の反応をもらう
const muscleStep = createStep({
    id: 'muscle-reply',
    inputSchema: z.object({
        userMessage: z.string(),
    }),
    outputSchema: z.object({
        userMessage: z.string(), // 次のステップに引き継ぐため
        muscleResponse: z.string(),
    }),
    execute: async ({ inputData, mastra }) => {
        // index.tsで登録したキー名 'muscleAgent' で取得
        const agent = mastra?.getAgent('muscleAgent');
        if (!agent) throw new Error('Muscle agent not found');

        const result = await agent.generate(inputData.userMessage);
        
        return {
        userMessage: inputData.userMessage,
        muscleResponse: result.text,
        };
    },
});

// ステップ2: 根暗女の反応をもらう（ユーザーの声＋筋肉男の声を聞かせる）
const gloomyStep = createStep({
        id: 'gloomy-reply',
        inputSchema: z.object({
            userMessage: z.string(),
            muscleResponse: z.string(),
        }),
        outputSchema: z.object({
            gloomyResponse: z.string(),
            combinedResponse: z.string(),
        }),
        execute: async ({ inputData, mastra }) => {
            const agent = mastra?.getAgent('gloomyAgent');
            if (!agent) throw new Error('Gloomy agent not found');

            // 根暗エージェントへのプロンプトを作成
            // ユーザーと筋肉男の会話の流れを渡してリアクションさせる
            const context = `
                ユーザーの発言: "${inputData.userMessage}"
                筋肉男の反応: "${inputData.muscleResponse}"
                
                これらを踏まえて、あなたの性格（根暗・卑屈）でコメントしてください。
                筋肉男の暑苦しさに少し引いている感じでお願いします。
            `;

            const result = await agent.generate(context);

        // 最終的な表示形式を整える
        const finalOutput = `
=== Muscle Man ===
${inputData.muscleResponse}

=== Gloomy Woman ===
${result.text}
        `;

        return {
            gloomyResponse: result.text,
            combinedResponse: finalOutput,
        };
    },
});

// ワークフローの定義
export const groupChatWorkflow = createWorkflow({
    id: 'group-chat',
    description: 'ユーザー、筋肉、根暗の3者会話',
    inputSchema: z.object({
        userMessage: z.string(),
    }),
    outputSchema: z.object({
        muscleResponse: z.string(),
        gloomyResponse: z.string(),
    }),
    })
    .then(muscleStep)
    .then(gloomyStep);

groupChatWorkflow.commit();