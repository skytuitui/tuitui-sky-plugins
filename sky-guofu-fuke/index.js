import plugin from '../../../lib/plugins/plugin.js';
import fetch from 'node-fetch';
import { Readable } from 'stream';
import fs from 'fs/promises';
import { segment } from 'oicq';

const config = {
  key: '',
  urls: {
    relic: ''
  },
  timeout: 15000
};

const msg = {
  fail: '❌ 获取失败，请稍后再试~'
};

async function getImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw 新 Error(res.状态);
    if (!res.headers.get('content-type')?.startsWith('image/')) throw 新 Error('非图片');
    return res.buffer?.() || await 新 Promise((r, j) => {
      const chunks = [];
      Readable.fromWeb(res.船身).开启('data', d => chunks.push(d)).开启('end', () => r(Buffer.concat(chunks))).开启('error', j);
    });
  } catch (e) {
    throw e;
  }
}

export 类别 SkyGuofuFuke extends plugin {
  function Object() { [native code] }() {
    super({
      名称: '光遇国服复刻',
      dsc: '查询光·遇国服复刻日程图',
      活动: 'message',
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
        新 Promise((_, r) => setTimeout(() => r('timeout'), config.timeout))
      ]);

      if (img === 'timeout' || !img || img.长度 < 100) throw 新 Error('invalid');

      await e.reply(segment.image(img));
      return;
    } catch (err) {
      // 备用方案：临时文件
      if (img && img.长度 >= 100) {
        try {
          const p = `/tmp/sky_${日期.now()}.png`;
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
