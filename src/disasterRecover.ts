import { ping } from "./account";
import {LoginBypass} from "./battle-scene";


let instance;
const properties = {
  reconnectTimer: null,
  reconnectInterval: 1000 * 5,
  minTime: 1000 * 5,
  maxTime: 1000 * 60 * 5,
  randVarianceTime: 1 * 10,
};

class DisasterRecover {
  constructor() {
    if (instance) {
      throw new Error("New instance cannot be created!!");
    }
    instance = this;
  }
  setProperties(key, value) {
    properties[key] = value;
  }
  getProperties(key) {
    return properties[key];
  }
  createOfflineBanner() {
    const banner = document.getElementById("banner");
    banner.style.display = "block";
  }

  deleteOfflineBanner() {
    const banner = document.getElementById("banner");
    banner.style.display = "none";
  }

  startInterval() {
    LoginBypass.bypassLogin = true;
    LoginBypass.isDisasterMode = true;
    this.deleteOfflineBanner();
    this.createOfflineBanner();
    const reconnectInterval = this.getProperties("reconnectInterval");
    let reconnectTimer = this.getProperties("reconnectTimer");
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
    }
    reconnectTimer = setInterval(() => this.tryReconnect(), reconnectInterval);
    this.setProperties("reconnectTimer", reconnectTimer);
  }

  tryReconnect(): void {
    ping().then(response => {
      let reconnectInterval = this.getProperties("reconnectInterval");
      let reconnectTimer = this.getProperties("reconnectTimer");
      const maxTime = this.getProperties("maxTime");
      const randVarianceTime = this.getProperties("randVarianceTime");

      if (response) {
        if (reconnectTimer) {
          clearInterval(reconnectTimer);
          this.setProperties("reconnectTimer", null);
        }
        console.log("Reconnected");
        LoginBypass.bypassLogin = false;
        LoginBypass.isDisasterMode = false;
        this.deleteOfflineBanner();
        // window.location.reload();
      } else {
        if (reconnectTimer) {
          clearInterval(reconnectTimer);
          this.setProperties("reconnectTimer", null);
        }
        if (reconnectInterval && maxTime) {
          reconnectInterval = Math.min(reconnectInterval * 2, maxTime); // Set a max delay so it isn't infinite
          this.setProperties("reconnectInterval", reconnectInterval);
        }
        if (randVarianceTime) {
          reconnectTimer =
            setTimeout(
              () => this.tryReconnect(),
              // Adds a random factor to avoid pendulum effect during long total breakdown
              reconnectInterval + (Math.random() * randVarianceTime));
          this.setProperties("reconnectTimer", reconnectTimer);
        }
      }
    });
  }
}


const disasterRecoveryInstance = Object.freeze(new DisasterRecover());
export default disasterRecoveryInstance;
