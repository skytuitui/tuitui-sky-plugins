import config from '../../../config/config.js'; // 路径按你的实际项目结构调整

/**
 * 判断当前消息发送者是否为主人
 * @param {object} e 消息事件对象
 * @returns {boolean} 是否为主人
 */
export default function isMaster(e) {
    // 获取主人QQ数组（字符串形式）
    let masters = [];
    if (Array.isArray(config.masterQQ)) {
        masters = config.masterQQ.map(String);
    }
    // 兼容 master 映射格式
    if (Array.isArray(config.master)) {
        config.master.forEach(item => {
            const qq = String(item.split(':')[1] || '').trim();
            if (qq && !masters.includes(qq)) masters.push(qq);
        });
    }
    // 获取当前消息发送者 QQ
    const senderQQ = String(e.user_id || e.sender?.user_id || e.qq || e.uid || "");
    // 判断是否为主人
    return masters.includes(senderQQ);
}
