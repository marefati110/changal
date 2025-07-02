import type { Queue } from 'bullmq';

interface Config {
  redis?: {
    host: string;
    post: number;
  };
}

interface Task {
  link: string;
  name: string;
  priority?: number; // default is 1_000
  res?: string;
  errorCount?: number;
}

interface Job {
  name: string;
  method: 'get' | 'post' | 'put' | 'delete';

  links?: string[];
  url?: string;
  params: Record<string, (string | number)[]>;

  cron?: string;

  onSuccess: (data: { res: unknown; data: unknown }) => Promise<void>;

  dataQueue: Queue;
  urlQueue: Queue;

  fetch?: {
    concurrency?: number; // default is 3

    // if hash of response is same as  previous request will be skip to pass data to onSuccess function (default: false)
    skipDuplicateResponse?: boolean;

    failover?: {
      retry?: number; // default is 3
      onFailedToRecover?: (task: Task) => Promise<void>;
    };
  };

  process?: {
    concurrency?: number; // default is 3

    failover?: {
      retry?: number; // default is 3
      onFailedToRecover: (task: Task) => void;
    };
  };
}
