import { segment } from 'oicq';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import config from './config.js';

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

export default sendImages;
