"use strict";

// ========== GLOBAL VARIABLES ========== //
const _movieRef = _db.collection("movies");
const _userRef = _db.collection("users")
let _currentUser;
let _movies;

// ========== FIREBASE AUTH ========== //
// Listen on authentication state change
firebase.auth().onAuthStateChanged(function (user) {
  if (user) { // if user exists and is authenticated
    userAuthenticated(user);
  } else { // if user is not logged in
    userNotAuthenticated();
  }
});

function userAuthenticated(user) {
  _currentUser = user;
  hideTabbar(false);
  init();
  showLoader(false);
}

function userNotAuthenticated() {
  _currentUser = null; // reset _currentUser
  hideTabbar(true);
  showPage("login");

  // Firebase UI configuration
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    signInSuccessUrl: '#home'
  };
  // Init Firebase UI Authentication
  const ui = new firebaseui.auth.AuthUI(firebase.auth());
  ui.start('#firebaseui-auth-container', uiConfig);
  showLoader(false);
}

// show and hide tabbar
function hideTabbar(hide) {
  let tabbar = document.querySelector('#tabbar');
  if (hide) {
    tabbar.classList.add("hide");
  } else {
    tabbar.classList.remove("hide");
  }
}

// sign out user
function logout() {
  firebase.auth().signOut();
  // reset input fields
  document.querySelector('#name').value = "";
  document.querySelector('#mail').value = "";
  document.querySelector('#birthdate').value = "";
  document.querySelector('#hairColor').value = "";
  document.querySelector('#imagePreview').src = "";
}

// ========== PROFILE PAGE FUNCTIONALITY ========== //
// append user data to profile page
function appendUserData() {
  document.querySelector('#name').value = _currentUser.displayName;
  document.querySelector('#mail').value = _currentUser.email;
  document.querySelector('#birthdate').value = _currentUser.birthdate;
  document.querySelector('#hairColor').value = _currentUser.hairColor;
  document.querySelector('#imagePreview').src = _currentUser.img;
}

// update user data - auth user and database object
function updateUser() {
  let user = firebase.auth().currentUser;

  // update auth user
  user.updateProfile({
    displayName: document.querySelector('#name').value
  });

  // update database user
  _userRef.doc(_currentUser.uid).set({
    img: document.querySelector('#imagePreview').src,
    birthdate: document.querySelector('#birthdate').value,
    hairColor: document.querySelector('#hairColor').value
  }, {
    merge: true
  });
}

// ========== Prieview image function ========== //
function previewImage(file, previewId) {
  if (file) {
    let reader = new FileReader();
    reader.onload = function (event) {
      document.querySelector('#' + previewId).setAttribute('src', event.target.result);
    };
    reader.readAsDataURL(file);
  }
}

// ========== MOVIE FUNCTIONALITY ========== //

// initialize movie references - all movies and user's favourite movies
function init() {
  // init user data and favourite movies
  _userRef.doc(_currentUser.uid).onSnapshot({
    includeMetadataChanges: true
  }, function (userData) {
    if (!userData.metadata.hasPendingWrites && userData.data()) {
      _currentUser = {
        ...firebase.auth().currentUser,
        ...userData.data()
      }; //concating two objects: authUser object and userData objec from the db
      appendUserData();
      appendFavMovies(_currentUser.favMovies);
      if (_movies) {
        appendMovies(_movies); // refresh movies when user data changes
      }
      showLoader(false);
    }
  });

  // init all movies
  _movieRef.onSnapshot(function (snapshotData) {
    _movies = [];
    snapshotData.forEach(function (doc) {
      let movie = doc.data();
      movie.id = doc.id;
      _movies.push(movie);
    });
    appendMovies(_movies);
  });
}

// append movies to the DOM
function appendMovies(movies) {
  let htmlTemplate = "";
  for (let movie of movies) {
    htmlTemplate += `
      <article>
        <h2>${movie.title} (${movie.year})</h2>
        <img src="${movie.img}">
        <p>${movie.description}</p>
        ${generateFavMovieButton(movie.id)}
      </article>
    `;
  }
  document.querySelector('#movie-container').innerHTML = htmlTemplate;
}

function generateFavMovieButton(movieId) {
  let btnTemplate = `
    <button onclick="addToFavourites('${movieId}')">Add to favourites</button>`;
  if (_currentUser.favMovies && _currentUser.favMovies.includes(movieId)) {
    btnTemplate = `
      <button onclick="removeFromFavourites('${movieId}')" class="rm">Remove from favourites</button>`;
  }
  return btnTemplate;
}

// append favourite movies to the DOM
async function appendFavMovies(favMovieIds = []) {
  let htmlTemplate = "";
  if (favMovieIds.length === 0) {
    htmlTemplate = "<p>Please, add movies to favourites.</p>";
  } else {
    for (let movieId of favMovieIds) {
      await _movieRef.doc(movieId).get().then(function (doc) {
        let movie = doc.data();
        movie.id = doc.id;
        htmlTemplate += `
        <article>
          <h2>${movie.title} (${movie.year})</h2>
          <img src="${movie.img}">
          <p>${movie.description}</p>
          <button onclick="removeFromFavourites('${movie.id}')" class="rm">Remove from favourites</button>
        </article>
      `;
      });
    }
  }
  document.querySelector('#fav-movie-container').innerHTML = htmlTemplate;
}

// adds a given movieId to the favMovies array inside _currentUser
function addToFavourites(movieId) {
  showLoader(true);
  _userRef.doc(_currentUser.uid).set({
    favMovies: firebase.firestore.FieldValue.arrayUnion(movieId)
  }, {
    merge: true
  });
}

// removes a given movieId to the favMovies array inside _currentUser
function removeFromFavourites(movieId) {
  showLoader(true);
  _userRef.doc(_currentUser.uid).update({
    favMovies: firebase.firestore.FieldValue.arrayRemove(movieId)
  });
}