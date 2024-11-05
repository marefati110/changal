import { QueueEvents as bullmqQueueEvents, Job, Worker } from 'bullmq';

export class Queue {
  setup(name: string, cb: (data: Job) => void) {
    const queue = new bullmqQueueEvents(name, { connection: {} });

    const worker = new Worker(
      name,
      async (job) => {
        cb(job);
      },
      {
        connection: {},
        concurrency: 1,
      },
    );

    worker.on('failed', (job, err) => {
      console.log(`${job?.id} has failed with ${err.message}`);
    });

    // worker.on('completed', (job) => {
    //   console.log(`${job.id} has completed!`);
    // });

    // worker.on("active", ({}) => {
    //   console.log("ali");
    // });

    worker.on('progress', ({ data, id }, timestamp) => {
      console.log(`${id} reported progress ${data} at ${timestamp}`);
    });

    return queue;
  }
}
