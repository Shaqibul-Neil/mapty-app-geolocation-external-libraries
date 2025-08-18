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

let map, mapEvent;
//creating custom map icon
const myIcon = L.icon({
  iconUrl: 'run.png',
  iconSize: [30, 35],
});

//geolocation
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      // coordinate: latitude, longitude
      const { latitude } = position.coords;
      const { longitude } = position.coords;

      //console.log(position), console.log(latitude, longitude);
      //console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

      // coordinate: latitude, longitude
      const coordinates = [latitude, longitude];
      map = L.map('map').setView(coordinates, 16);

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
      }).addTo(map);

      // marker

      //console.log(map);
      // console.log(L);
      // console.log(L.marker());
      // console.log(L.tileLayer());
      // console.log(L.popup());

      /*কেন map.on ব্যবহার করছি, সাধারণ addEventListener না? কারণ সাধারণ JS event দিলে coordinate (latitude/longitude) পাওয়া যেত না। কিন্তু Leaflet এর event দিলে exact GPS coordinate পাওয়া যায়।*/

      //handling click on map
      map.on('click', function (mapE) {
        //console.log(mapE);
        mapEvent = mapE;
        //console.log(mapEvent);
        form.classList.remove('hidden');
        inputDistance.focus();
      });
    },
    function () {
      alert(`Could not get your location`);
    }
  );
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  //clear input fields
  inputDistance.value =
    inputCadence.value =
    inputDuration.value =
    inputElevation.value =
      '';
  //display marker
  //console.log(mapEvent);

  const { lat, lng } = mapEvent.latlng;
  L.marker([lat, lng], { icon: myIcon })
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        autoPan: true,
        className: 'running-popup',
      })
    )
    .setPopupContent(`Workout`)
    .openPopup();
});

//change event of inputs
inputType.addEventListener('change', function () {
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});
