export class Generator {
  private generateUrlCombinations(str: string, params: Record<string, (string | number)[]>): string[] {
    const urls: string[] = [];

    // Helper function to recursively generate URL combinations
    function generateCombinations(currentUrl: string, keys: string[], index: number): void {
      if (index === keys.length) {
        // All parameters have been substituted, add the current URL to the list
        urls.push(currentUrl);
        return;
      }

      const key = keys[index];
      const values = params[key];

      for (const value of values) {
        // Substitute path parameters
        const urlWithPathParam = currentUrl.replace(`:${key}`, encodeURIComponent(value.toString()));

        // If the key wasn't found in the path, treat it as a query parameter
        const newUrl = urlWithPathParam.includes(`:${key}`)
          ? urlWithPathParam
          : urlWithPathParam +
            (urlWithPathParam.includes('?') ? '&' : '?') +
            `${key}=${encodeURIComponent(value.toString())}`;

        // Recurse to handle the next key
        generateCombinations(newUrl, keys, index + 1);
      }
    }

    generateCombinations(str, Object.keys(params), 0);
    return urls;
  }

  private generateUrls(job: Job): string[] {
    let links: string[] = [];

    if (!job.url) {
      return links;
    }

    links = this.generateUrlCombinations(job.url, job.params || {});

    return links;
  }

  generateTasks(job: Job) {
    const links = this.generateUrls(job);

    const tasks: Task[] = [];

    for (const link of links) {
      const task: Task = {
        link,
        name: job.name,
      };

      tasks.push(task);
    }

    return { tasks, links };
  }
}
