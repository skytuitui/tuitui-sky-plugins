import fetch from 'node-fetch';
import streamToBuffer from './streamToBuffer.js';

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

            // 兼容 node-fetch v3
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

export default downloadImages;
