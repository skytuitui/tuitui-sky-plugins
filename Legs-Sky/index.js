import fetch from 'node-fetch';
import { config, downloadImages, sendImages } from './sky-utils/index.js';
import isMaster from './sky-utils/isMaster.js';
import { exec } from 'child_process';
import { checkPluginUpdate } from './sky-utils/checkUpdate.js';

let plugin;
// ...插件基类加载

const failMsg = '❌ 国际服任务获取失败';

// 获取主人QQ数组
function getMasterList() {
    let masters = [];
    if (Array.isArray(config.masterQQ)) {
        masters = config.masterQQ.map(String);
    }
    if (Array.isArray(config.master)) {
        config.master.forEach(item => {
            const qq = String(item.split(':')[1] || '').trim();
            if (qq && !masters.includes(qq)) masters.push(qq);
        });
    }
    return masters;
}

export class InternationalTaskPlugin extends (plugin.default || plugin) {
    constructor() {
        super({
            rule: [
                { reg: /^国际服任务$/, fnc: 'handleTaskQuery' },
                { reg: /^#tgsky更新$/, fnc: 'updatePlugin' },
                { reg: /^#tgsky检测更新$/, fnc: 'checkUpdateCmd' }
            ]
        });
        // 启动后2秒检测一次，有新版本就私聊主人
        setTimeout(async () => {
            try {
                const result = await checkPluginUpdate();
                if (result.hasUpdate) {
                    const msg = `📢 检测到插件有新版本！\n仓库最新: ${result.remoteHash}\n本地当前: ${result.localHash}\n可用 #tgsky更新 命令自动升级。`;
                    for (const qq of getMasterList()) {
                        // 主动私聊主人（云崽标准写法）
                        try {
                            await global.Bot.pickFriend(qq).sendMsg(msg);
                        } catch (err) {
                            console.warn(`[国际服任务] 提醒主人${qq}失败: ${err.message}`);
                        }
                    }
                }
            } catch (err) {
                console.warn(`[国际服任务] 检测更新失败: ${err.message}`);
            }
        }, 2000);
    }

    async handleTaskQuery(e) {
        // ...原逻辑
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

    async checkUpdateCmd(e) {
        if (!isMaster(e)) {
            await e.reply('❌ 只有机器人主人才能检测更新！');
            return;
        }
        const result = await checkPluginUpdate();
        if (result.error) {
            await e.reply(`检测失败: ${result.error}`);
        } else if (result.hasUpdate) {
            await e.reply(`📢 检测到插件有新版本！\n仓库最新: ${result.remoteHash}\n本地当前: ${result.localHash}\n可用 #tgsky更新 命令自动升级。`);
        } else {
            await e.reply('✅ 当前插件已是最新版本，无需更新。');
        }
    }
}

export default new InternationalTaskPlugin();
