## a. Comprension del problemaa y modelos planificados.

El objetivo de este examen en si es desarrollar una aplicacion web para poder registrar y administrar incidencias tecnicas de un laboratorio de computacion.

Para poder resolverlo use Node.js y Express para el backend, Sequelize como ORM, SQLite para almacenar los datos y React para la interfaz.

Defini tres modelos principales:
- Usuario: Almacena el nombre, contraseña y rol.
- Equipo: Representa los dispositivos del laboratorio.
- Incidencia: Registra el problema, su estado, el equipo afectado y el usuario que reporto la incidencia. 

Y la ia me ayudo a implementar las sesiones mediante cookies para identificar a los usuarios.

## b. Partes que se delegaron a la IA y por que. 

Utilice ChatGPT como apoyo para organizar la estructura del proyecto, generar una primera version del backend, asi tambien para implementar las rutas y desarrollar la interfaz con React.

Tambien la utilice para mejorar el diseño visual de la pagina web y lograr solucionar los problemas que se generaron durante la ejecucion del programa.

Revise el codigo que me genero y rtambien hice pruebas para comprobar que las funciones principales trabajaran correctamente.

## c. Errores de la IA que corregi.

Revisando los archivos encontre que el archivo `server.js` estaba vacio, por lo que el servidor no iniciaba correctamente. Revise el archivo y le pedi a la ia que creara el codigo y lo agregue al archivo y comprobe que Node.js ejecutara el servidor.

Tambien encontre problemas en los estilos de React, porque algunos textos no se visualizaban correctamente estaban como distorcionados pero ya lueh¿go lo corregi en el archivos css y mejore los colores de la interfaz.

Finalmente, probe la regla de permisos para comprobar que un usuario solamente pudiera cerrar sus propias incidencias. Esta validación se implemento en el backend para evitar que se pudiera modificar desde la interfaz.