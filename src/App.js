import { useEffect, useState } from "react";
import { getGpuTemperature } from "./system.js";
import Worker from "./gpgpu.worker.js";

const worker = new Worker();

worker.onmessage = function (event) {
  if (event.data.error) {
    alert(event.data.error);
  } else {
    alert("ok");
  }
};

function Temperature({ temperature }) {
  const content = temperature == null ? "--" : `${temperature}`;
  return (
    <p className="has-text-centered p-5">
      <span className="is-size-1 has-background-black has-text-white p-5 has-text-weight-bold is-family-code">
        {content}
      </span>
    </p>
  );
}

function backgroundClass(temperature) {
  if (temperature == null) {
    return "";
  }
  if (temperature < 40) {
    return "has-background-info";
  }
  if (temperature < 60) {
    return "has-background-success";
  }
  if (temperature < 80) {
    return "has-background-warning";
  }
  return "has-background-danger";
}

function App() {
  const [gpuTemperature, setGpuTemperature] = useState(null);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const gpuTemperature = await getGpuTemperature();
      console.log("update");
      setGpuTemperature(gpuTemperature);
    }, 100);
    return () => {
      clearInterval(intervalId);
    };
  });

  return (
    <div className={`app ${backgroundClass(gpuTemperature)}`}>
      <section className="section">
        <div className="container">
          <h1 className="title is-1 has-text-centered">暖房</h1>
          <div className="field">
            <Temperature temperature={gpuTemperature} />
          </div>
          <div className="columns">
            <div className="column is-6 is-offset-4">
              <div className="field">
                <input
                  id="switch"
                  type="checkbox"
                  className="switch is-large"
                  onChange={(event) => {
                    if (event.target.checked) {
                      worker.postMessage({ message: "hello" });
                    }
                  }}
                />
                <label htmlFor="switch">暖房をつける</label>
              </div>
            </div>
          </div>
          <p className="has-text-centered">
            {navigator.gpu ? "WebGPU enabled" : "WebGPU disabled"}
          </p>
        </div>
      </section>
    </div>
  );
}

export default App;
