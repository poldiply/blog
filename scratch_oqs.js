import createOQSModule from './src/lib/pqc/oqs.js';

async function test() {
    const module = await createOQSModule();
    console.log("Module keys:", Object.keys(module));
    console.log("HEAPU8:", typeof module.HEAPU8);
}
test();
