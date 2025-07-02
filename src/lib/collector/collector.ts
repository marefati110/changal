import axios, { Axios, AxiosResponse, Method } from 'axios';
import axiosRetry from 'axios-retry';

export class Collector {
  private instance: Axios;

  constructor() {
    axiosRetry(axios, { retries: 3 });

    this.instance = axios.create({
      validateStatus: () => true,
      timeout: 30 * 1000, // 30 second
      // headers: { 'user-agent': '' },
    });
  }

  async fetch(url: string, method?: Method) {
    let res: AxiosResponse | undefined;
    try {
      res = await this.instance.request({
        method: method || 'get',
        url,
      });
    } catch {
      //
    }

    return res;
  }
}
