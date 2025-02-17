async function runWebGPUComputation() {
    // Ensures the browser supports WebGPU.
    // navigator.gpu is the entry point for WebGPU. If it's undefined, the function exits.
    if (!navigator.gpu) {
        console.error("WebGPU is not supported on this browser.");
        return;
    }

    // adapter represents the available GPU hardware.
    // Device represents the logical GPU device used for computation.
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    // Defining the Compute Shader
    //      WebGPU Shader Language (WGSL): WebGPU shaders use WGSL.
    //      Storage Buffer (var<storage, read_write> data): Holds an array of unsigned 32-bit integers.
    //      Compute Shader (@compute): A function executed on the GPU.
    //      Workgroup Size (@workgroup_size(1)): Runs one invocation per workgroup.
    //      Computation (data[0] = 2u + 2u;): Writes 4 into the first element of data.
    const shaderCode = `
        @group(0) @binding(0) var<storage, read_write> data : array<u32>;

        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) id : vec3<u32>) {
            data[0] = 2u + 2u;
        }
    `;

    // Compiles the WGSL shader for execution.
    const shaderModule = device.createShaderModule({ code: shaderCode });

    // buffer: Stores the output of the computation.
    // GPUBufferUsage.STORAGE: Used in a compute shader.
    // GPUBufferUsage.COPY_SRC: Allows copying to another buffer.
    const bufferSize = 4; // 4 bytes (single u32)
    const buffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    //outputBuffer: A buffer for reading the result.
    // GPUBufferUsage.COPY_DST: Destination for copied data.
    // GPUBufferUsage.MAP_READ: Allows CPU access.
    const outputBuffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    // Creating Bind Group Layout and Bind Group
    //      bindGroupLayout: Describes the layout of buffers in a shader.
    //      binding: 0: Corresponds to data in the shader.
    //      visibility: GPUShaderStage.COMPUTE: Used in compute shaders.
    //      buffer: { type: "storage" }: Indicates a storage buffer.
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" }
        }]
    });

    // bindGroup: Links the buffer to the shader.
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{ binding: 0, resource: { buffer } }]
    });

    // Creating Compute Pipeline
    //      pipelineLayout: Defines how resources are organized.
    //      computePipeline: Represents the compute shader pipeline.
    //      entryPoint: "main": Specifies the shader function.
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    const computePipeline = device.createComputePipeline({
        layout: pipelineLayout,
        compute: { module: shaderModule, entryPoint: "main" }
    });

    // Encoding GPU Commands
    //      commandEncoder: Creates commands for execution.
    //      beginComputePass(): Begins recording compute work.
    //      setPipeline(computePipeline): Uses our compute shader.
    //      setBindGroup(0, bindGroup): Binds buffer resources.
    //      dispatchWorkgroups(1): Runs the shader once.
    //      end(): Ends the compute pass.
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(1);
    passEncoder.end();
    
    // Copying Data from GPU to CPU
    //      copyBufferToBuffer(): Copies GPU results to outputBuffer.
    //      finish(): Finalizes command encoding.
    //      submit(): Sends commands to the GPU.
    commandEncoder.copyBufferToBuffer(buffer, 0, outputBuffer, 0, bufferSize);
    const commands = commandEncoder.finish();
    device.queue.submit([commands]);

    // Reading Results
    //      mapAsync(GPUMapMode.READ): Maps outputBuffer for reading.
    //      getMappedRange(): Retrieves buffer data.
    //      Uint32Array(resultArray): Converts buffer to a usable array.
    //      console.log(resultArray[0]): Prints 4.
    //      unmap(): Releases memory.
    await outputBuffer.mapAsync(GPUMapMode.READ);
    const resultArray = new Uint32Array(outputBuffer.getMappedRange());
    console.log("Result: ", resultArray[0]); // Should print 4
    outputBuffer.unmap();
}

runWebGPUComputation();



// This function demonstrates how to perform a simple computation using WebGPU, a modern API for leveraging the power 
// of the GPU for general-purpose computing. The function follows a structured workflow: it first checks if WebGPU is supported, 
// sets up the necessary GPU resources, runs a small computation in a shader, and retrieves the result back to the CPU. 
// This represents a fundamental pattern in GPU programming—defining computations in a shader, executing them efficiently in parallel, 
// and managing memory between the CPU and GPU.

// At the heart of this computation is a compute shader, a small program that runs directly on the GPU. In this case, the shader is 
// written in WGSL (WebGPU Shading Language) and performs a basic addition operation (2 + 2). The result is stored in a GPU buffer, 
// a region of memory accessible by both the shader and the JavaScript code managing the execution. Since GPUs operate independently 
// of the CPU, this buffer provides a way to transfer data between them. The shader is structured to be bindable, meaning it can 
// interact with input/output data defined in JavaScript.

// The function then builds a compute pipeline, which organizes how the shader is executed. This involves setting up a pipeline 
// layout and a bind group to connect the buffer with the shader. A command encoder is used to issue instructions to the GPU, 
// telling it to run the shader and store the result in memory. Since GPU computations do not automatically return values like 
// CPU functions do, the result must be copied to a second buffer, which is then mapped so JavaScript can read it.

// Finally, the program waits for the computation to complete and reads the output buffer. Since WebGPU operations are asynchronous, 
// the function must explicitly wait for the buffer to be available before accessing its data. Once the result is mapped, 
// it is converted into a readable format and logged to the console. This entire process showcases the fundamental workflow of 
// GPU computing—allocating memory, defining a computation, executing it efficiently on the GPU, and transferring the result back 
// for use in a JavaScript application.
