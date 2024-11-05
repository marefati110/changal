import express from 'express';
import type { Express } from 'express';

import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { Logger } from '../log/log';
import { Queue as QueueMQ } from 'bullmq';

const createQueueMQ = (name: string) => new QueueMQ(name);

export class Server {
  private port: number;

  private server: Express;

  constructor(port = 3000) {
    this.port = port;
    this.server = express();
  }

  private setupBullBoard() {
    const exampleBullMq = createQueueMQ('BullMQ');

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/ui');

    createBullBoard({
      queues: [new BullMQAdapter(exampleBullMq)],
      serverAdapter,
    });

    this.server.use('/ui', serverAdapter.getRouter());
  }

  async start() {
    this.setupBullBoard();

    this.server.listen(this.port);
    Logger.info(`Chnagal is Listening On http://0.0.0.0:${this.port}`);
  }
}
