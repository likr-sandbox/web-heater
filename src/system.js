export async function getCpuTemperature() {
  try {
    const si = window.require("systeminformation");
    const { main } = await si.cpuTemperature();
    return +main;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getGpuTemperature() {
  try {
    const { exec } = window.require("child_process");
    const { promisify } = window.require("util");
    const execAsync = promisify(exec);
    const gpuTempeturyCommand =
      "nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader";
    const result = await execAsync(gpuTempeturyCommand);
    return +result.stdout;
  } catch (error) {
    console.error(error);
    return null;
  }
}
