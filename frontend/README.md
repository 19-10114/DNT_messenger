# MOTO CANDELA Admin

# Introducción

Este proyecto sirve para gestionar toda la información que se muestra en las aplicaciones (tanto web como app) de MOTO CANDELA.

Encontrarás módulos para gestionar productos, categorías, clientes, usuarios, permisos, etc.

### Instalación de Node.js, NVM y PNPM

Antes de ejecutar cualquiera de los comandos abajo explicados, debes asegurarte de tener instalado **[Node.js](https://nodejs.org/es)** ya que es lo que nos va a permitir ejecutar la aplicación del Admin. Es recomendable instalar Node utilizando [NVM](https://github.com/nvm-sh/nvm) ya que así podrás tener varias versiones de Node instaladas en tu máquina.

Para asegurarte de tener la versión correcta de Node, instala [NVM (Node version manager)](https://github.com/nvm-sh/nvm) y asegurate de ejecutar `nvm install v18.0.0`. Esto va a instalar la versión 18 de Node.js que es la que utilizamos en el proyecto.

Luego, para utilizar la versión que necesita el proyecto debes ejecutar `nvm use` y automáticamente se va a seleccionar la **versión 18** de Node.

Si ya instalaste **[Node.js](https://nodejs.org/es)** y [NVM (Node version manager)](https://github.com/nvm-sh/nvm) es hora de instalar [PNPM](https://pnpm.io/installation). Esto nos va a permitir gestionar los paquetes de Node de una mejor forma que con npm. Puedes utilizar los siguientes comandos:

```bash
npm install -g pnpm
```

O

```bash
npm install -g @pnpm/exe
```

Luego de esta instalación, ya podrás ejecutar:

```bash
pnpm install
```

Y por último, puedes poner a andar el proyecto con el comando:

```bash
pnpm dev
```

Este último comando va a abrir el puerto 3000 de tu computadora, entonces en el navegador podrás entrar en la URL [http://localhost:3000](http://localhost:3000) para así poder ver la UI de la aplicación del admin de MOTO CANDELA.

### Clona la aplicación Admin

Este proyecto puedes clonarlo utilizando el comando

```bash
git clone https://gitlab.com/Salvacovelo/dale-play-admin
```

Cuando termine de clonarse, debes entrar en la carpeta utilizando `cd dale-play-admin`. Asegurate de no clonarlo dentro de la carpeta del proyecto de backend. Te recomiendo que crees una carpeta "dalePlay-projects" y ahí adentro clones todos los proyectos con los que vayas a trabajar.
notese que mucha de la estructura de acceso tiene el nombre dalePlay, una de las primera acciones realizadas es nombrar todo como MOTO CANDELA, que es el nombre de la organización actual.
