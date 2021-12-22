// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'pizza_hunt'
// and set it to version 1
const request = indexedDB.open('pizza_hunt', 1);

// this event will emit if the database version changes
// (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store (table) called `new_pizza`,
  // set it to have an auto incrementing primary key of sorts
  db.createObjectStore('new_pizza', { autoIncrement: true });
};

// on success
request.onsuccess = function (event) {
  // when db is successfully created with its object store
  // (from onupgradedneeded event above) or simply established
  // a connection, save reference to db in global variable
  db = event.target.result;
  // check if app is online, if yes run uploadPizza()
  // function to send all local db data to api
  if (navigator.onLine) {
    uploadPizza();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit
// with no internet connection
function saveRecord(record) {
  // open a new transaction with db w/ read/write permissions
  const transaction = db.transaction(['new_pizza'], 'readwrite');

  // access the object store for `new_pizza`
  const pizzaObjectStore = transaction.objectStore('new_pizza');

  // add record to your store with 'add' method
  pizzaObjectStore.add(record);
}

function uploadPizza() {
  // open transaction on db
  const transaction = db.transaction(['new_pizza'], 'readwrite');

  // access object store
  const pizzaObjectStore = transaction.objectStore('new_pizza');

  // get all records from store and set to a variable...
  const getAll = pizzaObjectStore.getAll();

  // ...on success
  getAll.onsuccess = function () {
    // if data exists, send it to api server
    if (getAll.result.length > 0) {
      // POST /api/pizzas endpoint
      fetch('/api/pizzas', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_pizza'], 'readwrite');
          // access the new_pizza obj store
          const pizzaObjectStore = transaction.objectStore('new_pizza');
          // clear items in store, because it has been
          // successfully moved to the DB
          pizzaObjectStore.clear();

          alert('All saved pizza has been submitted');
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadPizza);