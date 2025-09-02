import fetch from 'node-fetch';
import { Readable } from 'stream';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { segment } from 'oicq';

let plugin;
const pluginPaths = [
    '../lib/plugins/plugin.js',
    '../../lib/plugins/plugin.js',
    'oicq-plugin'
];
for (const p of pluginPaths) {
    try {
        plugin = await import(p);
        break;
    } catch { }
}
if (!plugin) {
    plugin = {
        default: class {
            constructor(options) {
                this.rule = options.rule || [];
                this.task = options.task || [];
            }
        }
    };
    console.warn('[国际服任务] 采用兼容模式加载插件基类');
}

const config = Object.freeze({
    key: 'zeG8c9uFQksYr',
    url: 'https://ovoav.com/api/skygm/gjfrw',
    timeout: 15000,
    tempFilePrefix: 'ovoav_sky_'
});

const failMsg = '❌ 国际服任务获取失败';

const streamToBuffer = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    Readable.fromWeb(stream)
       .on('data', c => chunks.push(c))
       .on('end', () => resolve(Buffer.concat(chunks)))
       .on('error', reject);
});

async function downloadImages(urls) {
    if (!urls || urls.length === 0) {
        throw new Error("没有可下载的图片资源");
    }

    const results = [];
    let errorCount = 0;

    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP状态异常 [${res.status}]`);
            }

            const type = res.headers.get('content-type');
            if (!type?.startsWith('image/')) {
                throw new Error(`非图片类型 [${type || '未知类型'}]`);
            }

            const buffer = res.buffer?.() || streamToBuffer(res.body);
            results.push(await buffer);
            console.log(`[国际服任务] 图片下载成功`);
        } catch (err) {
            errorCount++;
            console.error(`[国际服任务] 图片下载失败: ${err.message}`);
        }
    }

    if (results.length === 0) {
        throw new Error(`所有图片均下载失败（共${errorCount}个错误）`);
    }

    return results;
}

async function getTaskImages() {
    const fullUrl = `${config.url}?key=${config.key}`;
    console.log(`[国际服任务] 请求数据中...`);

    const res = await Promise.race([
        fetch(fullUrl),
        new Promise((_, reject) => setTimeout(
            () => reject(new Error(`超时(${config.timeout}ms)`)),
            config.timeout
        ))
    ]);

    if (!res.ok) throw new Error(`接口异常 [${res.status}]`);
    const data = await res.json();

    // 直接提取 urls 数组
    const urls = data.urls || [];
    if (urls.length === 0) {
        throw new Error("接口返回的 urls 为空");
    }

    return downloadImages(urls);
}

async function sendImages(imageBuffers) {
    const elements = [];
    for (const buf of imageBuffers) {
        try {
            elements.push(segment.image(buf));
        } catch {
            const tempPath = path.join(
                os.tmpdir(),
                `${config.tempFilePrefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`
            );
            await fs.writeFile(tempPath, buf);
            elements.push(segment.image(tempPath));
            setTimeout(() => fs.unlink(tempPath).catch(e =>
                console.warn(`清理临时文件失败: ${e.message}`)
            ), 30000);
        }
    }
    return elements;
}

export class InternationalTaskPlugin extends (plugin.default || plugin) {
    constructor() {
        super({
            rule: [{ reg: /^国际服任务$/, fnc: 'handleTaskQuery' }]
        });
    }

    async handleTaskQuery(e) {
        try {
            const loadingMsg = await e.reply('🔍 正在查询国际服今日任务...');
            const buffers = await getTaskImages();
            const elements = await sendImages(buffers);

            if (loadingMsg?.message_id) {
                await e.group?.recallMsg(loadingMsg.message_id).catch(() => {});
            }
            await e.reply(elements);
        } catch (err) {
            await e.reply(`${failMsg}：${err.message}`);
            console.error(`[国际服任务] 错误: ${err.stack}`);
        }
    }
}

export default new InternationalTaskPlugin();
