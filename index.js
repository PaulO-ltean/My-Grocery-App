
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


function standardizeazaNume(text) {
    if (!text) return "";
    text = text.trim();
    
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
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
    let textIntrodus = standardizeazaNume(inputFld.value);
    
    if (textIntrodus !== "") {
        await push(templatesRef, { name: textIntrodus });
        inputFld.value = ""; 
    }
})

onValue(templatesRef, function(snapshot) {
    let htmlBuffer = ""; 
    
    snapshot.forEach(function(element) {
        let sablon = element.val();
        let idUnic = element.key;
        
        htmlBuffer += `
            <span class="grocery-wrapper">
                <button class="grocery">${sablon.name}</button>
                <button class="delete-btn" data-id="${idUnic}">X</button>
            </span>
        `;
    });
    
    
    btnContainer.innerHTML = htmlBuffer; 
});

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

   
    let htmlBuffer = ""; 
    
    for (let i = 0; i < listaProduse.length; i++) {
        let produs = listaProduse[i];
        let clasaCss = produs.isChecked ? "checked-item" : "";
        let textCantitate = produs.count > 1 ? " x" + produs.count : "";

       
        htmlBuffer += `
            <li>
                <span class="grocery-wrapper">
                    <button class="list-item ${clasaCss}" data-id="${produs.id}">
                        ${produs.name}${textCantitate}
                    </button>
                    <button class="delete-btn" data-id="${produs.id}">X</button>
                </span>
            </li>
        `;
    }
    
   
    ulList.innerHTML = htmlBuffer;
})

groceryList.addEventListener('click', async function(eveniment) {
    let elementApasat = eveniment.target;
    
    if (elementApasat.classList.contains('delete-btn')) {
        let idNod = elementApasat.getAttribute('data-id');
        let referintaDeSters = ref(db, 'groceries/' + idNod);
        await remove(referintaDeSters);
    } 
    else if (elementApasat.classList.contains('list-item')) {
        let idNod = elementApasat.getAttribute('data-id');
        let referintaDeActualizat = ref(db, 'groceries/' + idNod);
        let esteDejaBifat = elementApasat.classList.contains('checked-item');
        
        if (esteDejaBifat === true) {
            await update(referintaDeActualizat, { isChecked: false });
        } else {
            await update(referintaDeActualizat, { isChecked: true });
        }
    }
});