import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { muscleAgent, gloomyAgent } from './agents/comm-agent';
import { groupChatWorkflow } from './workflows/group-chat';

export const mastra = new Mastra({
    workflows: { groupChatWorkflow },
    agents: { muscleAgent, gloomyAgent },
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