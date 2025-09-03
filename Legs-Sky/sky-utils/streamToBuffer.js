import { Readable } from 'stream';

const streamToBuffer = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    Readable.fromWeb(stream)
       .on('data', c => chunks.push(c))
       .on('end', () => resolve(Buffer.concat(chunks)))
       .on('error', reject);
});

export default streamToBuffer;
