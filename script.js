'use strict';

const textInfo = document.querySelector('.text-info');
const formInfo = document.querySelector('.form-info');
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
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
    //this._setDescription();//etake cl krte hbe child cls e cz type ta child cls ei ache.ekhane dile error asbe
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

//child classes running and cycling
class Running extends Workout {
  type = 'running'; //type add krlam

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  //method for calculating pace: pace is the time it takes to cover a unit of distance. t = d/s so, t is the pace
  calcPace() {
    //min/km মিনিট প্রতি কিমি
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
    //this.type = 'cycling'
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
  #mapZoomLevel = 16;
  #myIcon;
  #workouts = [];
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
    //Move to Marker On Click
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
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
    this.#map = L.map('map').setView(coordinates, this.#mapZoomLevel);

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
    textInfo.classList.add('hideText');
    formInfo.classList.remove('hideText');
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  //hiding the workout form
  _hideForm() {
    // clear input fields
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    textInfo.classList.remove('hideText');
    form.style.display = 'none';
    formInfo.classList.add('hideText');
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  //changing the input field
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //creating new workout form
  _newWorkout(e) {
    e.preventDefault();

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    //getting lat lng from the obj
    const { lat, lng } = this.#mapEvent.latlng;
    //creating workout
    let workout;

    //helper function to check input data. using rest as parameter gives us an array of inputs. that means now we'll loop over the array and see if input is a number or not
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    // checking if the inputs are positive except for elevation gain
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //If workout running, create running object. we'll get cadence input data only if the type is running
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //check if the data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert(`Please Provide a Positive Number`);

      workout = new Running([lat, lng], distance, duration, cadence); //running class e bola hoyeche je ata akta array nibe coords ta. ty this.#mapEvent.latlng eta use krinai. etake destructure kore niyechi.

      // this.#workouts.push(workout); // eta running cycling 2 jaigatei lagbe ty 2ta if block e 2br na die sorasori byre die dei.bt jehetu workout variable ta if block er byre access pawa jabena ty workout take block er byre declare kore dn just eikhane value boshabo
    }

    //If workout cycling, create cycling object. we'll get elevation gain input data only if the type is cycling. for cycling elevation can be negative cz u can go downhill;
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      //check if the data is valid
      if (
        !validInputs(distance, duration, elevationGain) ||
        !allPositive(distance, duration)
      )
        return alert(`Please Provide a Positive Number`);

      workout = new Cycling([lat, lng], distance, duration, elevationGain);
      // this.#workouts.push(workout);
    }

    //Add new object to workout array
    this.#workouts.push(workout);
    //console.log(workout);

    //Render workout on the map as marker
    // const { lat, lng } = this.#mapEvent.latlng;
    //selecting the icon according to the type
    /*
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
      .setPopupContent(
        `${
          type[0].toUpperCase() + type.slice(1)
        } Workout on ${workout.date.toLocaleString('en-Us', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          // hour: '2-digit',
          // minute: '2-digit',
        })}`
      )
      .openPopup();
    */
    this._renderWorkoutMarker(workout);

    //Render workout on the list
    this._renderWorkoutForm(workout);

    //Hide form + clear input fields
    this._hideForm();
  }
  //Render workout on the map as marker
  _renderWorkoutMarker(workout) {
    // const { lat, lng } = this.#mapEvent.latlng;
    //L.marker e error dekhai karon---
    /*renderWorkoutMarker() method-এর ভিতরে তুমি lat এবং lng variable use করছ, কিন্তু এগুলো local scope-এ _newWorkout method-এর মধ্যে declare করা হয়েছিল। renderWorkoutMarker()-এর scope-এ এগুলো নেই। Solution: Workout object-এর সাথে coords already আছে। তাই renderWorkoutMarker()-এ lat, lng destructure করে workout.coords থেকে নাও। এভাবে lat এবং lng সবসময় workout object থেকে আসবে, আর type error বা undefined variable error আর আসবে না। or sorasori  workout.coords likhe dao;*/

    //const [lat, lng] = workout.coords;

    //selecting the icon according to the type
    const selectedIcon = this.#myIcon[workout.type];
    L.marker(workout.coords, { icon: selectedIcon })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  //Render workout on the list
  _renderWorkoutForm(workout) {
    //defining the variables
    const workoutTime = workout.date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const workoutTypeIcon = workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️';
    const paceOrSpeed =
      workout.type === 'running'
        ? workout.pace.toFixed(2)
        : workout.speed.toFixed(2);
    const unitPaceSpeed = workout.type === 'running' ? 'min/km' : 'km/hr';
    const workoutDetailsIcon = workout.type === 'running' ? '🦶🏼' : '⛰';
    const workoutDetailsValue =
      workout.type === 'running' ? workout.cadence : workout.elevationGain;
    const workoutDetailsUnit = workout.type === 'running' ? 'spm' : 'm';

    // prettier-ignore
    const HTML = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description} at ${workoutTime}
      </h2>

      <div class="workout__details">
        <span class="workout__icon">${workoutTypeIcon}</span>
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
        <span class="workout__value">${paceOrSpeed}</span>
        <span class="workout__unit">${unitPaceSpeed}</span>
      </div>

      <div class="workout__details">
        <span class="workout__icon">${workoutDetailsIcon}</span>
        <span class="workout__value">${workoutDetailsValue}</span>
        <span class="workout__unit">${workoutDetailsUnit}</span>
      </div>
    </li>`;

    form.insertAdjacentHTML('afterEnd', HTML);
    /*কেন ul নয়? যদি আমরা <ul> কে target করি: containerWorkouts.insertAdjacentHTML('afterbegin', HTML); এটা নতুন element কে ul-এর শুরুতে বসাবে → form এর আগে। আবার beforeend দিলে সবশেষে যাবে → form-এর পরে না, বরং সব existing workouts এর শেষে। আমরা চাই form-এর ঠিক পরেই। form.insertAdjacentHTML('afterend', HTML) বলছে: “এই form element এর ঠিক পরে HTML বসাও” Parent element কে target করলে: start বা end এ add হবে → ঠিক নির্দিষ্ট জায়গায় control কম। যেই element-এর ঠিক পরেই বসাতে চাও → সেই element কে target কর।এখানে আমরা চাই form-এর ঠিক পরে, তাই form। */
  }
  //Move to Marker On Click
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    //console.log(workoutEl);
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    //console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //using public interface
    workout.click();
    //console.log(workout);
  }
}

const app = new App();
