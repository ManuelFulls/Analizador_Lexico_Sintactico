// Definimos la estructura de un nodo del árbol
class Nodo {
    constructor(valor, hijos = []) {
        this.valor = valor;
        this.hijos = hijos; // Una lista de nodos hijos
    }
}

// Función para generar un árbol de parsing
function generarArbol() {
    // Ejemplo de árbol de parsing con una estructura básica
    const nodoRaiz = new Nodo("S", [
        new Nodo("NP", [
            new Nodo("Det", [new Nodo("el")]),
            new Nodo("N", [new Nodo("niño")]),
        ]),
        new Nodo("VP", [
            new Nodo("V", [new Nodo("corre")]),
            new Nodo("PP", [
                new Nodo("P", [new Nodo("en")]),
                new Nodo("NP", [
                    new Nodo("Det", [new Nodo("el")]),
                    new Nodo("N", [new Nodo("parque")]),
                ]),
            ]),
        ]),
    ]);
    return nodoRaiz;
}

// Función para renderizar el árbol en HTML
function renderizarArbol(nodo, contenedor) {
    if (!nodo) return;

    // Crear el elemento del nodo
    const nodoElemento = document.createElement("div");
    nodoElemento.classList.add("tree-node");

    // Crear el valor del nodo
    const valorNodo = document.createElement("div");
    valorNodo.classList.add("node-value");
    valorNodo.textContent = nodo.valor;

    // Agregar el valor del nodo al nodo principal
    nodoElemento.appendChild(valorNodo);

    // Si el nodo tiene hijos, creamos su contenedor
    if (nodo.hijos.length > 0) {
        const contenedorHijos = document.createElement("div");
        contenedorHijos.classList.add("children");

        // Renderizar los hijos
        nodo.hijos.forEach((hijo) => {
            const contenedorHijo = document.createElement("div");
            contenedorHijo.classList.add("left", "right"); // Posiciones de los nodos
            renderizarArbol(hijo, contenedorHijo);
            contenedorHijos.appendChild(contenedorHijo);
        });

        nodoElemento.appendChild(contenedorHijos);
    }

    // Agregar el nodo al contenedor principal
    contenedor.appendChild(nodoElemento);
}

// Inicialización del árbol en el DOM
window.onload = () => {
    const contenedorArbol = document.querySelector(".tree-container");
    const arbol = generarArbol();
    renderizarArbol(arbol, contenedorArbol);
};
