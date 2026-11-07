
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
const PORT = 3000;

const db = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false
});

app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || "clave-temporal-examen",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 60 * 1000
  }
}));

const Usuario = db.define("Usuario", {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM("usuario", "tecnico"),
    allowNull: false,
    defaultValue: "usuario"
  }
});

const Equipo = db.define("Equipo", {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const Incidencia = db.define("Incidencia", {
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM("abierta", "cerrada"),
    defaultValue: "abierta",
    allowNull: false
  }
});

Usuario.hasMany(Incidencia);
Incidencia.belongsTo(Usuario);

Equipo.hasMany(Incidencia);
Incidencia.belongsTo(Equipo);

// MIDDLEWARE DE AUTENTICACION

function verificarSesion(req, res, next) {
  if (!req.session.usuarioId) {
    return res.status(401).json({
      error: "Debes iniciar sesion"
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente");
});

// LOGIN

app.post("/api/login", async (req, res) => {
  try {
    const { nombre, password } = req.body;

    if (!nombre || !password) {
      return res.status(400).json({
        error: "Nombre y contraseña obligatorios"
      });
    }

    const usuario = await Usuario.findOne({
      where: { nombre }
    });

    if (!usuario) {
      return res.status(401).json({
        error: "Credenciales incorrectas"
      });
    }

    const valido = await bcrypt.compare(
      password,
      usuario.password
    );

    if (!valido) {
      return res.status(401).json({
        error: "Credenciales incorrectas"
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        return res.status(500).json({
          error: "Error al iniciar sesion"
        });
      }

      req.session.usuarioId = usuario.id;
      req.session.rol = usuario.rol;

      res.json({
        mensaje: "Sesion iniciada",
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          rol: usuario.rol
        }
      });
    });

  } catch (error) {
    res.status(500).json({
      error: "Error en el login"
    });
  }
});

app.get("/api/sesion", verificarSesion, async (req, res) => {
  const usuario = await Usuario.findByPk(
    req.session.usuarioId,
    { attributes: ["id", "nombre", "rol"] }
  );

  if (!usuario) {
    return res.status(401).json({
      error: "Usuario no encontrado"
    });
  }

  res.json(usuario);
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        error: "No se pudo cerrar la sesion"
      });
    }

    res.clearCookie("connect.sid");
    res.json({ mensaje: "Sesion cerrada" });
  });
});

app.get("/api/equipos", verificarSesion, async (req, res) => {
  try {
    const equipos = await Equipo.findAll();
    res.json(equipos);
  } catch (error) {
    res.status(500).json({
      error: "Error al consultar equipos"
    });
  }
});

app.get("/api/incidencias", verificarSesion, async (req, res) => {
  try {
    const incidencias = await Incidencia.findAll({
      include: [
        {
          model: Usuario,
          attributes: ["id", "nombre"]
        },
        {
          model: Equipo,
          attributes: ["id", "nombre"]
        }
      ],
      order: [["id", "DESC"]]
    });

    res.json(incidencias);
  } catch (error) {
    res.status(500).json({
      error: "Error al consultar incidencias"
    });
  }
});

app.post("/api/incidencias", verificarSesion, async (req, res) => {
  try {
    const { equipoId, descripcion } = req.body;

    if (!equipoId || !descripcion?.trim()) {
      return res.status(400).json({
        error: "Equipo y descripcion son obligatorios"
      });
    }

    const equipo = await Equipo.findByPk(equipoId);

    if (!equipo) {
      return res.status(404).json({
        error: "Equipo no encontrado"
      });
    }

    const incidencia = await Incidencia.create({
      descripcion: descripcion.trim(),
      EquipoId: equipo.id,
      UsuarioId: req.session.usuarioId,
      estado: "abierta"
    });

    res.status(201).json(incidencia);

  } catch (error) {
    res.status(500).json({
      error: "Error al registrar incidencia"
    });
  }
});

app.patch(
  "/api/incidencias/:id/cerrar",
  verificarSesion,
  async (req, res) => {
    try {
      const incidencia = await Incidencia.findByPk(
        req.params.id
      );

      if (!incidencia) {
        return res.status(404).json({
          error: "Incidencia no encontrada"
        });
      }

      const esCreador =
        incidencia.UsuarioId === req.session.usuarioId;

      const esTecnico =
        req.session.rol === "tecnico";

      if (!esCreador && !esTecnico) {
        return res.status(403).json({
          error: "No tienes permiso para cerrar esta incidencia"
        });
      }

      if (incidencia.estado === "cerrada") {
        return res.status(400).json({
          error: "La incidencia ya esta cerrada"
        });
      }

      incidencia.estado = "cerrada";
      await incidencia.save();

      res.json({
        mensaje: "Incidencia cerrada correctamente",
        incidencia
      });

    } catch (error) {
      res.status(500).json({
        error: "Error al cerrar incidencia"
      });
    }
  }
);

async function crearDatosIniciales() {
  const usuarios = [
    {
      nombre: "usuario",
      password: "123456",
      rol: "usuario"
    },
    {
      nombre: "tecnico",
      password: "123456",
      rol: "tecnico"
    }
  ];

  for (const datos of usuarios) {
    const existente = await Usuario.findOne({
      where: { nombre: datos.nombre }
    });

    if (!existente) {
      await Usuario.create({
        nombre: datos.nombre,
        password: await bcrypt.hash(datos.password, 10),
        rol: datos.rol
      });
    }
  }

  if (await Equipo.count() === 0) {
    await Equipo.bulkCreate([
      { nombre: "Computadora 1" },
      { nombre: "Computadora 2" },
      { nombre: "Impresora" },
      { nombre: "Proyector" },
      { nombre: "Router" }
    ]);
  }
}

async function iniciarServidor() {
  try {
    await db.authenticate();
    await db.sync();
    await crearDatosIniciales();

    app.listen(PORT, () => {
      console.log(
        `Servidor en http://localhost:${PORT}`
      );
      console.log("Base de datos lista");
    });

  } catch (error) {
    console.error("Error al iniciar:", error);
  }
}

iniciarServidor();
