import { Job } from '../types';
import { Generator } from './lib/generator/generator';
import { Queue } from './lib/queue/queue';
import { Handler } from './lib/resolver/handler';
import { Server } from './lib/server/server';

export let JOBS: Job[] = [];

export class Chnagal {
  private server: Server;
  private generator: Generator;
  private queue: Queue;
  private handler: Handler;

  constructor() {
    this.server = new Server();
    this.generator = new Generator();
    this.queue = new Queue();

    this.handler = new Handler(this.queue);

    this.queue.setupUrlWorker(async (data) => {
      await this.handler.handleFetch(data);
    });

    this.queue.setupDataWorker(async (data) => {
      await this.handler.handleProcessData(data);
    });
  }

  async addJob(jobs: Job[]) {
    for (const item of jobs) {
      const { dataQueue, urlQueue } = this.queue.registerQueue(item);
      item.dataQueue = dataQueue;
      item.urlQueue = urlQueue;
    }

    JOBS = [...JOBS, ...jobs];
  }

  async start() {
    await this.server.start();
    this.handler.handleJobs(JOBS);
  }
}
