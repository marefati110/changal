import { Generator } from './lib/generator/generator';
import { Queue } from './lib/queue/queue';
import { Server } from './lib/server/server';

interface IRegister {
  name: string;
  links: string[];
  cron?: string;
  concurrency?: number;
  onSuccess: (data: unknown) => void;
}

export class Chnagal {
  private server: Server;
  private generator: Generator;
  private queue: Queue;

  constructor() {
    this.server = new Server();
    this.generator = new Generator();
    this.queue = new Queue();
  }

  async register(params: IRegister[]) {
    // register queues
    for (const item of params) {
      this.queue.setup(item.name, item.onSuccess);
    }
  }

  async start() {
    this.server.start();
  }
}
