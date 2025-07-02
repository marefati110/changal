import IORedis from 'ioredis';
import { Queue as bullmqQueue, Job as bullmqJob, JobsOptions, Worker } from 'bullmq';
import { Collector } from '../collector/collector';

export class Queue {
  //
  private connection = new IORedis({
    maxRetriesPerRequest: null,
  });

  private collector: Collector;

  private urlQueue: bullmqQueue;
  private dataQueue: bullmqQueue;

  constructor() {
    this.collector = new Collector();

    const urlQueue = new bullmqQueue('url', { connection: {} });
    const dataQueue = new bullmqQueue('data');
    new bullmqQueue('data2', { connection: {} });

    this.urlQueue = urlQueue;
    this.dataQueue = dataQueue;
  }

  registerQueue(job: Job) {
    const urlQueue = new bullmqQueue(`${job.name}_url`);
    const dataQueue = new bullmqQueue(`${job.name}_data`);
    return { urlQueue, dataQueue };
  }

  setupUrlWorker(cb: (data: bullmqJob) => Promise<void>) {
    const worker = new Worker<Job>(
      'url',
      async (job) => {
        return await cb(job);
      },
      {
        connection: {},
        concurrency: 1,
      },
    );

    worker.on('failed', (job, err) => {
      console.log(`${job?.id} has failed with ${err.message}`);
    });

    worker.on('completed', (job) => {
      console.log(`${job.id} has completed!`);
    });

    worker.on('active', (job) => {
      console.log(`${job.id} has active!`);
    });

    worker.on('progress', ({ data, id }, timestamp) => {
      console.log(`${id} reported progress ${data} at ${timestamp}`);
    });
  }

  setupDataWorker(cb: (data: Job) => Promise<void>) {
    const worker = new Worker(
      'data',
      async (job) => {
        return await cb(job);
      },
      {
        connection: {},
        concurrency: 1,
      },
    );

    worker.on('failed', (job, err) => {
      console.log(`${job?.id} has failed with ${err.message}`);
    });

    worker.on('completed', (job) => {
      console.log(`${job.id} has completed!`);
    });

    worker.on('active', (job) => {
      console.log(`${job.id} has completed!`);
    });

    worker.on('progress', ({ data, id }, timestamp) => {
      console.log(`${id} reported progress ${data} at ${timestamp}`);
    });
  }

  async addToUrlQueue(task: Task, options?: JobsOptions) {
    const bullJob = await this.urlQueue.add(task.link, task, { priority: 1_000, ...options });
    return bullJob;
  }

  async addToDataQueue(task: Task, options?: JobsOptions) {
    const bullJob = await this.dataQueue.add(task.link, { ...task }, { ...options });
    return bullJob;
  }
}
