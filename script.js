"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const sideBar = document.querySelector(".sidebar");

class Workout {
  date = new Date();
  id = this._uniqID();

  constructor(distance, duration, cords) {
    this.distance = distance;
    this.duration = duration;
    this.cords = cords;
  }
  _uniqID() {
    let dt = new Date().getTime();
    let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
    return uuid;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.name[0].toUpperCase()}${this.name.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  name = "running";
  constructor(distance, duration, cords, cadence) {
    super(distance, duration, cords);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}
class Cycling extends Workout {
  name = "cycling";
  constructor(distance, duration, cords, elevationGain) {
    super(distance, duration, cords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          console.log("Could not get your current position");
        }
      );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer(
      `https://tile.jawg.io/jawg-dark/{z}/{x}/{y}.png?access-token=xU6ysfYP0tEcBqSfDbXqwkVZdEnCyv1ZbwvvbPcdVGas3vUrJb7glYU80oApqH7b`,
      {
        attribution:
          '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank" class="jawg-attrib">&copy; <b>Jawg</b>Maps</a> | <a href="https://www.openstreetmap.org/copyright" title="OpenStreetMap is open data licensed under ODbL" target="_blank" class="osm-attrib">&copy; OSM contributors</a>',
      }
    ).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const positiveInputs = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, cadence, duration) ||
        !positiveInputs(distance, cadence, duration)
      )
        return alert("Inputs have to be a positive number");
      workout = new Running(distance, duration, [lat, lng], cadence);
    }
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, elevation, duration) ||
        !positiveInputs(distance, duration)
      )
        return alert("Inputs have to be a positive number");

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    this.#workouts.push(workout);
    this._renderWorkoutMArker(workout);
    this._renderWorkout(workout);

    inputCadence.value =
      inputDistance.value =
      inputDistance.value =
      inputElevation.value =
        "";
  }
  _renderWorkoutMArker(workout) {
    L.marker(workout.cords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.name}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
    form.classList.add("hidden");
  }
  _renderWorkout(workout) {
    console.log(workout);
    const html = `
    <li class="workout workout--${workout.name}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.name === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${
            workout.name === "running"
              ? `${workout.pace.toFixed(1)}`
              : `${workout.speed.toFixed(1)}`
          }</span>
          <span class="workout__unit">${
            workout.name === "running" ? `min/km` : `km/h`
          }</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.name === "running" ? `🦶🏼` : `⛰`
          }</span>
          <span class="workout__value">${
            workout.name === "running"
              ? `${workout.cadence}`
              : `${workout.elevationGain}`
          }</span>
          <span class="workout__unit">${
            workout.name === "running" ? `spm` : `km/h`
          }</span>
        </div>
        </li>`;
    form.insertAdjacentHTML("afterend", html);
  }
}

const app = new App();
