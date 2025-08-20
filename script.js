'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//Data Parent Class
class Workout {
  date = new Date();
  id = Date.now().toString(); //creating unique id by converting date into string. bt in real life we shd use a library to create unique id
  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }
}

//child classes running and cycling
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  //method for calculating pace: pace is the time it takes to cover a unit of distance. t = d/s so, t is the pace
  calcPace() {
    //min/km মিনিট প্রতি কিমি
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  //method for calculating speed: Speed is distance traveled per unit of time
  calcSpeed() {
    //km/hr কিমি প্রতি ঘন্টা
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// const run = new Running([145, -12], 4.8, 24, 178);
// const cycle = new Cycling([145, -12], 30, 90, 523);
// console.log(run);
// console.log(cycle);

/**************************************************************************** */
//Application Architecture
//Main functionality -- brains of the project
class App {
  #map;
  #mapEvent;
  #myIcon;
  //constructor
  constructor() {
    //setting the icon
    this.#myIcon = {
      running: L.icon({
        iconUrl: 'run.png',
        iconSize: [30, 30],
      }),
      cycling: L.icon({
        iconUrl: 'bicycle.png',
        iconSize: [30, 30],
      }),
    };
    this._getPosition();
    //form events
    form.addEventListener('submit', this._newWorkout.bind(this));
    //change event of inputs
    inputType.addEventListener('change', this._toggleElevationField);
  }
  //methods
  //getting the location
  _getPosition() {
    //geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Could not get your location`);
        }
      );
    }
  }

  //exact coordinates in map
  _loadMap(position) {
    // coordinate: latitude, longitude
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    //console.log(position), console.log(latitude, longitude);
    //console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    // coordinate: latitude, longitude
    //console.log(this);
    const coordinates = [latitude, longitude];
    this.#map = L.map('map').setView(coordinates, 16);

    // tile layer
    //openstreetmap
    // L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //   attribution:
    //     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    // }).addTo(map);

    //google map
    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(this.#map);

    // marker
    //console.log(map);
    // console.log(L);
    // console.log(L.marker());
    // console.log(L.tileLayer());
    // console.log(L.popup());

    /*কেন map.on ব্যবহার করছি, সাধারণ addEventListener না? কারণ সাধারণ JS event দিলে coordinate (latitude/longitude) পাওয়া যেত না। কিন্তু Leaflet এর event দিলে exact GPS coordinate পাওয়া যায়।*/

    //handling click on map
    this.#map.on(
      'click',
      this._showForm.bind(this)
    ); /*this._showForm :এখন showForm method একটা event handler। JavaScript এ যখন কোনো method event handler হিসেবে call হয়, তখন this সেট হয় ওই element বা object কে যা event listener এ attach করা হয়েছে। Event handler function এ by default this সেই element কে point করে, যেটাতে listener attach করা হয়েছে .এই ক্ষেত্রে, আমরা listener attach করেছি map এ → তাই this এখন map কে point করছে। আমরা চাইছিলাম showForm method এর ভিতরে this.#mapEvent access করতে।কিন্তু যেহেতু this map কে point করছে, তাই আমরা App class এর (mapEvent কে App class এর private property) property access করতে পারছি না।ফলে error আসে: Cannot set property #mapEvent of undefined. আমাদের দরকার this App object কে point করুক।তাই আমরা bind করি:this.#map.on("click", this.showForm.bind(this)); bind(this) করে এখন event handler চললেও: this → App object কে point করবে। আমরা safely access করতে পারব: this.#mapEvent */
  }

  //showing the workout form
  _showForm(mapE) {
    this.#mapEvent = mapE;
    //console.log(mapEvent);
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  //changing the input field
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //creating new workout form
  _newWorkout(e) {
    e.preventDefault();
    console.log(this);
    //clear input fields
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    //display marker
    //console.log(mapEvent);

    const { lat, lng } = this.#mapEvent.latlng;
    //selecting the icon according to the type
    const type = inputType.value;
    const selectedIcon = this.#myIcon[type];
    L.marker([lat, lng], { icon: selectedIcon })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      .setPopupContent(`${type[0].toUpperCase() + type.slice(1)} Workout`)
      .openPopup();
  }
}

const app = new App();
