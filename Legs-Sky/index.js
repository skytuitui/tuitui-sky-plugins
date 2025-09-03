import fetch from 'node-fetch';
import { config, downloadImages, sendImages } from './sky-utils/index.js';
import isMaster from './sky-utils/isMaster.js';
import { exec } from 'child_process';

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

const failMsg = '❌ 国际服任务获取失败';

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

    const urls = data.urls || [];
    if (urls.length === 0) {
        throw new Error("接口返回的 urls 为空");
    }

    return downloadImages(urls);
}

export class InternationalTaskPlugin extends (plugin.default || plugin) {
    constructor() {
        super({
            rule: [
                { reg: /^国际服任务$/, fnc: 'handleTaskQuery' },
                { reg: /^#tgsky更新$/, fnc: 'updatePlugin' }
            ]
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

    async updatePlugin(e) {
        if (!isMaster(e)) {
            await e.reply('❌ 只有机器人主人才能执行此命令！');
            return;
        }
        await e.reply('🔄 正在更新插件，请稍候...');
        exec('cd plugins/LegsSky-plugins && git pull', (error, stdout, stderr) => {
            if (error) {
                e.reply(`❌ 插件更新失败：${error.message}`);
            } else {
                e.reply('✅ 插件已更新完成！请重启机器人使更新生效。');
            }
        });
    }
}

export default new InternationalTaskPlugin();
