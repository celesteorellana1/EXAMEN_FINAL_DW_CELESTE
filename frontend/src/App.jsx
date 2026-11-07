import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api";

async function solicitar(ruta, opciones = {}) {
  const respuesta = await fetch(API + ruta, {
    ...opciones,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opciones.headers
    }
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || "Error en la solicitud");
  }

  return datos;
}

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [nombre, setNombre] = useState(""); //usuario
  const [password, setPassword] = useState(""); //123456
  const [equipos, setEquipos] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [equipoId, setEquipoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarDatos() {
    const [listaEquipos, listaIncidencias] =
      await Promise.all([
        solicitar("/equipos"),
        solicitar("/incidencias")
      ]);

    setEquipos(listaEquipos);
    setIncidencias(listaIncidencias);
  }

  useEffect(() => {
    solicitar("/sesion")
      .then(async (datos) => {
        setUsuario(datos);
        await cargarDatos();
      })
      .catch(() => setUsuario(null));
  }, []);

  async function iniciarSesion(e) {
    e.preventDefault();
    setMensaje("");

    try {
      const datos = await solicitar("/login", {
        method: "POST",
        body: JSON.stringify({ nombre, password })
      });

      setUsuario(datos.usuario);
      await cargarDatos();
    } catch (error) {
      setMensaje(error.message);
    }
  }

  async function registrar(e) {
    e.preventDefault();
    setMensaje("");

    try {
      await solicitar("/incidencias", {
        method: "POST",
        body: JSON.stringify({
          equipoId: Number(equipoId),
          descripcion
        })
      });

      setDescripcion("");
      setEquipoId("");
      setMensaje("Incidencia registrada correctamente");
      await cargarDatos();
    } catch (error) {
      setMensaje(error.message);
    }
  }

  async function cerrar(id) {
    try {
      await solicitar(`/incidencias/${id}/cerrar`, {
        method: "PATCH"
      });

      setMensaje("Incidencia cerrada");
      await cargarDatos();
    } catch (error) {
      setMensaje(error.message);
    }
  }

  async function salir() {
    try {
      await solicitar("/logout", { method: "POST" });
      setUsuario(null);
      setEquipos([]);
      setIncidencias([]);
      setMensaje("");
    } catch (error) {
      setMensaje(error.message);
    }
  }

  if (!usuario) {
    return (
      <main className="contenedor login">
        <h1>Gestión de Incidencias</h1>
        <p>Laboratorio de Computación</p>

        <form onSubmit={iniciarSesion}>
          <label>Usuario</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button>Iniciar sesión</button>
        </form>

        <p className="ayuda">
          Prueba: usuario / 123456
          <br />
          Técnico: tecnico / 123456
        </p>

        <p>{mensaje}</p>
      </main>
    );
  }

  return (
    <main className="contenedor">
      <header>
        <div>
          <h1>Gestión de Incidencias</h1>
          <p>
            Bienvenido, {usuario.nombre} |
            Rol: {usuario.rol}
          </p>
        </div>

        <button onClick={salir}>Cerrar sesión</button>
      </header>

      <section className="tarjeta">
        <h2>Registrar incidencia</h2>

        <form onSubmit={registrar}>
          <label>Equipo</label>
          <select
            value={equipoId}
            onChange={(e) => setEquipoId(e.target.value)}
            required
          >
            <option value="">Seleccionar equipo</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.nombre}
              </option>
            ))}
          </select>

          <label>Descripción del problema</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />

          <button>Registrar incidencia</button>
        </form>
      </section>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      <section className="tarjeta">
        <h2>Equipos del laboratorio</h2>
        <ul>
          {equipos.map((equipo) => (
            <li key={equipo.id}>{equipo.nombre}</li>
          ))}
        </ul>
      </section>

      <section className="tarjeta">
        <h2>Listado de incidencias</h2>

        {incidencias.length === 0 && (
          <p>No hay incidencias registradas.</p>
        )}

        {incidencias.map((incidencia) => {
          const puedeCerrar =
            usuario.rol === "tecnico" ||
            incidencia.UsuarioId === usuario.id;

          return (
            <article
              className="incidencia"
              key={incidencia.id}
            >
              <h3>{incidencia.Equipo?.nombre}</h3>
              <p>{incidencia.descripcion}</p>
              <p>
                Registrada por:
                {" "}{incidencia.Usuario?.nombre}
              </p>
              <p>Estado: {incidencia.estado}</p>

              {incidencia.estado === "abierta" &&
                puedeCerrar && (
                  <button
                    onClick={() => cerrar(incidencia.id)}
                  >
                    Cerrar incidencia
                  </button>
                )}
            </article>
          );
        })}
      </section>
    </main>
  );
}