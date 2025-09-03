import fetch from 'node-fetch';
import { execSync } from 'child_process';

// 远程仓库主分支和 API 地址（按你的实际仓库和分支设置）
const repoAPI = 'https://api.github.com/repos/TgLegs/LegsSky-plugins/commits/main';

export async function checkPluginUpdate() {
    try {
        // 获取远程最新 commit hash
        const res = await fetch(repoAPI);
        if (!res.ok) throw new Error(`GitHub API错误: ${res.status}`);
        const data = await res.json();
        const remoteHash = data.sha;

        // 获取本地 commit hash
        // cwd 路径需为你的插件目录，例：__dirname+'/..' 或绝对路径
        const localHash = execSync('git rev-parse HEAD', { cwd: process.cwd() }).toString().trim();

        // 比较
        if (remoteHash !== localHash) {
            return { hasUpdate: true, remoteHash, localHash };
        } else {
            return { hasUpdate: false, remoteHash, localHash };
        }
    } catch (err) {
        return { hasUpdate: false, error: err.message };
    }
}
