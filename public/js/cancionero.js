document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("lista-canciones");
  const buscador = document.getElementById("buscador");

  fetch("../json/canciones.json")
    .then((response) => response.json())
    .then((canciones) => {
      canciones.sort((a, b) => a.titulo.localeCompare(b.titulo));
      mostrarCanciones(canciones);

      buscador.addEventListener("input", () => {
        const filtro = buscador.value.toLowerCase();
        const filtradas = canciones.filter((cancion) =>
          cancion.titulo.toLowerCase().includes(filtro)
        );
        mostrarCanciones(filtradas);
      });
    });

  function mostrarCanciones(canciones) {
    lista.innerHTML = "";
    canciones.forEach((cancion) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `animacion/canciones/${cancion.archivo}`;
      a.rel = "noopener noreferrer";
      a.textContent = cancion.titulo;
      li.appendChild(a);
      lista.appendChild(li);
    });
  }
});
