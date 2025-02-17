async function runWebGPUComputation() {
    if (!navigator.gpu) {
        console.error("WebGPU is not supported on this browser.");
        return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const shaderCode = `
        @group(0) @binding(0) var<storage, read_write> data : array<u32>;

        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) id : vec3<u32>) {
            data[0] = 2u + 2u;
        }
    `;

    const shaderModule = device.createShaderModule({ code: shaderCode });
    const bufferSize = 4; // 4 bytes (single u32)
    const buffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const outputBuffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" }
        }]
    });

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{ binding: 0, resource: { buffer } }]
    });

    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    const computePipeline = device.createComputePipeline({
        layout: pipelineLayout,
        compute: { module: shaderModule, entryPoint: "main" }
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(1);
    passEncoder.end();
    
    commandEncoder.copyBufferToBuffer(buffer, 0, outputBuffer, 0, bufferSize);
    const commands = commandEncoder.finish();
    device.queue.submit([commands]);

    await outputBuffer.mapAsync(GPUMapMode.READ);
    const resultArray = new Uint32Array(outputBuffer.getMappedRange());
    console.log("Result: ", resultArray[0]); // Should print 4
    outputBuffer.unmap();
}

runWebGPUComputation();
