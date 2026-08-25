
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
    getDatabase, ref, push, onValue, update, remove, query, orderByChild, equalTo, get 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


const firebaseConfig = {
    apiKey: "AIzaSyAklImVDm3dlrW37ysjmH5y09LswMs2IyU",
    authDomain: "my-grocery-list-ff956.firebaseapp.com",
   
    databaseURL: "https://my-grocery-list-ff956-default-rtdb.europe-west1.firebasedatabase.app", 
    projectId: "my-grocery-list-ff956",
    storageBucket: "my-grocery-list-ff956.firebasestorage.app",
    messagingSenderId: "365556603641",
    appId: "1:365556603641:web:ad3f1a3bb8a903adbfa028"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const groceriesRef = ref(db, 'groceries'); 
const templatesRef = ref(db, 'templates'); 

const inputFld = document.getElementById("input-grc");
const inputBtn = document.getElementById("input-btn");
const btnContainer = document.getElementById('btn-container');
const groceryList = document.getElementById('grocery-list');
const ulList = document.querySelector('#grocery-list ul'); 


async function adaugaSauActualizeazaProdus(numeProdus) {
  
    const q = query(groceriesRef, orderByChild('name'), equalTo(numeProdus));
    const snapshot = await get(q);

    if (snapshot.exists()) {
       
        const date = snapshot.val();
        const idNod = Object.keys(date)[0]; 
        const produsExistent = date[idNod];
        const cantitateCurenta = produsExistent.count || 1;
        
        const itemRef = ref(db, `groceries/${idNod}`);
        await update(itemRef, { count: cantitateCurenta + 1 });
    } else {
        
        await push(groceriesRef, {
            name: numeProdus,
            count: 1,
            isChecked: false,
            createdAt: Date.now()
        });
    }
}


inputBtn.addEventListener('click', async () => {   
    let inputValue = inputFld.value.trim();
    if (inputValue) {
        try {
            
            await push(templatesRef, { name: inputValue });
            inputFld.value = ""; 
        } catch (eroare) {
            console.error("Eroare la adăugarea șablonului: ", eroare);
        }
    }
})

btnContainer.addEventListener('click', async (eveniment) => {
    if (eveniment.target.classList.contains('grocery')) {
        const itemName = eveniment.target.textContent;
        try {
            await adaugaSauActualizeazaProdus(itemName);
        } catch (eroare) {
            console.error("Eroare la mutarea în listă: ", eroare);
        }
    } 
    else if (eveniment.target.classList.contains('delete-btn')) {
        const idNod = eveniment.target.getAttribute('data-id');
        if (idNod) {
            const templateRef = ref(db, `templates/${idNod}`);
            try {
                await remove(templateRef);
            } catch (eroare) {
                console.error("Eroare la ștergerea șablonului: ", eroare);
            }
        }
    }
})

onValue(templatesRef, (snapshot) => {
    btnContainer.innerHTML = ""
    
    snapshot.forEach((childSnapshot) => {
        const sablon = childSnapshot.val()
        const idSablon = childSnapshot.key
        btnContainer.innerHTML += `
            <span class="grocery-wrapper">
                <button class="grocery">${sablon.name}</button>
                <button class="delete-btn" data-id="${idSablon}">X</button>
            </span>
        `
    })
    
})
onValue(groceriesRef, function(snapshot) {
   
    let listaProduse = [];
    snapshot.forEach(function(element) {
        let produs = element.val();
        produs.id = element.key; 
        listaProduse.push(produs);
    });

   
    listaProduse.sort(function(a, b) {
        return a.createdAt - b.createdAt;
    });

   
    ulList.innerHTML = ""; 
    
    for (let i = 0; i < listaProduse.length; i++) {
        let produs = listaProduse[i];
    
        let clasaCss = "";
        if (produs.isChecked === true) {
            clasaCss = "checked-item";
        }
        let textCantitate = "";
        if (produs.count > 1) {
            textCantitate = " x" + produs.count
        }

        ulList.innerHTML += `
            <li>
                <span class="grocery-wrapper">
                    <button class="list-item ${clasaCss}" data-id="${produs.id}">
                        ${produs.name}${textCantitate}
                    </button>
                    <button class="delete-btn" data-id="${produs.id}">X</button>
                </span>
            </li>
        `
    }
})

groceryList.addEventListener('click', async (eveniment) => {
    if (eveniment.target.classList.contains('delete-btn')) {
        const idNod = eveniment.target.getAttribute('data-id');
        if (idNod) {
           
            const itemRef = ref(db, `groceries/${idNod}`);
            try {
                await remove(itemRef); 
            } catch (eroare) {
                console.error("Eroare la ștergere: ", eroare);
            }
        }
    } 
    else if (eveniment.target.classList.contains('list-item')) {
        const idNod = eveniment.target.getAttribute('data-id');
        if (idNod) {
            const itemRef = ref(db, `groceries/${idNod}`);
            const esteBifat = eveniment.target.classList.contains('checked-item');
            
            try {
                await update(itemRef, { isChecked: !esteBifat });
            } catch (eroare) {
                console.error("Eroare la bifare: ", eroare);
            }
        }
    }
})