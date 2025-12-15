import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// ステップ1：共感型＆厳格型エージェントが独立に添削
const multiAgentStep = createStep({
  id: 'multi-agent-reply',
  inputSchema: z.object({
    userMessage: z.string(),
  }),
  outputSchema: z.object({
    userMessage: z.string(),
    supporterResponse: z.string(),
    examinerResponse: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const supporter = mastra?.getAgent('supporterAgent');
    const examiner = mastra?.getAgent('examinerAgent');
    if (!supporter) throw new Error('supporterAgent not found');
    if (!examiner) throw new Error('examinerAgent not found');

    const supporterResult = await supporter.generate(inputData.userMessage);
    const examinerResult = await examiner.generate(inputData.userMessage);

    return {
      userMessage: inputData.userMessage,
      supporterResponse: supporterResult.text,
      examinerResponse: examinerResult.text,
    };
  },
});

// ステップ3：調停型エージェントからの添削をもらう
const mediatorStep = createStep({
  id: 'mediator-reply',
  inputSchema: z.object({
    userMessage: z.string(),
    supporterResponse: z.string(),
    examinerResponse: z.string(),
  }),
  outputSchema: z.object({
    mediatorResponse: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('mediatorAgent');
    if (!agent) throw new Error('mediatorAgent not found');

    const context = `
      ユーザーの英文: "${inputData.userMessage}"
      共感型エージェントの添削文: "${inputData.supporterResponse}"
      厳格型エージェントの添削文: "${inputData.examinerResponse}"

      これらを踏まえて、あなたの役目を果たしてください。
    `;

    const result = await agent.generate(context);

    return {
      supporterResponse: inputData.supporterResponse,
      examinerResponse: inputData.examinerResponse,
      mediatorResponse: result.text,
    };
  },
});

// ワークフローの定義
export const checkEnWorkflow = createWorkflow({
  id: 'chat',
  description:
    'ユーザーの英文を共感型・厳格型エージェントが添削し、調停型エージェントが統合をする',
  inputSchema: z.object({
    userMessage: z.string(),
  }),
  outputSchema: z.object({
    supporterResponse: z.string(),
    examinerResponse: z.string(),
    mediatorResponse: z.string(),
  }),
})
  .then(multiAgentStep)
  .then(mediatorStep)

checkEnWorkflow.commit();

//baselineAgent, supporterAgent, examinerAgent, mediatorAgent