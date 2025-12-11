import plugin from '../../../lib/plugins/plugin.js';
import fetch from 'node-fetch';
import { Readable } from 'stream';
import fs from 'fs/promises';
import { segment } from 'oicq';

const config = {
  key: 'LCruci4v3TzrwvdtLjtHsQ8AI8',
  urls: {
    relic: 'https://api.t1qq.com/api/sky/sc/scfk'
  },
  timeout: 15000
};

const msg = {
  fail: '❌ 获取失败，请稍后再试~'
};

async function getImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    if (!res.headers.get('content-type')?.startsWith('image/')) throw new Error('非图片');
    return res.buffer?.() || await new Promise((r, j) => {
      const chunks = [];
      Readable.fromWeb(res.body).on('data', d => chunks.push(d)).on('end', () => r(Buffer.concat(chunks))).on('error', j);
    });
  } catch (e) {
    throw e;
  }
}

export class SkyGuofuFuke extends plugin {
  constructor() {
    super({
      name: '光遇国服复刻',
      dsc: '查询光·遇国服复刻日程图',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^国服复刻$',
          fnc: 'queryRelic',
          permission: 'anyone'
        }
      ]
    });
  }

  async queryRelic(e) {
    await this.fetchAndSend(e, config.urls.relic);
  }

  async fetchAndSend(e, url) {
    let img;
    try {
      img = await Promise.race([
        getImage(`${url}?key=${config.key}&server=cn`),
        new Promise((_, r) => setTimeout(() => r('timeout'), config.timeout))
      ]);

      if (img === 'timeout' || !img || img.length < 100) throw new Error('invalid');

      await e.reply(segment.image(img));
      return;
    } catch (err) {
      // 备用方案：临时文件
      if (img && img.length >= 100) {
        try {
          const p = `/tmp/sky_${Date.now()}.png`;
          await fs.writeFile(p, img);
          await e.reply(segment.image(p));
          setTimeout(() => fs.unlink(p).catch(() => {}), 10000);
          return;
        } catch {}
      }
      await e.reply(msg.fail);
    }
  }
}