import express from 'express';
import type { Express } from 'express';

import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { Logger } from '../log/log';
import { Queue as QueueMQ } from 'bullmq';
import { Queue as bullmqQueue } from 'bullmq';
import { JOBS } from '../..';

const createQueueMQ = (name: string) => new QueueMQ(name);

export class Server {
  private port: number;
  private server: Express;

  constructor(port = 3000) {
    this.port = port;
    this.server = express();
  }

  private setupBullBoard() {
    const queues = [];

    for (const item of JOBS) {
      if (item.urlQueue) {
        queues.push(new BullMQAdapter(item.urlQueue as QueueMQ));
      }

      if (item.dataQueue) {
        queues.push(new BullMQAdapter(item.dataQueue as QueueMQ));
      }
    }

    // const urlQueue = JOBS.filter((item) => item.urlQueue).map((item) => new BullMQAdapter(item.urlQueue));
    // const dataQueue = JOBS.filter((item) => item.dataQueue).map((item) => new BullMQAdapter(item.dataQueue));

    // const queues = [...urlQueue, ...dataQueue];

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/ui');

    createBullBoard({
      queues: queues,
      serverAdapter,
    });

    this.server.use('/ui', serverAdapter.getRouter());
  }

  async start() {
    //
    this.setupBullBoard();

    this.server.listen(this.port);
    Logger.info(`Chnagal is Listening On http://0.0.0.0:${this.port}`);
  }
}
