let button = document.getElementById("add");
let contenido = document.getElementById("contenido");

const INDEXDB_NAME = "clickBD";
const INDEXDB_VERSION = 1;
const STORE_NAME = "cliksStore";

let db = null;
let counter = 0;

function openDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open(INDEXDB_NAME, INDEXDB_VERSION);

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        let objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

openDB()
  .then((database) => {
    db = database;
    displayAllNotes();
    button.addEventListener("click", addNots);
  })
  .catch((error) => {
    console.error("Error al abrir la base de datos: " + error);
  });

  function displayAllNotes() {
    if (!db) {
      console.error("La base de datos no está abierta.");
      return;
    }
  
    let transaction = db.transaction([STORE_NAME], "readonly");
    let objectStore = transaction.objectStore(STORE_NAME);
    let request = objectStore.getAll();
  
    request.onsuccess = (event) => {
      let allNotes = event.target.result;
  
      if (allNotes.length > 0) {
        let maxId = Math.max(...allNotes.map(note => note.id));
        counter = maxId + 1;
  
        allNotes.forEach((note) => {
          createNoteElement(note);
          // Agrega el evento para detectar cambios en el textarea y actualizar la base de datos
          addChangeEvent(note.id);
        });
      }
    };
  
    request.onerror = (event) => {
      console.error("Error al obtener todas las notas: " + event.target.error);
    };
  }
  
  // Función para agregar el evento de cambio al textarea
  function addChangeEvent(id) {
    let textarea = document.getElementById(id).querySelector('.textarea');
    textarea.addEventListener('input', function () {
      let valorTextarea = this.value;
      let data = { "id": id, "textArea": valorTextarea };
  
      // Actualiza la base de datos con el nuevo valor del textarea
      updateData(data)
        .catch((error) => {
          console.error("Error updateData: " + error);
        });
    });
  }
  
  function createNoteElement(data) {
    let notas = document.createElement("div");
    notas.innerHTML = `
      <div id="${data.id}" class="notas">
        <div class="opcionesNotas">
          <button class="anadirNota">😀</button>
          <button class="borrarNota" data-id="${data.id}">🗑</button>
        </div>
        <div class="contenidoNota">
          <textarea class="textarea">${data.textArea}</textarea>
        </div>
      </div>`;
  
    contenido.appendChild(notas);
  
    let botonBorrar = notas.querySelector('.borrarNota');
  
    botonBorrar.addEventListener('click', () => {
      let notaIdToDelete = parseInt(botonBorrar.getAttribute('data-id'));
      let data = { "id": notaIdToDelete };
  
      deletData(data)
        .then(() => {
          notas.remove();
        })
        .catch((error) => {
          console.error("Error deletData: " + error);
        });
    });
  }

function addNots() {
  let notaId = counter++;

  let notas = document.createElement("div");
  notas.innerHTML = `
    <div id="${notaId}" class="notas">
      <div class="opcionesNotas">
        <button class="anadirNota">😀</button>
        <button class="borrarNota" data-id="${notaId}">🗑</button>
      </div>
      <div class="contenidoNota">
        <textarea class="textarea"></textarea>
      </div>
    </div>`;

  contenido.appendChild(notas);

  let botonAnadir = notas.querySelector('.anadirNota');
  let textarea = notas.querySelector('.textarea');

  botonAnadir.addEventListener('click', () => {
    let valorTextarea = textarea.value;
    let data = { "id": notaId, "textArea": valorTextarea };

    // Verificar si el registro con el mismo id ya existe
    getDataById(notaId)
      .then(existingData => {
        if (existingData) {
          // Si ya existe, actualiza el valor del textarea
          existingData.textArea = valorTextarea;
          return updateData(existingData);
        } else {
          // Si no existe, agrega un nuevo registro
          return addData(data);
        }
      })
      .then(() => {
        counter++;
      })
      .catch((error) => {
        console.error("Error addData/updateData: " + error);
      });
  });

  let botonBorrar = notas.querySelector('.borrarNota')

  botonBorrar.addEventListener('click', () => {
    let notaIdToDelete = parseInt(botonBorrar.getAttribute('data-id'));
    let data = { "id": notaIdToDelete };

    deletData(data)
      .then(() => {
        notas.remove();
      })
      .catch((error) => {
        console.error("Error deletData: " + error);
      });
  });
}

// Función para obtener datos por ID
function getDataById(id) {
  if (!db) {
    throw new Error("La base de datos no está abierta.");
  }

  return new Promise((resolve, reject) => {
    let transaction = db.transaction([STORE_NAME], "readonly");
    let objectStore = transaction.objectStore(STORE_NAME);
    let request = objectStore.get(id);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Función para actualizar datos
function updateData(data) {
  if (!db) {
    throw new Error("La base de datos no está abierta.");
  }

  return new Promise((resolve, reject) => {
    let transaction = db.transaction([STORE_NAME], "readwrite");
    let objectStore = transaction.objectStore(STORE_NAME);
    let request = objectStore.put(data);

    request.onsuccess = (event) => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function addData(data) {
  if (!db) {
    throw new Error("La base de datos no está abierta.");
  }

  return new Promise((resolve, reject) => {
    let transaction = db.transaction([STORE_NAME], "readwrite");
    let objectStore = transaction.objectStore(STORE_NAME);
    let request = objectStore.add(data);
    request.onsuccess = (event) => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function deletData(data) {
  if (!db) {
    throw new Error("La base de datos no está abierta.");
  }

  return new Promise((resolve, reject) => {
    let transaction = db.transaction([STORE_NAME], "readwrite");
    let objectStore = transaction.objectStore(STORE_NAME);
    let request = objectStore.delete(parseInt(data.id));
    request.onsuccess = (event) => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}