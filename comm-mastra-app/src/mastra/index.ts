import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { baselineAgent, supporterAgent, examinerAgent, mediatorAgent } from './agents/comm-agent';
import { groupChatWorkflow } from './workflows/group-chat';

export const mastra = new Mastra({
    //workflows: { groupChatWorkflow },
    agents: { baselineAgent, supporterAgent, examinerAgent, mediatorAgent },
    storage: new LibSQLStore({
        url: ":memory:",
    }),
    logger: new PinoLogger({
        name: 'Mastra',
        level: 'info',
    }),
    telemetry: {
        enabled: false,
    },
    observability: {
        default: { enabled: true },
    },
});


//baselineAgent, supporterAgent, examinerAgent, mediatorAgent
//muscleAgent, gloomyAgent