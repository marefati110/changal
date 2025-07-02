import { CronJob } from 'cron';
import { Generator } from '../generator/generator';
import { Queue } from '../queue/queue';
import { Logger } from '../log/log';
import { Collector } from '../collector/collector';
import { Job as bullmqJob } from 'bullmq';
import { JOBS } from '../..';
import { Parser } from './parser';
import { Job, Task } from '../../../types';

export class Handler {
  private generator: Generator;
  private queue: Queue;
  private collector: Collector;
  private cache: Cache;

  constructor(queue: Queue) {
    this.generator = new Generator();
    this.collector = new Collector();

    this.queue = queue;
  }

  handleJobs(jobs: Job[]) {
    const scheduleJobs = jobs.filter((item) => !!item?.cron);
    const unScheduleJobs = jobs.filter((item) => !item?.cron);

    for (const item of scheduleJobs) {
      new CronJob(item.cron!, async () => {
        this.handleJob(item);
      });
    }

    for (const item of unScheduleJobs) {
      this.handleJob(item);
    }
  }

  private handleJob(job: Job) {
    const { tasks } = this.generator.generateTasks(job);

    for (const item of tasks) {
      this.queue.addToUrlQueue(item);

      Logger.info(`URL: ${item.link} Added to Url Queue`);
    }
  }

  async handleFetch(bullmqJob: bullmqJob<Task>) {
    const { data } = bullmqJob;

    const job = JOBS.find((item) => item.name === data.name);
    if (!job) {
      throw new Error('job not found');
    }

    const res = await this.collector.fetch(data.link);

    const isOk = !!res?.status && res?.status < 300;

    if (isOk) {
      return await this.queue.addToDataQueue({
        ...data,
        res: res.data,
      });
    }

    const errorCount = data?.errorCount || 1;
    const errorTolerance = job?.fetch?.failover?.retry ?? 3;

    if (errorCount <= errorTolerance) {
      await this.queue.addToUrlQueue(
        {
          ...data,
          errorCount: errorCount + 1,
        },
        { delay: 15 * errorCount * 1000 },
      );
    } else {
      await job?.fetch?.failover?.onFailedToRecover?.(data);

      throw new Error(`failed to fetch ${data.link} statusCode: ${res?.status}`);
    }
  }

  async handleProcessData(bullmqJob: bullmqJob<Task>) {
    const { data } = bullmqJob;

    const job = JOBS.find((item) => item.name === data.name);
    if (!job) {
      throw new Error('job not found');
    }

    const parser = new Parser(data.res || '');

    // console.log(data.res);

    // await job.onSuccess({ res: data.res });
  }
}
