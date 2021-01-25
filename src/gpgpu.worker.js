/* global GPUBufferUsage, GPUMapMode */

const computeShaderCode = `
[[block]] struct Particles {
  [[offset(0)]] particles : [[stride(4)]] array<f32>;
};
[[binding(0), group(0)]] var<storage_buffer> particlesA : Particles;
[[binding(1), group(0)]] var<storage_buffer> particlesB : Particles;
[[builtin(global_invocation_id)]] var<in> GlobalInvocationID : vec3<u32>;

[[stage(compute)]]
fn main() -> void {
  var index : u32 = GlobalInvocationID.x;
  var result : f32 = particlesA.particles[index];
  for (var i : u32 = 0u; i < 100u; i = i + 1u) {
    result = result + 1.0;
  }
  particlesB.particles[index] = result;
  return;
}
`;

onmessage = async function (event) {
  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    const device = await adapter.requestDevice();

    // First Matrix
    const n = 1024 * 1024 * 8;
    const firstMatrix = new Float32Array(n);

    const gpuBufferFirstMatrix = device.createBuffer({
      mappedAtCreation: true,
      size: firstMatrix.byteLength,
      usage: GPUBufferUsage.STORAGE,
    });
    const arrayBufferFirstMatrix = gpuBufferFirstMatrix.getMappedRange();
    new Float32Array(arrayBufferFirstMatrix).set(firstMatrix);
    gpuBufferFirstMatrix.unmap();

    // Result Matrix
    const resultMatrixBuffer = device.createBuffer({
      size: firstMatrix.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const computePipeline = device.createComputePipeline({
      computeStage: {
        module: device.createShaderModule({
          code: computeShaderCode,
        }),
        entryPoint: "main",
      },
    });

    const bindGroup = device.createBindGroup({
      layout: computePipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: gpuBufferFirstMatrix,
            offset: 0,
            size: resultMatrixBuffer.byteLength,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: resultMatrixBuffer,
            offset: 0,
            size: resultMatrixBuffer.byteLength,
          },
        },
      ],
    });

    // Get a GPU buffer for reading in an unmapped state.
    const gpuReadBuffer = device.createBuffer({
      size: firstMatrix.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    for (let i = 0; i < 10000000; ++i) {
      const commandEncoder = device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(computePipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatch(firstMatrix.length);
      passEncoder.endPass();

      // Encode commands for copying buffer to buffer.
      commandEncoder.copyBufferToBuffer(
        resultMatrixBuffer /* source buffer */,
        0 /* source offset */,
        gpuReadBuffer /* destination buffer */,
        0 /* destination offset */,
        firstMatrix.byteLength /* size */,
      );

      // Submit GPU commands.
      const gpuCommands = commandEncoder.finish();
      device.defaultQueue.submit([gpuCommands]);
    }

    // Read buffer.
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = gpuReadBuffer.getMappedRange();
    console.log(new Float32Array(arrayBuffer));

    postMessage(1);
  } catch (error) {
    postMessage({ error });
  }
};
